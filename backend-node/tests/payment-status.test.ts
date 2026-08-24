import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionPayment, normalizedPaidAt } from '../src/shared/payment-status.js';
import { ensureAppointmentCharge } from '../src/shared/finance.js';

test('paid payments are immutable until a dedicated refund flow exists',()=>{
  assert.equal(canTransitionPayment('PAID','CANCELLED'),false);
  assert.equal(canTransitionPayment('PAID','PENDING'),false);
});

test('open and overdue payments can be paid or cancelled',()=>{
  assert.equal(canTransitionPayment('PENDING','PAID'),true);
  assert.equal(canTransitionPayment('OVERDUE','PAID'),true);
  assert.equal(canTransitionPayment('OVERDUE','CANCELLED'),true);
});

test('paid timestamp follows payment status',()=>{
  assert.ok(normalizedPaidAt('PAID',undefined));
  assert.equal(normalizedPaidAt('PENDING','2026-08-23T10:00:00.000Z'),null);
});

test('automatic appointment synchronization preserves an already paid charge',async()=>{
  let sql='';
  const db={query:async(text:string)=>{sql=text;return{rows:[{id:'transaction',inserted:false}]}}};
  await ensureAppointmentCharge(db as never,'appointment','user');
  assert.match(sql,/status='PAID' THEN financial_transactions\.amount/);
  assert.match(sql,/status='PAID' THEN financial_transactions\.due_date/);
  assert.match(sql,/status='PAID' THEN financial_transactions\.description/);
});
