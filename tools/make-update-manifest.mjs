#!/usr/bin/env node
// Writes docs/update/latest.json for the "new version available" notice.
//   node tools/make-update-manifest.mjs --url https://asfanco.com/firetwin/FireProtectionDigitalTwin-Setup-1.2.0.exe
//        [--en "note 1|note 2"] [--ar "ملاحظة 1|ملاحظة 2"] [--mandatory] [--min 1.0.0]
// Without --en/--ar the notes already in docs/update/latest.json are kept (edit them there before a release).
// The release workflow runs this automatically on every v* tag and publishes the result.
// Upload the file to https://asfanco.com/firetwin/latest.json (and/or the public
// asfantrading-create/firetwin-releases repository) — every installed copy checks it on start-up.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const out = path.join(root, 'docs', 'update', 'latest.json');
let prev = {};
try { prev = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* first run */ }
const notes = (k) => (opt(k) ? opt(k).split('|').filter(Boolean) : prev.notes?.[k] || []);
const manifest = {
  version,
  date: new Date().toISOString().slice(0, 10),
  url: opt('url', `https://github.com/asfantrading-create/firetwin-releases/releases/download/v${version}/FireProtectionDigitalTwin-Setup-${version}.exe`),
  page: opt('page', 'https://github.com/asfantrading-create/firetwin-releases/releases/latest'),
  mandatory: args.includes('--mandatory') || (!args.includes('--optional') && !!prev.mandatory && prev.version === version),
  minVersion: opt('min', prev.minVersion || '1.0.0'),
  notes: { en: notes('en'), ar: notes('ar') },
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ ${path.relative(root, out)}\n${JSON.stringify(manifest, null, 2)}`);
