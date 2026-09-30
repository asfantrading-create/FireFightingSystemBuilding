#!/usr/bin/env node
// Publishes a built version to the PUBLIC download repository (no source code there):
//   https://github.com/asfantrading-create/firetwinsystem-releases
// • creates the GitHub Release vX.Y.Z (marked "latest") with the installer, the portable exe,
//   fixed-name copies for the permanent links and the PDF user manuals;
// • updates latest.json in that repository, which every installed copy reads for the
//   "new version available" notice.
// Run by the CI workflow on every v* tag. Needs the secret RELEASES_TOKEN (fine-grained token with
// "Contents: Read and write" on the firetwinsystem-releases repository).
//
// Permanent links for customers:
//   https://github.com/asfantrading-create/firetwinsystem-releases/releases/latest/download/FireProtectionDigitalTwin-Setup.exe
//   https://github.com/asfantrading-create/firetwinsystem-releases/releases/latest
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const OWNER = 'asfantrading-create', REPO = 'firetwinsystem-releases';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.RELEASES_TOKEN;
if (!token) { console.log('::warning::RELEASES_TOKEN secret is not set — skipping the public download page. See docs/seller (section 2).'); process.exit(0); }

const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const tag = process.env.GITHUB_REF_NAME || `v${version}`;
if (tag !== `v${version}`) { console.error(`Tag ${tag} does not match package.json version ${version}`); process.exit(1); }

const api = async (method, url, body, headers = {}) => {
  const r = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body && !(body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!r.ok && r.status !== 404) throw new Error(`${method} ${url} → ${r.status} ${text.slice(0, 300)}`);
  return { status: r.status, data };
};

// 1) the manifest (notes are kept from docs/update/latest.json)
execFileSync(process.execPath, [path.join(root, 'tools', 'make-update-manifest.mjs')], { stdio: 'inherit' });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'update', 'latest.json'), 'utf8'));

// 2) files
const rel = (f) => path.join(root, 'release', f);
const setup = `FireProtectionDigitalTwin-Setup-${version}.exe`, portable = `FireProtectionDigitalTwin-Portable-${version}.exe`;
const files = [
  [rel(setup), setup], [rel(portable), portable],
  [rel(setup), 'FireProtectionDigitalTwin-Setup.exe'], [rel(portable), 'FireProtectionDigitalTwin-Portable.exe'],
  [path.join(root, 'docs', 'manual', 'FireTwin_User_Manual_EN.pdf'), 'FireTwin_User_Manual_EN.pdf'],
  [path.join(root, 'docs', 'manual', 'FireTwin_User_Manual_AR.pdf'), 'FireTwin_User_Manual_AR.pdf'],
].filter(([f]) => fs.existsSync(f));

// 3) release (re-use it when the workflow is re-run)
const bullets = (arr) => (arr || []).map((x) => `- ${x}`).join('\n');
const body = `## Fire Protection Digital Twin ${version}\n\n${bullets(manifest.notes?.en)}\n\n**Download:** \`FireProtectionDigitalTwin-Setup.exe\` (installer) or \`FireProtectionDigitalTwin-Portable.exe\` (no installation).\n\n---\n\n## التوأم الرقمي لأنظمة مكافحة الحريق ${version}\n\n${bullets(manifest.notes?.ar)}\n\n**التنزيل:** ملف التثبيت \`FireProtectionDigitalTwin-Setup.exe\` أو النسخة المحمولة \`FireProtectionDigitalTwin-Portable.exe\`.\n\n© ASFAN Trading · info@asfanco.com · WhatsApp +962 77 614 0404`;
let release = (await api('GET', `/repos/${OWNER}/${REPO}/releases/tags/${tag}`)).data;
if (!release || !release.id) {
  release = (await api('POST', `/repos/${OWNER}/${REPO}/releases`, { tag_name: tag, name: `Fire Protection Digital Twin ${version}`, body, make_latest: 'true' })).data;
  console.log('✓ release created', release.html_url);
} else {
  await api('PATCH', `/repos/${OWNER}/${REPO}/releases/${release.id}`, { body, make_latest: 'true' });
  console.log('✓ release exists, updating assets', release.html_url);
}
for (const [file, name] of files) {
  const old = (release.assets || []).find((a) => a.name === name);
  if (old) await api('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${old.id}`);
  const buf = fs.readFileSync(file);
  await api('POST', `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`, buf, { 'Content-Type': 'application/octet-stream' });
  console.log(`✓ uploaded ${name} (${(buf.length / 1048576).toFixed(1)} MB)`);
}

// 4) latest.json for the update notice
const cur = (await api('GET', `/repos/${OWNER}/${REPO}/contents/latest.json`)).data;
await api('PUT', `/repos/${OWNER}/${REPO}/contents/latest.json`, {
  message: `latest.json → ${version}`, content: Buffer.from(JSON.stringify(manifest, null, 2) + '\n').toString('base64'), ...(cur?.sha ? { sha: cur.sha } : {}),
});
console.log('✓ latest.json updated');
console.log(`\nPermanent download link:\nhttps://github.com/${OWNER}/${REPO}/releases/latest/download/FireProtectionDigitalTwin-Setup.exe`);
