import { expect, test, type Page } from '@playwright/test';

const encounterId = 'enc-responsive-1';
const sessionId = 'session-responsive-1';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

async function mockTeleconsultation(page: Page) {
  await page.route('**/api/**', async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    if (pathname === '/api/auth/me') {
      return json({ user: { userId: 'admin-responsive', role: 'ADMIN', name: 'Dra. Responsiva' } });
    }
    if (pathname === '/api/settings/public') {
      return json({ data: { clinicName: 'Consultório Responsivo', professionalName: 'Dra. Responsiva' } });
    }
    if (pathname === `/api/encounters/${encounterId}`) {
      return json({
        data: {
          id: encounterId,
          patientId: 'patient-responsive',
          patientName: 'Paciente Responsivo',
          objective: 'Validar teleconsulta',
          status: 'IN_PROGRESS',
          startedAt: '2026-08-20T12:00:00.000Z',
          sections: {},
          labs: [],
          supplements: [],
          checkins: [],
        },
      });
    }
    if (pathname === `/api/video/appointments/${encounterId}/access`) {
      return json({
        data: {
          sessionId,
          state: 'WAITING_PATIENT',
          expiresAt: '2099-08-20T22:00:00.000Z',
          roomUrl: `/videocall.html#sessionId=${sessionId}&joinToken=responsive-token-with-enough-entropy`,
        },
      });
    }
    if (pathname === `/api/video/sessions/${sessionId}/join`) {
      return json({ error: 'Sinalização desativada neste teste de layout.' }, 401);
    }
    if (pathname === '/api/encounters/live-status') {
      return json({
        data: {
          activeEncounter: {
            id: encounterId,
            patientId: 'patient-responsive',
            patientName: 'Paciente Responsivo',
            startedAt: '2026-08-20T12:00:00.000Z',
            appointmentId: null,
            appointmentType: 'Consulta online',
            videoRoomToken: 'responsive-room',
          },
          todayAppointments: [],
        },
      });
    }
    if (pathname.endsWith('/broadcast')) return json({ data: null });
    if (pathname === '/api/patients' || pathname === '/api/encounters') return json({ data: [] });
    return json({ data: null });
  });

  await page.route('https://unpkg.com/**', route => route.abort());
  await page.addInitScript(() => {
    const stream = { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] };
    if (typeof MediaDevices !== 'undefined') {
      Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
        configurable: true,
        value: async () => stream,
      });
    }
  });
}

async function expectInsideViewport(page: Page, selector: string) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport indisponível para a asserção responsiva.');
  const boxes = await page.locator(selector).evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    })
    .map(element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        identity: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`,
      };
    }));

  for (const box of boxes) {
    expect(box.left, `${box.identity} ultrapassou a borda esquerda`).toBeGreaterThanOrEqual(-1);
    expect(box.top, `${box.identity} ultrapassou a borda superior`).toBeGreaterThanOrEqual(-1);
    expect(box.right, `${box.identity} ultrapassou a borda direita`).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.bottom, `${box.identity} ultrapassou a borda inferior`).toBeLessThanOrEqual(viewport.height + 1);
  }
}

test.describe('teleconsulta responsiva isolada', () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: mantém split exclusivo, enquadrado e restaurável`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockTeleconsultation(page);
      await page.goto(`/atendimentos?id=${encounterId}&video=true`);

      const split = page.locator('.video-consultation');
      const pip = page.locator('.persistent-video-container.pip-mode');
      const frameContainer = split.locator('.video-frame');
      const iframe = split.locator('iframe[title="Teleconsulta Nutricional"]');

      await expect(split).toBeVisible();
      await expect(iframe).toBeVisible();
      await expect(pip).toHaveCount(0);
      await expect(page.locator('iframe[title="Teleconsulta Nutricional"]')).toHaveCount(1);
      await expectInsideViewport(page, '.video-consultation header button, .video-consultation footer button, .broadcast-toggle-collapse');
      await expectInsideViewport(page, '.video-broadcast-bar');

      const [splitBox, containerBox, iframeBox] = await Promise.all([
        split.boundingBox(),
        frameContainer.boundingBox(),
        iframe.boundingBox(),
      ]);
      expect(splitBox).not.toBeNull();
      expect(containerBox).not.toBeNull();
      expect(iframeBox).not.toBeNull();
      expect(
        containerBox!.height / splitBox!.height,
        'o palco de vídeo foi comprimido por uma linha incorreta da grade',
      ).toBeGreaterThan(0.4);
      expect(Math.abs(iframeBox!.width - containerBox!.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(iframeBox!.height - containerBox!.height)).toBeLessThanOrEqual(2);

      const splitOverflow = await split.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(
        splitOverflow.scrollWidth,
        'controles ou rodapé ultrapassaram a largura do split',
      ).toBeLessThanOrEqual(splitOverflow.clientWidth + 1);

      await split.getByRole('button', { name: /Minimizar/i }).click();
      await expect(split).toHaveCount(0);
      await expect(pip).toBeVisible();
      await expect(page.locator('iframe[title="Teleconsulta Nutricional"]')).toHaveCount(1);
      await expectInsideViewport(page, '.persistent-video-container.pip-mode');
      await expectInsideViewport(page, '.persistent-video-container.pip-mode button');

      await page.evaluate(id => {
        history.pushState({}, '', `/atendimentos/?id=${id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, encounterId);
      await expect(pip).toBeVisible();
      await expect(split).toHaveCount(0);
      await expect(page.locator('iframe[title="Teleconsulta Nutricional"]')).toHaveCount(1);

      await pip.getByTitle('Voltar para a tela da consulta').click();
      await expect(page).toHaveURL(new RegExp(`/atendimentos\\?id=${encounterId}&video=true$`));
      await expect(split).toBeVisible();
      await expect(pip).toHaveCount(0);
      await expect(page.locator('iframe[title="Teleconsulta Nutricional"]')).toHaveCount(1);
    });
  }
});
