import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const sourcePath = path.join(siteRoot, 'index.html');
const cssPath = path.join(siteRoot, 'assets', 'css', 'story.css');
const jsPath = path.join(siteRoot, 'assets', 'js', 'story.js');

const originalImages = [
  ['assets/images/hero.webp', path.join(siteRoot, 'assets', 'images', 'hero.webp'), 'image/webp'],
  ['assets/images/spy-portrait.webp', path.join(siteRoot, 'assets', 'images', 'spy-portrait.webp'), 'image/webp'],
  ['assets/images/watchman-portrait.webp', path.join(siteRoot, 'assets', 'images', 'watchman-portrait.webp'), 'image/webp'],
  ['assets/images/act-01.webp', path.join(siteRoot, 'assets', 'images', 'act-01.webp'), 'image/webp'],
  ['assets/images/act-02.webp', path.join(siteRoot, 'assets', 'images', 'act-02.webp'), 'image/webp'],
  ['assets/images/act-03.webp', path.join(siteRoot, 'assets', 'images', 'act-03.webp'), 'image/webp'],
  ['assets/images/act-04.webp', path.join(siteRoot, 'assets', 'images', 'act-04.webp'), 'image/webp'],
  ['assets/images/act-05.webp', path.join(siteRoot, 'assets', 'images', 'act-05.webp'), 'image/webp'],
];

const generatedFolder = 'E:\\Desktop\\新建文件夹';
const generatedImages = [
  ['assets/images/hero.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_47_36-1.png'), 'image/png'],
  ['assets/images/spy-portrait.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_00-3.png'), 'image/png'],
  ['assets/images/watchman-portrait.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_47_56-2.png'), 'image/png'],
  ['assets/images/act-01.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_02-4.png'), 'image/png'],
  ['assets/images/act-02.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_04-5.png'), 'image/png'],
  ['assets/images/act-03.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_06-6.png'), 'image/png'],
  ['assets/images/act-04.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_08-7.png'), 'image/png'],
  ['assets/images/act-05.webp', path.join(generatedFolder, 'ChatGPT 图像 2026年10月21日 22_48_11-8.png'), 'image/png'],
];

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`找不到文件：${filePath}`);
}

function buildDocument(imageSet) {
  [sourcePath, cssPath, jsPath, ...imageSet.map(([, imagePath]) => imagePath)].forEach(assertFile);

  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');
  let html = fs.readFileSync(sourcePath, 'utf8');

  html = html.replace(
    '  <link rel="stylesheet" href="assets/css/story.css">',
    `  <style>\n${css}\n  </style>`,
  );
  html = html.replace('  <script src="assets/js/story.js" defer></script>\n', '');

  for (const [sourceReference, imagePath, mime] of imageSet) {
    const token = `src="${sourceReference}"`;
    if (!html.includes(token)) throw new Error(`源HTML中缺少图片引用：${sourceReference}`);
    const base64 = fs.readFileSync(imagePath).toString('base64');
    html = html.replace(token, `src="data:${mime};base64,${base64}"`);
  }

  html = html.replace('</body>', `  <script>\n${js}\n  </script>\n</body>`);
  return html;
}

const outputs = [
  [path.join(siteRoot, '城与友-原图内嵌版.html'), originalImages],
  [path.join(siteRoot, '城与友-新图内嵌版.html'), generatedImages],
];

for (const [outputPath, imageSet] of outputs) {
  fs.writeFileSync(outputPath, buildDocument(imageSet), 'utf8');
  console.log(`WROTE ${outputPath}`);
}

