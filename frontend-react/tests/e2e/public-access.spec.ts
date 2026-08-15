import { test, expect } from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/api/auth/me',r=>r.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Sessão necessária.'})}));
  await page.route('**/api/settings/public',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{clinicName:'Consultório Teste',professionalName:'Dra. Teste',specialty:'Nutrição',primaryColor:'#203528',secondaryColor:'#8ca481'}})}));
});

test('login offers a working password recovery route',async({page})=>{await page.goto('/login');await expect(page.getByRole('heading',{name:'Acesse seu espaço'})).toBeVisible();await page.getByRole('link',{name:'Esqueci minha senha'}).click();await expect(page).toHaveURL(/recuperar-senha/);await expect(page.getByRole('heading',{name:'Esqueceu sua senha?'})).toBeVisible()});
test('password recovery keeps account existence private',async({page})=>{await page.route('**/api/auth/password-recovery',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'Se a conta existir, enviaremos as instruções de recuperação.'})}));await page.goto('/recuperar-senha');await page.getByLabel('E-mail ou CPF').fill('naoexiste@example.com');await page.getByRole('button',{name:'Enviar instruções'}).click();await expect(page.getByText('Se a conta existir, enviaremos as instruções de recuperação.',{exact:true})).toBeVisible()});
test('invalid reset link cannot submit a new password',async({page})=>{await page.goto('/redefinir-senha');await expect(page.getByText('O link não contém um token válido.')).toBeVisible();await expect(page.getByRole('button',{name:'Redefinir senha'})).toBeDisabled()});
