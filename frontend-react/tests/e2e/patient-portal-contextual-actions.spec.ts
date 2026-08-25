import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const appointment = {
  id: 'appointment-1',
  appointmentDate: '2099-08-25',
  appointmentTime: '10:00',
  durationMinutes: 60,
  appointmentType: 'Consulta online',
  status: 'WAITING',
  meetingUrl: '/portal/video/appointment-1',
};

const portalData = (patientResponse: 'PENDING' | 'CONFIRMED') => ({
  data: {
    patient: { name: 'Paciente Teste', objective: 'Saúde' },
    appointments: [{ ...appointment, patientResponse }],
    plans: [], documents: [], notifications: [], diary: [], exams: [], messages: [],
    requests: [], goals: [], measurements: [], finance: [], settings: null,
    activeConsultation: null,
  },
});

async function mockPortal(
  page: Page,
  patientResponse: 'PENDING' | 'CONFIRMED',
  overrides: Record<string, unknown> = {},
) {
  await page.route('**/api/settings/public', route => route.fulfill({ json: { data: {} } }));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { userId: 'u1', role: 'PATIENT', patientId: 'p1' } } }));
  const response = portalData(patientResponse);
  await page.route('**/api/portal/home', route => route.fulfill({ json: { data: { ...response.data, ...overrides } } }));
}

test('mostra confirmação somente quando a próxima consulta aguarda resposta', async ({ page }) => {
  await mockPortal(page, 'PENDING');
  await page.goto('/portal');

  await expect(page.getByRole('link', { name: 'Confirmar presença' })).toBeVisible();
  await expect(page.locator('.portal-floating-actions')).toHaveCount(0);
});

test('troca o destaque por acesso neutro depois da confirmação', async ({ page }) => {
  await mockPortal(page, 'CONFIRMED');
  await page.goto('/portal');

  await expect(page.getByRole('link', { name: 'Confirmar presença' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver detalhes' })).toBeVisible();
});

test('mantém privacidade dentro do menu Mais no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPortal(page, 'CONFIRMED');
  await page.goto('/portal');
  await page.getByRole('button', { name: 'Mais' }).click();

  await expect(page.getByRole('link', { name: /Privacidade e meus dados/ })).toHaveAttribute('href', '/portal/privacidade');
});

test('avisa sobre uma confirmação posterior sem substituir a próxima consulta', async ({ page }) => {
  await mockPortal(page, 'CONFIRMED', {
    appointments: [
      { ...appointment, patientResponse: 'CONFIRMED' },
      { ...appointment, id: 'appointment-2', appointmentDate: '2099-08-26', patientResponse: 'PENDING' },
    ],
  });
  await page.goto('/portal');

  await expect(page.getByRole('link', { name: 'Revisar e confirmar' })).toBeVisible();
  await expect(page.getByText('Consulta online')).toBeVisible();
});

test('prioriza a sala ao vivo mesmo se a confirmação estiver pendente', async ({ page }) => {
  await mockPortal(page, 'PENDING', {
    activeConsultation: { id: 'encounter-1', appointmentId: appointment.id, meetingUrl: appointment.meetingUrl },
  });
  await page.goto('/portal');

  await expect(page.getByRole('link', { name: 'Entrar na Sala Virtual' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Confirmar presença' })).toHaveCount(0);
});
