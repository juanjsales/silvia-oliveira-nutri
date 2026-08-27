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
  await expect(page.getByRole('heading', { name: 'Onboarding' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jobs e histórico' })).toBeVisible();
  await expect(page.getByText('Release validada e promovida.')).toBeVisible();
});

test('starts the assisted onboarding without an external integration', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma');
  await page.getByRole('button', { name: 'Novo tenant' }).click();
  await expect(page.getByRole('heading', { name: 'Nova nutricionista' })).toBeVisible();
  await page.getByLabel('Nome da clínica').fill('Clínica Teste');
  await page.getByLabel('Identificador').fill('clinica-teste');
  await page.getByLabel('E-mail administrativo').fill('owner@example.test');
  await page.getByRole('button', { name: 'Criar rascunho' }).click();
  await expect(page.getByRole('heading', { name: 'Clínica Teste' })).toBeVisible();
  await expect(page.getByText('Operação manual')).toBeVisible();
});

test('shows deterministic empty and error states', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma?mockState=empty');
  await expect(page.getByRole('heading', { name: 'Nenhum tenant por aqui' })).toBeVisible();
  await page.goto('/plataforma?mockState=error');
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar a central' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

test('explains why Vercel is unavailable when integration is not configured', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma/tenants/tenant-aurora?mockVercel=unavailable');
  await expect(page.getByRole('heading', { name: 'Integração ainda não configurada' })).toBeVisible();
  await expect(page.getByText('Nenhum token deve ser informado nesta tela.')).toBeVisible();
});

test('advances through the guided onboarding with explicit mock mode', async ({ page }) => {
  await authenticateOperator(page);
  await page.goto('/plataforma/tenants/tenant-aurora/onboarding');
  await expect(page.getByRole('heading', { name: 'Preparar nova clínica' })).toBeVisible();
  await expect(page.getByLabel('Etapas do onboarding')).toBeVisible();
  await page.getByRole('button', { name: /Salvar e continuar/ }).click();
  await expect(page.getByRole('heading', { name: 'Projeto Vercel' })).toBeVisible();
  await page.getByLabel('Nome do projeto').fill('clinica-aurora');
  await page.getByRole('button', { name: /Salvar e continuar/ }).click();
  await expect(page.getByRole('heading', { name: 'Banco Supabase' })).toBeVisible();
});
