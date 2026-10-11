// Build a deployable static site folder (no Node needed at runtime).
// Usage: node scripts/build-site.mjs [theme] [outDir]
//   default: theme "editorial", out "dist/site". The theme is locked and the picker hidden.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {themes} from '../src/registry.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [themeArg = 'editorial', outArg = 'dist/site'] = process.argv.slice(2);
const theme = themes.find(t => t.id === themeArg || t.design === themeArg);
if (!theme) { console.error('Unknown theme: ' + themeArg + '. Use one of: ' + themes.map(t => t.design).join(', ')); process.exit(1); }
const out = path.resolve(root, outArg);
if (!out.startsWith(path.join(root, 'dist'))) { console.error('Refusing to write outside ./dist: ' + out); process.exit(1); }
await fs.rm(out, {recursive: true, force: true});
await fs.mkdir(out, {recursive: true});
for (const f of ['demo.css', 'demo.js', 'favicon.svg', 'LICENSE']) await fs.copyFile(path.join(root, f), path.join(out, f));
await fs.cp(path.join(root, 'src'), path.join(out, 'src'), {recursive: true});
let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace('<html lang="zh-CN">', `<html lang="zh-CN" data-default-theme="${theme.id}" data-lock-theme="true">`)
  .replace(/<label class="theme-picker">/, '<label class="theme-picker" hidden>')
  .replace(/<title>[^<]*<\/title>/, `<title>数字商店 · ${theme.name}</title>`);
if (!html.includes('data-lock-theme')) throw new Error('index.html structure changed; update build-site.mjs');
await fs.writeFile(path.join(out, 'index.html'), html);
// Cloudflare Pages / Workers static assets read this file; other hosts ignore it.
await fs.writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'\n`);
let files = 0, bytes = 0;
async function walk(d) { for (const e of await fs.readdir(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else { files++; bytes += (await fs.stat(p)).size; } } }
await walk(out);
console.log(`Built ${path.relative(root, out)}/ for theme ${theme.design}: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB. Upload the folder contents as the site root.`);
