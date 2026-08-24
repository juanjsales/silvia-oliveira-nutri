import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('privacy alerts keep request details and recipient address out of notifications and logs', async () => {
  const [privacyRoutes, notificationRoutes, appointmentOutbox, patientRoutes] = await Promise.all([
    readFile(new URL('../src/modules/privacy/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/notifications/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/shared/appointment-email-outbox.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/patients/routes.ts', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(privacyRoutes, /E-mail do Paciente:/);
  assert.doesNotMatch(privacyRoutes, /Detalhes: \$\{body\.details/);
  assert.doesNotMatch(privacyRoutes, /app\.log\.info\(\{\s*requestId\s*,\s*targetEmail/);
  assert.doesNotMatch(notificationRoutes, /COALESCE\(r\.details/);
  assert.match(notificationRoutes, /detalhes informados pelo titular|solicitação LGPD aguardando análise na área protegida/i);
  assert.doesNotMatch(appointmentOutbox, /app\.log\.error\(\{\s*err\s*:/);
  assert.doesNotMatch(patientRoutes, /app\.log\.error\(\{\s*err\s*:/);
});
