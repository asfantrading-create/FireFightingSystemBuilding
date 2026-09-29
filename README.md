# Fire Protection Digital Twin — التوأم الرقمي لأنظمة مكافحة الحريق

An educational, real-time **3D digital-twin simulator of fire-fighting systems** for universities, training centres and engineering companies. Windows desktop app (`.exe`) with **monthly / annual subscription licensing**, full **English / Arabic (RTL)** interface, light & dark themes.

محاكي تعليمي ثلاثي الأبعاد في الزمن الحقيقي لأنظمة مكافحة الحريق، موجّه للجامعات ومراكز التدريب والشركات الهندسية. تطبيق ويندوز (exe) بترخيص اشتراك **شهري أو سنوي**، وواجهة كاملة **بالعربية والإنجليزية**.

![3D digital twin](docs/screenshots/01-high-rise-overview.png)

**Realism:** photographed sky with real clouds (HDRI image-based lighting and reflections), CC0 PBR ground and asphalt textures, and Burj Khalifa built on its true Y-shaped plan with 27 spiralling setbacks and the spire to 828 m. Downtown Dubai is placed from real coordinates: Burj Lake and the Dubai Fountain, Dubai Mall, Souk Al Bahar, Old Town, Sheikh Zayed Road, Business Bay, the canal and the Gulf coast. All art assets are CC0 (free for commercial use, see `src/assets/CREDITS.md`).

![Downtown Dubai](docs/screenshots/08-downtown-dubai.png)

## Facilities (real sites · NFPA reference designs)

| ID | Site | System simulated |
|---|---|---|
| `HIGH_RISE` | **Burj Khalifa**, Dubai (25.197°, 55.274°) — 828 m, 163 floors | Wet sprinklers (LH / OH1), Class I standpipes, 8 pressure zones, floor PRVs, electric + diesel + jockey pumps |
| `WAREHOUSE` | Logistics warehouse, **Aqaba** (representative) | ESFR K-360 rack storage, 12-head design |
| `DATA_CENTER` | Tier III data centre, **Amman** (representative) | FM-200 (HFC-227ea) total flooding, VESDA, cross-zoned release |
| `TANK_FARM` | Crude oil terminal, **Aqaba south coast** (representative) | AFFF 3 % rim-seal pourers, Type II outlets, cooling rings, monitors |
| `HANGAR` | MRO hangar, **Queen Alia International Airport** (representative) | Foam-water deluge (NFPA 409), UV/IR flame detection, low-level monitors |
| `CUSTOM` | **Create facility manually** — any city, occupancy, floors, K-factor, temperature rating | Auto-designed sprinkler + standpipe + pump system |

Site names, coordinates and building facts are public data. **The fire-protection systems are reference designs prepared with NFPA methods for teaching** — they are not the as-built systems of those sites (the app shows a "REFERENCE DESIGN" badge).

## What the simulator does

* **Engineering calculations (Design Data page)** — NFPA 13 density/area, K-factor `Q = K√P`, Hazen–Williams friction, static head, hose allowance, tank sizing, NFPA 14 standpipe demand, NFPA 20 pump selection (churn ≤ 140 %, ≥ 65 % at 150 % flow, jockey/electric/diesel set-points), NFPA 2001 `W = (V/S)·C/(100−C)`, NFPA 11 foam rates & concentrate. SI and US units side by side.
* **Physics simulation** — t² fire growth, Alpert ceiling-jet correlations, RTI sprinkler-bulb heating, smoke/heat detector response, Evans suppression model, pump curves and system compliance, pressure-switch sequencing, water-tank depletion, clean-agent concentration & hold time, foam blanket coverage, fire-service arrival.
* **Fault injection** — power failure (diesel takes over), closed control valve, jockey failure, leak (short-cycling), low tank, detector failure, abort switch, door held open.
* **3D twin** — live labels on each component, click to inspect, x-ray view inside buildings, fire / smoke / water spray / agent fog / foam effects, fire trucks on arrival, playback 1×–60× with timeline scrubbing, screenshots.
* **Dashboard** — live trends, pump curve with moving operating point.
* **Learn** — 11 bilingual lessons (fire basics, sprinklers, hazard classes, pipe schedule, hydraulics, fire pumps, standpipes, detection & alarm, FM-200, foam, NFPA 25).
* **Quiz** — 45 bilingual questions incl. calculations. **Classroom** — hidden-fault troubleshooting challenges, student results, CSV export. **Reports** — PDF simulation report.

| | |
|---|---|
| ![](docs/screenshots/02-fire-floor-xray.png) | ![](docs/screenshots/03-warehouse-esfr-dark.png) |
| ![](docs/screenshots/04-data-centre-fm200.png) | ![](docs/screenshots/05-tank-farm-foam.png) |
| ![](docs/screenshots/06-dashboard.png) | ![](docs/screenshots/07-arabic-rtl.png) |

## Build & run

```bash
npm install
npm start            # run in development
npm test             # engineering / simulation tests
npm run dist:win     # Windows installer + portable .exe → release/
```

Pushing to GitHub runs `.github/workflows/build-windows.yml` on a Windows runner, which produces
`FireProtectionDigitalTwin-Setup-<ver>.exe` (installer) and `FireProtectionDigitalTwin-Portable-<ver>.exe`
as build artifacts; pushing a tag like `v1.0.0` also attaches them to a GitHub Release.

## Licensing (monthly / annual subscriptions) — الترخيص

* New installs run a **14-day trial**. After that the simulator is locked until a license key is activated (Help → License, or the key badge in the top bar).
* Keys are **Ed25519-signed** offline: they cannot be forged or edited, can be bound to one computer (Machine ID) or be site-wide (`*`), and carry the plan, seats and expiry date. System-clock roll-back is detected.

```bash
npm run license:init                 # ONCE: creates keys/private.pem (keep secret, back it up) + public key in the app
npm run build:renderer && npm run dist:win   # rebuild so the app contains your public key

# customer sends you the Machine ID shown in the License window:
npm run license:issue -- --name "University of Jordan" --org "Fire Eng. Lab" --plan annual --seats 30 --machine ABCD-1234-EF56-7890
npm run license:issue -- --name "ACME Engineering" --plan monthly            # not machine-bound
```

Every issued key is appended to `keys/issued/ledger.csv`. **Never commit `keys/`** (it is in `.gitignore`). If `keys/private.pem` is lost, run `npm run license:init -- --force`, rebuild, and re-issue keys.

## Project layout

```
electron/        main process, preload, license verification
src/engine/      design.js (NFPA calculations) · sim.js (physics simulator)
src/scene/       world.js (renderer, sky, terrain, labels) · kit.js (models & effects) · sites.js (facilities)
src/data/        facilities, lessons (EN/AR), quiz (EN/AR)
src/ui/          metrics, pages, license UI
tools/           build.mjs, license-tool.mjs
tests/           engine tests (node --test)
```

Support: info@asfanco.com · WhatsApp +962 77 614 0404 — © 2026 ASFAN Trading
