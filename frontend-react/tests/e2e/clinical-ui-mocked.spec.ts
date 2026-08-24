import { expect, test, type Page } from '@playwright/test';

const clinic = { data: { clinicName: 'Consultório Teste', professionalName: 'Dra. Teste', specialty: 'Nutrição', primaryColor: '#203528', secondaryColor: '#8ca481' } };

async function mockAdmin(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { userId: 'admin-1', role: 'ADMIN', name: 'Dra. Teste' } }) }));
  await page.route('**/api/settings/public', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clinic) }));
}

test.describe('fluxos clínicos isolados com API simulada', () => {
  test('profissional revisa check-in sem gravar diretamente no prontuário', async ({ page }) => {
    await mockAdmin(page);
    let reviewed = false;
    let reviewCalls = 0;
    const encounter = () => ({
      data: {
        id: 'enc-1', patientId: 'patient-1', patientName: 'Maria Teste', objective: 'Melhorar adesão',
        status: 'IN_PROGRESS', startedAt: '2026-08-15T12:00:00.000Z',
        sections: { anamnesis: { data: { allergies: 'Amendoim' }, savedAt: '2026-08-15T12:10:00.000Z' } },
        labs: [], supplements: [],
        checkins: [{ id: 'checkin-1', answers: { improvements: 'Mais energia', mainDifficulty: 'Jantar', adherence: 7 }, status: reviewed ? 'REVIEWED' : 'PENDING_REVIEW', submittedAt: '2026-08-14T12:00:00.000Z' }],
      },
    });
    await page.route('**/api/patients', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/encounters/patient/patient-1/history', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { encounters: [], labs: [] } }) }));
    await page.route('**/api/encounters/enc-1/checkins/checkin-1/review', async route => {
      reviewCalls += 1;
      reviewed = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { id: 'checkin-1', status: 'REVIEWED' } }) });
    });
    await page.route('**/api/encounters/enc-1', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(encounter()) }));

    await page.goto('/atendimentos?id=enc-1');
    await expect(page.getByRole('heading', { name: 'Essencial para esta decisão' })).toBeVisible();
    await expect(page.getByText('1 check-in para revisar')).toBeVisible();
    await expect(page.getByText('Mais energia')).toBeVisible();
    await expect(page.getByText('Amendoim')).toBeVisible();

    await page.getByRole('button', { name: 'Marcar como revisado' }).click();
    await expect.poll(() => reviewCalls).toBe(1);
    await expect(page.getByText('1 check-in para revisar')).toHaveCount(0);
  });

  test('nova versão exige justificativa clínica antes da publicação', async ({ page }) => {
    await mockAdmin(page);
    let patchCalls = 0;
    await page.route('**/api/nutrition/foods**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/nutrition/plans/plan-2', async route => {
      if (route.request().method() === 'PATCH') {
        patchCalls += 1;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {
        id: 'plan-2', patientName: 'Maria Teste', title: 'Plano ajustado', objective: 'Performance', status: 'DRAFT',
        content: { meals: [{ id: 'meal-1', title: 'Almoço', time: '12:00', notes: '', substitutions: [], items: [] }] },
        sourcePlan: { id: 'plan-1', title: 'Plano vigente', content: { meals: [] } },
      } }) });
    });

    await page.goto('/planos/plan-2');
    await expect(page.locator('input').first()).toHaveValue('Plano ajustado');
    await page.getByRole('button', { name: 'Publicar' }).click();
    await page.getByRole('button', { name: 'Publicar plano' }).click();

    await expect(page.getByText('Registre o motivo da alteração antes de publicar uma nova versão.')).toBeVisible();
    expect(patchCalls).toBe(0);
  });
});
