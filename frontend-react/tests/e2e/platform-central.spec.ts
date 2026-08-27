import { expect, test } from '@playwright/test';

const clinic = { data: { clinicName: 'Consultório Teste', professionalName: 'Dra. Teste', specialty: 'Nutrição', primaryColor: '#203528', secondaryColor: '#8ca481' } };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/settings/public', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clinic) }));
});

async function authenticateOperator(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { userId: 'operator-1', role: 'ADMIN', name: 'Operador Teste' } }) }));
}

test('protects the platform route from unauthenticated access', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) }));
  await page.goto('/plataforma');
  await expect(page).toHaveURL(/\/login$/);
});

test('lists tenants and opens the technical detail', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma');
  await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible();
  await expect(page.getByText('Clínica Aurora')).toBeVisible();
  await expect(page.getByText('Nutri Horizonte')).toBeVisible();
  await page.getByText('Clínica Aurora').click();
  await expect(page).toHaveURL(/\/plataforma\/tenants\/tenant-aurora$/);
  await expect(page.getByRole('heading', { name: 'Visão técnica' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jobs e histórico' })).toBeVisible();
  await expect(page.getByText('Release validada e promovida.')).toBeVisible();
});

test('shows deterministic empty and error states', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma?mockState=empty');
  await expect(page.getByRole('heading', { name: 'Nenhum tenant por aqui' })).toBeVisible();
  await page.goto('/plataforma?mockState=error');
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar a central' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});
