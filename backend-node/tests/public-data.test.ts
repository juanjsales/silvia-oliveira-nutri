import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupPostalCode, searchOpenFoodFacts } from '../src/shared/public-data.js';

test('postal lookup normalizes ViaCEP without sending patient data', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let requestedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ logradouro: 'Rua das Flores', bairro: 'Centro', localidade: 'Niterói', uf: 'RJ' }), { status: 200 });
  }) as typeof fetch;
  const address = await lookupPostalCode('24000-000');
  assert.equal(address?.city, 'Niterói');
  assert.equal(address?.source, 'ViaCEP');
  assert.match(requestedUrl, /24000000/);
  assert.doesNotMatch(requestedUrl, /name|email|patient/i);
});

test('postal lookup falls back to BrasilAPI', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) return new Response('', { status: 503 });
    return new Response(JSON.stringify({ street: 'Av. Brasil', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ' }), { status: 200 });
  }) as typeof fetch;
  const address = await lookupPostalCode('20040002');
  assert.equal(address?.source, 'BrasilAPI');
  assert.equal(calls, 2);
});

test('Open Food Facts products are marked as collaborative and need verification', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = (async () => new Response(JSON.stringify({ products: [{
    code: '123', product_name_pt: 'Iogurte natural', brands: 'Marca',
    nutriments: { 'energy-kcal_100g': 70, proteins_100g: 4, carbohydrates_100g: 5, fat_100g: 3 },
  }] }), { status: 200 })) as typeof fetch;
  const foods = await searchOpenFoodFacts('iogurte');
  assert.equal(foods[0]?.external, true);
  assert.equal(foods[0]?.source, 'Open Food Facts');
  assert.match(foods[0]?.verificationNotice || '', /rótulo/i);
});
