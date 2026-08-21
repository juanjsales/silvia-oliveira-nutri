import { expect, test, type Page } from '@playwright/test';

const appointmentId = 'appointment-video-1';
const sessionId = 'session_patient_01';

async function mockPatientIdentity(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { userId: 'user-patient-1', role: 'PATIENT', patientId: 'patient-1', name: 'Paciente Teste' } }),
  }));
  await page.route('**/api/settings/public', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { clinicName: 'Consultório Teste', professionalName: 'Dra. Teste' } }),
  }));
}

async function mockAccess(page: Page) {
  await page.route(`**/api/video/appointments/${appointmentId}/access`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        sessionId,
        state: 'WAITING_PATIENT',
        expiresAt: '2099-08-20T22:00:00.000Z',
        roomUrl: `/videocall.html#sessionId=${sessionId}&joinToken=patient-join-token-with-enough-entropy`,
      },
    }),
  }));
}

test.describe('jornada do paciente na teleconsulta', () => {
  test('pré-entrada permanece íntegra e sem rolagem em diferentes telas', async ({ page }) => {
    await mockPatientIdentity(page);
    await mockAccess(page);

    for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`/portal/video/${appointmentId}`);

      const card = page.locator('.video-prejoin-card');
      const enterButton = page.getByRole('button', { name: 'Testar e entrar na consulta' });
      await expect(card).toBeVisible();
      await expect(enterButton).toBeVisible();

      const [cardBox, buttonBox, dimensions] = await Promise.all([
        card.boundingBox(),
        enterButton.boundingBox(),
        page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight })),
      ]);
      expect(cardBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      expect(cardBox!.y).toBeGreaterThanOrEqual(0);
      expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.innerHeight + 1);
    }
  });

  test('mantém o paciente na pré-checagem quando câmera ou microfone estão bloqueados', async ({ page }) => {
    await mockPatientIdentity(page);
    await mockAccess(page);
    await page.addInitScript(() => {
      if (typeof MediaDevices !== 'undefined') {
        Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
          configurable: true,
          value: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); },
        });
      }
    });

    await page.goto(`/portal/video/${appointmentId}`);
    await page.getByRole('button', { name: 'Testar e entrar na consulta' }).click();

    await expect(page.getByRole('alert')).toContainText('Câmera ou microfone bloqueado');
    await expect(page.getByRole('button', { name: 'Testar novamente' })).toBeVisible();
    await expect(page.locator('iframe[title="Sala de Teleconsulta"]')).toHaveCount(0);
  });

  test('entra após pré-checagem e fecha a mídia quando o servidor encerra a sessão', async ({ page }) => {
    await mockPatientIdentity(page);
    await mockAccess(page);
    let sessionChecks = 0;
    await page.route(`**/api/video/sessions/${sessionId}`, route => {
      sessionChecks += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { sessionId, state: 'ENDED' } }),
      });
    });
    await page.route(`**/api/video/sessions/${sessionId}/join`, route => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Token consumido no cenário isolado.' }),
    }));
    await page.route(`**/api/video/appointments/${appointmentId}/broadcast`, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null }),
    }));
    await page.route('https://unpkg.com/**', route => route.abort());
    await page.addInitScript(() => {
      const track = { stop() {} };
      const stream = { getTracks: () => [track] };
      if (typeof MediaDevices !== 'undefined') {
        Object.defineProperty(MediaDevices.prototype, 'getUserMedia', { configurable: true, value: async () => stream });
      }
    });

    await page.goto(`/portal/video/${appointmentId}`);
    await page.getByRole('button', { name: 'Testar e entrar na consulta' }).click();
    await expect(page.locator('iframe[title="Sala de Teleconsulta"]')).toBeVisible();

    await expect.poll(() => sessionChecks, { timeout: 7_000 }).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: /Consulta concluída/i })).toBeVisible();
    await expect(page.locator('iframe[title="Sala de Teleconsulta"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(id => sessionStorage.getItem(`in_call_${id}`), appointmentId)).toBeNull();
  });
});
