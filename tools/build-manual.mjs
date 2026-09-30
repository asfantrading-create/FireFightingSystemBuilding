// Renders docs/manual/manual.html into the bundled PDF user manuals (EN + AR).
// Needs Playwright's Chromium (dev tool only):  PLAYWRIGHT=/path/to/playwright node tools/build-manual.mjs
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const src = pathToFileURL(path.join(root, 'docs', 'manual', 'manual.html')).href;

const browser = await chromium.launch();
for (const lang of ['en', 'ar']) {
  const page = await browser.newPage();
  await page.goto(`${src}?lang=${lang}`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.waitForTimeout(500);
  const label = lang === 'ar' ? 'دليل المستخدم · التوأم الرقمي لأنظمة مكافحة الحريق' : 'Fire Protection Digital Twin · User Manual';
  await page.pdf({
    path: path.join(root, 'docs', 'manual', `FireTwin_User_Manual_${lang.toUpperCase()}.pdf`),
    format: 'A4', printBackground: true, displayHeaderFooter: true, preferCSSPageSize: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-size:8px;color:#8a94a3;padding:0 14mm;display:flex;justify-content:space-between;font-family:Segoe UI,Tahoma,sans-serif;direction:${lang === 'ar' ? 'rtl' : 'ltr'}"><span>${label}</span><span>© 2026 ASFAN Trading · <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  console.log('✓', lang);
}
// internal seller / release guide (not bundled with the app)
{
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, 'docs', 'seller', 'seller.html')).href);
  await page.pdf({ path: path.join(root, 'docs', 'seller', 'ASFAN_Seller_Guide.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true, preferCSSPageSize: true,
    headerTemplate: '<div></div>', footerTemplate: '<div style="width:100%;font-size:8px;color:#8a94a3;text-align:center;font-family:Segoe UI,Tahoma,sans-serif">ASFAN – دليل البائع · Seller guide · <span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  console.log('✓ seller guide');
}
await browser.close();
