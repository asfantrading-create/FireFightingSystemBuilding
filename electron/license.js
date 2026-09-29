// Offline subscription licensing.
// A license key is  FTW1.<base64url(JSON payload)>.<base64url(Ed25519 signature)>
// payload: { id, name, org, email, plan: 'monthly'|'annual', seats, issued, expires, machine: '<id>'|'*' }
// Keys are signed with the vendor's private key (tools/license-tool.mjs) and verified here
// with the embedded public key, so they cannot be forged or edited.
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PUBLIC_KEY } = require('./license-public.js');

const TRIAL_DAYS = 14;
const DAY = 86400000;

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

function verifyKey(key, mid = machineId()) {
  const parts = String(key || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'FTW1') return { ok: false, error: 'Invalid license format' };
  let payload;
  try {
    const ok = crypto.verify(null, Buffer.from(`${parts[0]}.${parts[1]}`), PUBLIC_KEY, b64u.dec(parts[2]));
    if (!ok) return { ok: false, error: 'License signature is not valid' };
    payload = JSON.parse(b64u.dec(parts[1]).toString('utf8'));
  } catch (e) {
    return { ok: false, error: 'License could not be verified' };
  }
  if (payload.machine && payload.machine !== '*' && payload.machine !== mid) return { ok: false, error: `License is bound to another computer (${payload.machine})` };
  if (!payload.expires || Date.parse(payload.expires) < Date.now()) return { ok: false, error: 'License has expired', payload };
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
      if (v.ok) {
        const p = v.payload;
        return { state: 'licensed', plan: p.plan, name: p.name, org: p.org, seats: p.seats, expires: p.expires, daysLeft: Math.ceil((Date.parse(p.expires) - now) / DAY), machineId: mid, id: p.id };
      }
      if (v.payload) return { state: 'expired', plan: v.payload.plan, name: v.payload.name, org: v.payload.org, expires: v.payload.expires, daysLeft: 0, machineId: mid };
    }
    const end = this.data.trialStart + TRIAL_DAYS * DAY;
    const left = Math.ceil((end - now) / DAY);
    if (left > 0) return { state: 'trial', plan: 'trial', daysLeft: left, expires: new Date(end).toISOString(), machineId: mid };
    return { state: 'expired', plan: 'trial', daysLeft: 0, expires: new Date(end).toISOString(), machineId: mid };
  }
  activate(key) {
    const v = verifyKey(key);
    if (!v.ok) return { ok: false, error: v.error };
    this.data.key = key.trim();
    this.save();
    return { ok: true, status: this.status() };
  }
}

module.exports = { LicenseStore, verifyKey, machineId, b64u };
