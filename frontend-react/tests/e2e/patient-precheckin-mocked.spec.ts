import { expect, test, type Page } from '@playwright/test';

const portal = {
  data: {
    patient: { name: 'Paciente Teste', objective: 'Melhorar a alimentação' },
    appointments: [{
      id: 'appointment-1',
      appointmentDate: '2099-08-20',
      appointmentTime: '14:30:00',
      appointmentType: 'Retorno',
      durationMinutes: 50,
      status: 'CONFIRMED',
    }],
    plans: [], documents: [], notifications: [], diary: [], exams: [], messages: [],
    requests: [], goals: [], measurements: [], finance: [], settings: null,
  },
};

async function mockPatient(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { userId: 'user-1', role: 'PATIENT', patientId: 'patient-1' } }),
  }));
  await page.route('**/api/settings/public', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { clinicName: 'Consultório Teste', professionalName: 'Dra. Teste' } }),
  }));
  await page.route('**/api/portal/home', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(portal),
  }));
}

test.describe('pré-check-in do paciente com API simulada', () => {
  test('envia respostas vinculadas à consulta futura autenticada', async ({ page }) => {
    await mockPatient(page);
    let submitted: unknown;
    let submitCalls = 0;
    let saved = false;

    await page.route('**/api/portal/checkins', async route => {
      if (route.request().method() === 'POST') {
        submitCalls += 1;
        submitted = route.request().postDataJSON();
        saved = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'checkin-1', status: 'PENDING_REVIEW' } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: saved ? [{ id: 'checkin-1', appointmentId: 'appointment-1', appointmentDate: '2099-08-20', appointmentTime: '14:30', appointmentType: 'Retorno', status: 'PENDING_REVIEW', submittedAt: '2099-08-15T12:00:00.000Z' }] : [] }),
      });
    });

    await page.goto('/portal');
    await page.getByRole('button', { name: 'Preencher agora' }).click();

    await page.getByLabel('O que melhorou').fill('Tenho mais energia durante a tarde.');
    await page.getByLabel('Principal dificuldade').fill('Organizar o jantar.');
    await page.getByLabel('Mudanças de medicamentos').fill('Nenhuma.');
    await page.getByLabel('Sintomas novos').fill('Leve desconforto após o almoço.');
    await page.getByLabel('Adesão (0–10)').fill('7');
    await page.getByLabel('Exames realizados').fill('Hemograma.');
    await page.getByLabel('Assuntos para a consulta').fill('Opções de jantar rápido.');
    await page.getByRole('button', { name: 'Enviar check-in' }).click();

    await expect.poll(() => submitCalls).toBe(1);
    expect(submitted).toEqual({
      appointmentId: 'appointment-1',
      answers: {
        improvements: 'Tenho mais energia durante a tarde.',
        mainDifficulty: 'Organizar o jantar.',
        medicationChanges: 'Nenhuma.',
        newSymptoms: 'Leve desconforto após o almoço.',
        adherence: 7,
        examsCompleted: 'Hemograma.',
        discussionTopics: 'Opções de jantar rápido.',
      },
    });
    await expect(page.getByText('Check-in enviado. Sua nutricionista poderá revisar as respostas antes da consulta.')).toBeVisible();
    await expect(page.getByText('Aguardando revisão')).toBeVisible();
  });
});
