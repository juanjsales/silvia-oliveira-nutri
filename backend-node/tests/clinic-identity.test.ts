import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHtmlEmail } from '../src/integrations/email.js';

test('email branding uses the configured clinic identity', () => {
  const html = buildHtmlEmail({
    title: 'Mensagem de teste',
    lead: 'Conteúdo',
    identity: {
      clinicName: 'Clínica Horizonte',
      professionalName: 'Dra. Marina Costa',
      specialty: 'Nutrição Materno-infantil',
      crn: 'CRN-1 99999',
    },
  });

  assert.match(html, /Clínica Horizonte/);
  assert.match(html, /Dra\. Marina Costa/);
  assert.match(html, /Nutrição Materno-infantil · CRN-1 99999/);
  assert.doesNotMatch(html, /Silvia/i);
});
