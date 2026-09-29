// Offline subscription licensing (ECDSA P-256 / SHA-256, WebCrypto-compatible).
// Key format:  FTW1-<base64url(JSON payload)>.<base64url(signature r||s)>
// payload: { v, id, name, org, email, type: 'subscription'|'staff', plan: 'yearly'|'monthly'|undefined,
//            issued: 'YYYY-MM-DD', expires: 'YYYY-MM-DD'|null (staff), machine: 'XXXX-…'|null, seats,
//            facilities: [ids]|undefined (= all), training: bool (default true), role: 'supervisor'|undefined, notes }
// Keys are produced by tools/license-generator.html (or tools/license-tool.mjs) with the vendor's
// private key and verified here with the embedded public key — they cannot be forged or edited.
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PUBLIC_JWK } = require('./license-public.js');

const TRIAL_DAYS = 14;
const DAY = 86400000;
const PUBLIC_KEY = crypto.createPublicKey({ key: PUBLIC_JWK, format: 'jwk' });

function machineId() {
  const nets = os.networkInterfaces();
  const macs = Object.values(nets).flat().filter((n) => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00').map((n) => n.mac).sort();
  const cpu = (os.cpus()[0] || {}).model || '';
  const raw = [os.hostname(), os.platform(), os.arch(), cpu, macs[0] || ''].join('|');
  const h = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  return `${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}`;
}

const b64u = {
  enc: (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
};

const expiryTime = (p) => (p.expires ? Date.parse(`${p.expires}T23:59:59`) : Infinity);

function verifyKey(key, mid = machineId()) {
  const raw = String(key || '').replace(/\s+/g, '');
  if (!raw.startsWith('FTW1-') || !raw.includes('.')) return { ok: false, error: 'Invalid license format' };
  const body = raw.slice(5), dot = body.indexOf('.');
  let payload;
  try {
    const data = b64u.dec(body.slice(0, dot)), sig = b64u.dec(body.slice(dot + 1));
    const ok = crypto.verify('sha256', data, { key: PUBLIC_KEY, dsaEncoding: 'ieee-p1363' }, sig);
    if (!ok) return { ok: false, error: 'License signature is not valid' };
    payload = JSON.parse(data.toString('utf8'));
  } catch (e) {
    return { ok: false, error: 'License could not be verified' };
  }
  if (payload.machine && payload.machine !== '*' && payload.machine.toUpperCase() !== mid) return { ok: false, error: `License is bound to another computer (${payload.machine})` };
  if (payload.type !== 'staff' && expiryTime(payload) < Date.now()) return { ok: false, error: 'License has expired', payload };
  return { ok: true, payload };
}

class LicenseStore {
  constructor(userData) {
    this.file = path.join(userData, 'license.json');
    this.data = {};
    try { this.data = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { this.data = {}; }
    if (!this.data.trialStart) { this.data.trialStart = Date.now(); this.save(); }
  }
  save() { try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.data)); } catch { /* ignore */ } }
  status() {
    const mid = machineId();
    const now = Date.now();
    // Clock-rollback protection: time must never go back more than 2 days
    if (this.data.lastSeen && now < this.data.lastSeen - 2 * DAY) return { state: 'expired', reason: 'clock', machineId: mid, plan: 'trial' };
    this.data.lastSeen = Math.max(now, this.data.lastSeen || 0);
    this.save();
    if (this.data.key) {
      const v = verifyKey(this.data.key, mid);
      const p = v.payload;
      if (v.ok) {
        return {
          state: 'licensed', type: p.type, plan: p.type === 'staff' ? 'staff' : p.plan || 'custom', name: p.name, org: p.org, seats: p.seats,
          expires: p.expires, daysLeft: p.expires ? Math.ceil((expiryTime(p) - now) / DAY) : undefined, machineId: mid, id: p.id,
          facilities: p.facilities || null, training: p.training !== false, role: p.role || 'user',
        };
      }
      if (p) return { state: 'expired', plan: p.plan, name: p.name, org: p.org, expires: p.expires, daysLeft: 0, machineId: mid };
    }
    const end = this.data.trialStart + TRIAL_DAYS * DAY;
    const left = Math.ceil((end - now) / DAY);
    if (left > 0) return { state: 'trial', plan: 'trial', daysLeft: left, expires: new Date(end).toISOString(), machineId: mid, facilities: null, training: true, role: 'supervisor' };
    return { state: 'expired', plan: 'trial', daysLeft: 0, expires: new Date(end).toISOString(), machineId: mid };
  }
  activate(key) {
    const v = verifyKey(key);
    if (!v.ok) return { ok: false, error: v.error };
    this.data.key = String(key).replace(/\s+/g, '');
    this.save();
    return { ok: true, status: this.status() };
  }
}

module.exports = { LicenseStore, verifyKey, machineId, b64u };
