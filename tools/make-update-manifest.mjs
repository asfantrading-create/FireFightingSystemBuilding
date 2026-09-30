#!/usr/bin/env node
// Writes docs/update/latest.json for the "new version available" notice.
//   node tools/make-update-manifest.mjs --url https://asfanco.com/firetwin/FireProtectionDigitalTwin-Setup-1.2.0.exe
//        [--en "note 1|note 2"] [--ar "ملاحظة 1|ملاحظة 2"] [--mandatory] [--min 1.0.0]
// Upload the file to https://asfanco.com/firetwin/latest.json (and/or the public
// asfantrading-create/firetwin-releases repository) — every installed copy checks it on start-up.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = {
  version,
  date: new Date().toISOString().slice(0, 10),
  url: opt('url', `https://asfanco.com/firetwin/FireProtectionDigitalTwin-Setup-${version}.exe`),
  page: opt('page', 'https://asfanco.com/firetwin/'),
  mandatory: args.includes('--mandatory'),
  minVersion: opt('min', '1.0.0'),
  notes: { en: opt('en', '').split('|').filter(Boolean), ar: opt('ar', '').split('|').filter(Boolean) },
};
const out = path.join(root, 'docs', 'update', 'latest.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ ${path.relative(root, out)}\n${JSON.stringify(manifest, null, 2)}`);
