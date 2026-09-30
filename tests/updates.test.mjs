// Update-notice logic (version comparison, manifest handling, offline fallback).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { cmpVersion, checkForUpdate } = require('../electron/updates.js');

const fakeFetch = (table) => async (url) => {
  const key = Object.keys(table).find((k) => url.startsWith(k));
  if (!key || table[key] instanceof Error) throw table[key] || new Error('offline');
  return { ok: true, status: 200, json: async () => table[key] };
};

test('version comparison', () => {
  assert.equal(cmpVersion('1.2.0', '1.1.9'), 1);
  assert.equal(cmpVersion('v1.10.0', '1.9.3'), 1);
  assert.equal(cmpVersion('1.1.0', '1.1'), 0);
  assert.equal(cmpVersion('1.0.9', '1.1.0'), -1);
});

test('newer manifest → available, with mandatory flag from minVersion', async () => {
  const r = await checkForUpdate('1.1.0', ['https://a/'], fakeFetch({ 'https://a/': { version: '1.2.0', url: 'https://x/setup.exe', minVersion: '1.1.5' } }));
  assert.equal(r.state, 'available'); assert.equal(r.version, '1.2.0'); assert.equal(r.mandatory, true);
});

test('same version → latest; first URL down falls back to the second', async () => {
  const r = await checkForUpdate('1.2.0', ['https://a/', 'https://b/'], fakeFetch({ 'https://a/': new Error('down'), 'https://b/': { version: '1.2.0' } }));
  assert.equal(r.state, 'latest');
});

test('no network → offline (never throws)', async () => {
  const r = await checkForUpdate('1.1.0', ['https://a/'], fakeFetch({}));
  assert.equal(r.state, 'offline');
});
