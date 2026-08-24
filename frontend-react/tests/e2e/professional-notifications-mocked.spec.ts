import { expect, test } from '@playwright/test';

test('central profissional expõe contagem, ações e fechamento por teclado', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/settings/public', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { clinicName: 'Consultório Teste', professionalName: 'Dra. Teste', specialty: 'Nutrição' } }) }));
  await page.route('**/api/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { userId: 'admin-1', role: 'ADMIN', name: 'Dra. Teste' } }) }));
  await page.route('**/api/encounters/live-status', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { activeEncounter: null, todayAppointments: [] } }) }));
  await page.route('**/api/notifications', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'notif-1', type: 'APPOINTMENT_REQUEST', title: 'Novo pedido de consulta', detail: 'Pedido enviado por Maria.', createdAt: '2026-08-23T12:00:00.000Z', link: '/atendimentos', readAt: null, priority: 'HIGH', status: 'ACTIVE' }] }) }));

  await page.goto('/pacientes');
  const trigger = page.getByRole('button', { name: /Abrir central de notificações, 1 não lida/i });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Central de notificações' });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.getByText('Novo pedido de consulta')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Marcar lida', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Dispensar' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
