// Bundles the renderer (src/) into app/ for Electron.
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.FTW_OUT ? path.resolve(process.env.FTW_OUT) : path.join(root, 'app');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src', 'app.js')],
  bundle: true, format: 'iife', target: 'chrome120', minify: !process.argv.includes('--dev'),
  sourcemap: process.argv.includes('--dev'), outfile: path.join(out, 'app.js'), legalComments: 'none',
});
fs.cpSync(path.join(root, 'src', 'assets'), path.join(out, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'src', 'index.html'), path.join(out, 'index.html'));
// styles.css + every module stylesheet under src/advanced/css (concatenated in name order)
const cssDir = path.join(root, 'src', 'advanced', 'css');
const extra = fs.existsSync(cssDir) ? fs.readdirSync(cssDir).filter((f) => f.endsWith('.css')).sort().map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8')) : [];
fs.writeFileSync(path.join(out, 'styles.css'), [fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8'), ...extra].join('\n'));
console.log('✓ renderer built → app/');
