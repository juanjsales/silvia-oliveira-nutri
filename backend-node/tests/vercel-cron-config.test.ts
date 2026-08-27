import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Vercel schedules daily appointment reminder processing on the Hobby plan', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
    crons?: Array<{ path?: string; schedule?: string }>;
  };
  const reminderCron = config.crons?.find(cron => cron.path === '/api/cron/appointment-reminders');

  assert.ok(reminderCron, 'appointment reminder cron must be configured');
  assert.equal(reminderCron.schedule, '0 11 * * *');
});
