// "Update available" notice. On start-up (and from Help → Check for updates) the app reads a small
// public JSON manifest and tells the renderer when a newer version exists. Nothing is downloaded or
// installed automatically; the user opens the download link and installs over the old version
// (license and results are kept). Works offline: any network error is silently ignored.
//
// Manifest (docs/update/latest.json):
//   { "version": "1.2.0", "date": "2026-11-01", "url": "https://…/FireProtectionDigitalTwin-Setup-1.2.0.exe",
//     "page": "https://… (optional download page)", "mandatory": false, "minVersion": "1.0.0",
//     "notes": { "en": ["…"], "ar": ["…"] } }
// "mandatory": true, or an installed version older than "minVersion", blocks "Later".

const UPDATE_URLS = [
  'https://raw.githubusercontent.com/asfantrading-create/firetwin-releases/main/latest.json',
  'https://asfanco.com/firetwin/latest.json',
];

/** Compare dotted versions: 1 if a > b, -1 if a < b, 0 if equal. */
function cmpVersion(a, b) {
  const pa = String(a).replace(/^v/, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b).replace(/^v/, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function fetchJson(url, timeoutMs = 8000, fetchFn = null) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const f = fetchFn || require('electron').net.fetch;
    const r = await f(`${url}?t=${Date.now()}`, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/**
 * Returns { state: 'available', current, ...manifest, mandatory } | { state: 'latest', current, version }
 * | { state: 'offline', current, error }.
 */
async function checkForUpdate(current, urls = process.env.FTW_UPDATE_URL ? [process.env.FTW_UPDATE_URL] : UPDATE_URLS, fetchFn = null) {
  let lastErr = 'no manifest';
  for (const url of urls) {
    try {
      const m = await fetchJson(url, 8000, fetchFn);
      if (!m || !m.version) throw new Error('invalid manifest');
      if (cmpVersion(m.version, current) > 0) {
        const mandatory = !!m.mandatory || (m.minVersion && cmpVersion(current, m.minVersion) < 0);
        return { state: 'available', current, ...m, mandatory: !!mandatory };
      }
      return { state: 'latest', current, version: m.version };
    } catch (e) { lastErr = e.message; }
  }
  return { state: 'offline', current, error: lastErr };
}

module.exports = { checkForUpdate, cmpVersion, UPDATE_URLS };
