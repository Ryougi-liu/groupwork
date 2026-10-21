import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const originalOutput = path.join(siteRoot, '城与友-原图内嵌版.html');
const generatedOutput = path.join(siteRoot, '城与友-新图内嵌版.html');

const originalImages = [
  'hero.webp',
  'spy-portrait.webp',
  'watchman-portrait.webp',
  'act-01.webp',
  'act-02.webp',
  'act-03.webp',
  'act-04.webp',
  'act-05.webp',
].map((name) => path.join(siteRoot, 'assets', 'images', name));

const generatedFolder = 'E:\\Desktop\\新建文件夹';
const generatedImages = [
  'ChatGPT 图像 2026年10月21日 22_47_36-1.png',
  'ChatGPT 图像 2026年10月21日 22_48_00-3.png',
  'ChatGPT 图像 2026年10月21日 22_47_56-2.png',
  'ChatGPT 图像 2026年10月21日 22_48_02-4.png',
  'ChatGPT 图像 2026年10月21日 22_48_04-5.png',
  'ChatGPT 图像 2026年10月21日 22_48_06-6.png',
  'ChatGPT 图像 2026年10月21日 22_48_08-7.png',
  'ChatGPT 图像 2026年10月21日 22_48_11-8.png',
].map((name) => path.join(generatedFolder, name));

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function verifyEmbeddedHtml(outputPath, expectedImages, expectedMime) {
  assert.ok(fs.existsSync(outputPath), `缺少输出文件：${outputPath}`);
  const html = fs.readFileSync(outputPath, 'utf8');

  assert.match(html, /<style>[\s\S]+<\/style>/, 'CSS 应内嵌在 style 标签中');
  assert.match(html, /<script>[\s\S]+<\/script>\s*<\/body>/, 'JS 应在 body 末尾内嵌');
  assert.doesNotMatch(html, /<link\s+rel="stylesheet"/, '不应保留外部样式引用');
  assert.doesNotMatch(html, /<script\s+src=/, '不应保留外部脚本引用');
  assert.doesNotMatch(html, /src="assets\/images\//, '不应保留外部图片引用');

  const matches = [...html.matchAll(new RegExp(`src="data:${expectedMime};base64,([^"]+)"`, 'g'))];
  assert.equal(matches.length, 8, '应当正好内嵌8张图片');

  const actualHashes = matches.map((match) => sha256(Buffer.from(match[1], 'base64')));
  const expectedHashes = expectedImages.map((imagePath) => sha256(fs.readFileSync(imagePath)));
  assert.deepEqual(actualHashes, expectedHashes, '内嵌图片的内容或顺序不正确');

  for (const marker of ['人物表', '第一幕 · 旧曲', '第五幕 · 余烬', '创作核心']) {
    assert.ok(html.includes(marker), `故事正文标记缺失：${marker}`);
  }
}

verifyEmbeddedHtml(originalOutput, originalImages, 'image/webp');
verifyEmbeddedHtml(generatedOutput, generatedImages, 'image/png');

console.log('PASS 两份独立HTML均完整内嵌CSS、JS和8张对应图片');
