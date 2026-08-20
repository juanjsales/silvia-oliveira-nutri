import { expect, test, type Page } from '@playwright/test';

const sessionId = 'session_test_01';
const joinToken = 'join-token-with-enough-entropy-for-an-isolated-test';

async function blockThirdPartySignaling(page: Page) {
  await page.route('https://unpkg.com/**', route => route.abort());
}

test.describe('segurança da sala de teleconsulta isolada', () => {
  test('rejeita link incompleto antes de solicitar mídia ou sinalização', async ({ page }) => {
    let joinCalls = 0;
    await blockThirdPartySignaling(page);
    await page.route('**/api/video/sessions/*/join', route => {
      joinCalls += 1;
      return route.fulfill({ status: 500, body: '{}' });
    });

    await page.goto('/videocall.html');

    await expect(page.locator('#callStatus')).toContainText('Acesso não autorizado');
    await expect(page.locator('#toastMsg')).toContainText('Link de acesso inválido ou incompleto');
    expect(joinCalls).toBe(0);
  });

  test('envia o token pelo corpo e remove o segredo da URL antes da pré-checagem de mídia', async ({ page }) => {
    let receivedBody: unknown;
    await blockThirdPartySignaling(page);
    await page.addInitScript(() => {
      if (typeof MediaDevices !== 'undefined') {
        Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
          configurable: true,
          value: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); },
        });
      }
    });
    await page.route(`**/api/video/sessions/${sessionId}/join`, async route => {
      receivedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sessionId,
            roomKey: 'opaque-room-key',
            participantRole: 'PATIENT',
            expiresAt: '2099-08-20T22:00:00.000Z',
          },
        }),
      });
    });

    await page.goto(`/videocall.html#sessionId=${sessionId}&joinToken=${joinToken}`);

    await expect.poll(() => receivedBody).toEqual({ joinToken });
    await expect(page).toHaveURL(/\/videocall\.html$/);
    expect(page.url()).not.toContain(joinToken);
    await expect(page.locator('#callStatus')).toContainText('Câmera bloqueada');
    await expect(page.locator('#toastMsg')).toContainText('Permita o acesso à câmera e microfone');
  });

  test('notifica término ao contêiner com evento versionado e sem credencial', async ({ page }) => {
    await blockThirdPartySignaling(page);
    await page.addInitScript(() => {
      const track = { enabled: true, stop() {} };
      const stream = {
        getTracks: () => [track],
        getAudioTracks: () => [track],
        getVideoTracks: () => [track],
      };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => stream,
          getDisplayMedia: async () => stream,
        },
      });
      class FakePeer {
        handlers = new Map<string, (...args: unknown[]) => void>();
        constructor() {
          setTimeout(() => this.handlers.get('open')?.('fake-peer-id'), 0);
        }
        on(name: string, handler: (...args: unknown[]) => void) { this.handlers.set(name, handler); }
        call() { return { on() {}, close() {}, open: false }; }
        destroy() {}
      }
      Object.defineProperty(window, 'Peer', { configurable: true, value: FakePeer });
    });
    await page.route(`**/api/video/sessions/${sessionId}/join`, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          sessionId,
          roomKey: 'opaque-room-key',
          participantRole: 'PATIENT',
          expiresAt: '2099-08-20T22:00:00.000Z',
        },
      }),
    }));
    await page.route('**/teleconsult-harness', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><script>window.received=[];addEventListener('message',event=>window.received.push({origin:event.origin,data:event.data}));</script><iframe title="call" src="/videocall.html#sessionId=${sessionId}&joinToken=${joinToken}"></iframe>`,
    }));

    await page.goto('/teleconsult-harness');
    const call = page.frameLocator('iframe[title="call"]');
    await expect(call.locator('#callStatus')).not.toContainText('Acesso não autorizado');
    await call.locator('.btn-hangup').click();

    await expect.poll(() => page.evaluate(() => (window as typeof window & { received: unknown[] }).received)).toEqual([
      {
        origin: new URL(page.url()).origin,
        data: { type: 'TELECONSULT_CALL_ENDED', version: 1, sessionId },
      },
    ]);
  });

});
