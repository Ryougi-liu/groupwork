import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const projectRoot = path.resolve(siteRoot, '..');
const tempRoot = path.join(projectRoot, 'tmp', 'pdfs');
const outputRoot = path.join(projectRoot, 'output', 'pdf');
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const printStyles = `
<style>
@page { size: A4 portrait; margin: 12mm; }
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html { font-size: 10pt; background: #08090b !important; }
  body { background: #08090b !important; }
  .reading-progress { display: none !important; }
  .site-nav { position: static !important; top: auto !important; }
  .reveal, .js .reveal { opacity: 1 !important; transform: none !important; }
  .hero { min-height: 260mm !important; break-after: page; }
  .section { padding-block: 12mm !important; }
  .characters-grid, .theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .character-card, .relationship, .dialogue, .theme-card, .timeline li { break-inside: avoid; }
  .act { break-before: page; padding-block: 6mm !important; }
  .act__layout { display: block !important; }
  .act__media { position: static !important; width: 100% !important; max-height: 104mm; margin: 0 0 8mm !important; }
  .act__media img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
  .site-footer { break-before: page; }
  .version-link { display: none !important; }
  a { color: inherit !important; text-decoration: none !important; }
}
</style>`;

const jobs = [
  ['城与友-原图内嵌版.html', '城与友-原图版.pdf'],
  ['城与友-新图内嵌版.html', '城与友-新图版.pdf'],
];

fs.mkdirSync(tempRoot, { recursive: true });
fs.mkdirSync(outputRoot, { recursive: true });

for (const [htmlName, pdfName] of jobs) {
  const sourcePath = path.join(siteRoot, htmlName);
  const tempPath = path.join(tempRoot, htmlName);
  const outputPath = path.join(outputRoot, pdfName);
  if (!fs.existsSync(sourcePath)) throw new Error(`找不到HTML：${sourcePath}`);

  const source = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(tempPath, source.replace('</head>', `${printStyles}\n</head>`), 'utf8');
  if (fs.existsSync(outputPath)) fs.rmSync(outputPath);

  const result = spawnSync(edge, [
    '--headless=new',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=15000',
    '--no-pdf-header-footer',
    `--user-data-dir=${path.join(tempRoot, 'edge-profile')}`,
    `--print-to-pdf=${outputPath}`,
    pathToFileURL(tempPath).href,
  ], { encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 });

  if (result.status !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`PDF生成失败：${pdfName}\n${result.stderr || result.stdout}`);
  }
  console.log(`WROTE ${outputPath}`);
}
