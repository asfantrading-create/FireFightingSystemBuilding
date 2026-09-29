// Bundles the renderer (src/) into app/ for Electron.
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'app');
fs.mkdirSync(out, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src', 'app.js')],
  bundle: true, format: 'iife', target: 'chrome120', minify: !process.argv.includes('--dev'),
  sourcemap: process.argv.includes('--dev'), outfile: path.join(out, 'app.js'), legalComments: 'none',
});
for (const f of ['index.html', 'styles.css']) fs.copyFileSync(path.join(root, 'src', f), path.join(out, f));
console.log('✓ renderer built → app/');
