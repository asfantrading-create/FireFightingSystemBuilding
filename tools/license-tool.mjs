#!/usr/bin/env node
// Vendor license tool (same key format as tools/license-generator.html: ECDSA P-256, WebCrypto-compatible).
//   node tools/license-tool.mjs init [--force]      → create keys/private.jwk.json (SECRET) + electron/license-public.js
//   node tools/license-tool.mjs issue --name "Univ. of Jordan" --plan yearly|monthly [--expires 2027-06-30]
//        [--org ...] [--machine XXXX-XXXX-XXXX-XXXX] [--seats 30] [--facilities HIGH_RISE,WAREHOUSE] [--no-training] [--supervisor] [--staff]
//   node tools/license-tool.mjs verify <key> [--machine ID]
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const privFile = path.join(root, 'keys', 'private.jwk.json');
const pubFile = path.join(root, 'electron', 'license-public.js');
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const iso = (d) => d.toISOString().slice(0, 10);

if (cmd === 'init') {
  if (fs.existsSync(privFile) && !flag('force')) { console.error('keys/private.jwk.json already exists (use --force — all existing licenses stop working).'); process.exit(1); }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  fs.mkdirSync(path.dirname(privFile), { recursive: true });
  fs.writeFileSync(privFile, JSON.stringify(privateKey.export({ format: 'jwk' }), null, 2), { mode: 0o600 });
  const pub = publicKey.export({ format: 'jwk' });
  fs.writeFileSync(pubFile, `// Public key (ECDSA P-256, JWK) used to verify license signatures.\n// The matching private key (keys/private.jwk.json) stays with the vendor and is never committed.\nmodule.exports = { PUBLIC_JWK: ${JSON.stringify(pub)} };\n`);
  const gen = path.join(root, 'tools', 'license-generator.html');
  fs.writeFileSync(gen, fs.readFileSync(gen, 'utf8').replace(/const EMBEDDED_PUB = \{[^}]*\};/, `const EMBEDDED_PUB = ${JSON.stringify(pub)};`));
  console.log('✓ New key pair. Private: keys/private.jwk.json (KEEP SECRET). Public key written to the app and the generator — rebuild the app.');
} else if (cmd === 'issue') {
  if (!fs.existsSync(privFile)) { console.error('keys/private.jwk.json not found — run "npm run license:init" or copy your key there.'); process.exit(1); }
  const staff = flag('staff');
  const plan = staff ? undefined : opt('plan', 'yearly');
  let expires = null;
  if (!staff) {
    if (opt('expires')) expires = opt('expires');
    else { const d = new Date(); d.setMonth(d.getMonth() + (plan === 'monthly' ? 1 : 12)); expires = iso(d); }
  }
  const payload = {
    v: 1, id: crypto.randomUUID(), name: opt('name', 'Customer'), org: opt('org'), email: opt('email'),
    type: staff ? 'staff' : 'subscription', plan: opt('expires') && !staff ? 'custom' : plan, issued: iso(new Date()), expires,
    machine: opt('machine') ? opt('machine').toUpperCase() : null, seats: +opt('seats', 1),
    facilities: opt('facilities') ? opt('facilities').split(',') : undefined, training: flag('no-training') ? false : undefined,
    role: flag('supervisor') ? 'supervisor' : undefined, notes: opt('notes'),
  };
  const data = Buffer.from(JSON.stringify(payload));
  const key = crypto.createPrivateKey({ key: JSON.parse(fs.readFileSync(privFile, 'utf8')), format: 'jwk' });
  const sig = crypto.sign('sha256', data, { key, dsaEncoding: 'ieee-p1363' });
  const lic = `FTW1-${b64u(data)}.${b64u(sig)}`;
  fs.mkdirSync(path.join(root, 'keys', 'issued'), { recursive: true });
  fs.appendFileSync(path.join(root, 'keys', 'issued', 'ledger.csv'), `${payload.issued},${payload.id},"${payload.name}","${payload.org || ''}",${payload.plan || 'staff'},${payload.seats},${payload.expires || '-'},${payload.machine || '*'}\n`);
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nLICENSE KEY:\n' + lic);
} else if (cmd === 'verify') {
  const { verifyKey } = require(path.join(root, 'electron', 'license.js'));
  console.log(verifyKey(args[1], opt('machine', undefined)));
} else {
  console.log('Usage: license-tool.mjs init | issue --name N --plan yearly|monthly [...] | verify <key>');
}
