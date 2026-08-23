import { expect, test, type Page } from '@playwright/test';

async function mockPublicLogin(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Sessão necessária.' }),
  }));
  await page.route('**/api/settings/public', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        clinicName: 'Consultório Teste',
        professionalName: 'Dra. Teste',
        specialty: 'Nutrição clínica',
        primaryColor: '#203528',
        secondaryColor: '#8ca481',
      },
    }),
  }));
}

async function expectNoViewportOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: document.documentElement.clientHeight,
  }));
  expect(metrics.documentWidth, 'login must not overflow horizontally').toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.documentHeight, 'login must fit the target viewport without page scrolling').toBeLessThanOrEqual(metrics.viewportHeight + 1);
}

test.beforeEach(async ({ page }) => {
  await mockPublicLogin(page);
});

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'compact mobile', width: 320, height: 568 },
]) {
  test(`login remains complete and usable on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/login');

    const form = page.locator('form.login-card');
    await expect(form).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByLabel('E-mail ou CPF')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Entrar/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Esquec(?:i|eu) (?:a )?sua senha/i })).toBeVisible();

    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.x).toBeGreaterThanOrEqual(0);
    expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(formBox!.y).toBeGreaterThanOrEqual(0);
    expect(formBox!.y + formBox!.height).toBeLessThanOrEqual(viewport.height + 1);
    await expectNoViewportOverflow(page);

    if (viewport.width >= 901) {
      await expect(page.locator('.login-story')).toBeVisible();
    } else {
      await expect(page.locator('.login-story')).toBeHidden();
      await expect(page.locator('.mobile-login-brand')).toBeVisible();
    }
  });
}

test('login controls expose expected semantics and autocomplete hints', async ({ page }) => {
  await page.goto('/login');

  const identifier = page.getByLabel('E-mail ou CPF');
  const password = page.locator('#login-password');
  const submit = page.getByRole('button', { name: /^Entrar/ });

  await expect(identifier).toHaveAttribute('autocomplete', 'username');
  await expect(identifier).toHaveAttribute('required', '');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  await expect(password).toHaveAttribute('required', '');
  await expect(submit).toBeEnabled();

  await identifier.focus();
  await expect(identifier).toBeFocused();
  await password.fill('segredo');
  await expect(password).toHaveAttribute('type', 'password');

  const showPassword = page.getByRole('button', { name: /(?:mostrar|exibir) senha/i });
  if (await showPassword.count()) {
    await showPassword.click();
    await expect(password).toHaveAttribute('type', 'text');
  }
});

test('login communicates pending submission and prevents duplicate requests', async ({ page }) => {
  let releaseLogin!: () => void;
  const pendingLogin = new Promise<void>(resolve => { releaseLogin = resolve; });
  await page.route('**/api/auth/login', async route => {
    await pendingLogin;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Credenciais inválidas.' }),
    });
  });
  await page.goto('/login');
  await page.getByLabel('E-mail ou CPF').fill('paciente@example.com');
  await page.locator('#login-password').fill('senha-incorreta');
  await page.getByRole('button', { name: /^Entrar/ }).click();

  const pendingButton = page.getByRole('button', { name: /Entrando/i });
  await expect(pendingButton).toBeVisible();
  await expect(pendingButton).toBeDisabled();
  releaseLogin();
  await expect(page.getByText('Credenciais inválidas.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Entrar/ })).toBeEnabled();
});

test('login failure is announced accessibly without losing the entered identifier', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Não foi possível entrar com esses dados.' }),
  }));
  await page.goto('/login');
  const identifier = page.getByLabel('E-mail ou CPF');
  await identifier.fill('paciente@example.com');
  await page.locator('#login-password').fill('incorreta');
  await page.getByRole('button', { name: /^Entrar/ }).click();

  await expect(page.getByRole('alert')).toContainText('Não foi possível entrar com esses dados.');
  await expect(identifier).toHaveValue('paciente@example.com');
});
