import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(testDir, '..');

function read(relativePath) {
  return readFileSync(path.join(projectDir, relativePath), 'utf8');
}

export function checkPage(relativePath, expectedMode) {
  const html = read(relativePath);
  assert.match(html, new RegExp(`data-version=["']${expectedMode}["']`));

  for (const id of ['characters', 'act-1', 'act-2', 'act-3', 'act-4', 'act-5', 'themes']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `${relativePath} 缺少 #${id}`);
  }
}

export function checkImageInventory() {
  const images = [
    'hero.webp',
    'spy-portrait.webp',
    'watchman-portrait.webp',
    'act-01.webp',
    'act-02.webp',
    'act-03.webp',
    'act-04.webp',
    'act-05.webp',
  ];

  for (const image of images) {
    const imagePath = path.join(projectDir, 'assets', 'images', image);
    assert.ok(statSync(imagePath).size > 10_000, `${image} 必须大于 10 KB`);
  }
}

export function checkImageAlternatives(relativePath) {
  const html = read(relativePath);
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  assert.equal(images.length, 8, `${relativePath} 应包含 8 张图片`);
  for (const image of images) {
    assert.match(image, /\balt=["'][^"']+["']/i, `${relativePath} 的图片缺少替代文字`);
  }
}

export function checkSharedExperience() {
  for (const [file] of pages) {
    const html = read(file);
    assert.match(html, /href=["']assets\/css\/story\.css["']/i, `${file} 未引用共享样式`);
    assert.match(html, /src=["']assets\/js\/story\.js["'][^>]*\bdefer\b/i, `${file} 未引用共享脚本`);
    assert.match(html, /class=["'][^"']*site-nav/i, `${file} 缺少章节导航`);
    assert.match(html, /class=["'][^"']*reading-progress/i, `${file} 缺少阅读进度条`);
  }

  const css = read('assets/css/story.css');
  assert.match(css, /@media\s*\(max-width:\s*720px\)/i, 'CSS 缺少 720px 响应式断点');
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i, 'CSS 缺少减少动态效果规则');
  assert.match(css, /\[data-image-fallback\]\.is-missing/i, 'CSS 缺少图片失败占位规则');
  assert.match(css, /\.site-nav__links a\s*\{[\s\S]*?min-height:\s*44px/i, '导航触控目标高度不得低于 44px');

  const js = read('assets/js/story.js');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|import\s*\(\s*["']https?:/i, '脚本不得发起远程请求');
  assert.match(js, /IntersectionObserver/, '脚本应使用交叉观察器渐进增强');
  assert.match(js, /is-missing/, '脚本应处理图片加载失败');
}

export function checkFullVersion() {
  const html = read('index.html');
  for (const phrase of [
    '间谍', '守夜人', '城邦万民',
    '第一幕 · 旧曲', '第二幕 · 裂痕', '第三幕 · 城与友', '第四幕 · 刃落', '第五幕 · 余烬',
    '多少年了', '我早已投敌', '我没有别的人选', '这是我欠你的',
  ]) {
    assert.ok(html.includes(phrase), `完整版缺少：${phrase}`);
  }
  const cjkCount = [...html.matchAll(/[\u3400-\u9fff]/g)].length;
  assert.ok(cjkCount >= 1_800 && cjkCount <= 4_000, `完整版中文字符数应为 1800–4000，实际 ${cjkCount}`);
  assert.match(html, /href=["']城与友-精简版\.html["']/i, '完整版缺少精简版入口');
}

export function checkLocalAssets(relativePath) {
  const html = read(relativePath);
  assert.doesNotMatch(html, /(?:https?:)?\/\//i, `${relativePath} 含远程资源`);
  const localRefs = [...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
    .map((match) => match[1]);
  for (const ref of localRefs) {
    assert.ok(statSync(path.join(projectDir, ref)).isFile(), `${relativePath} 引用的资源不存在：${ref}`);
  }
}

export function checkConciseVersion() {
  const html = read('城与友-精简版.html');
  for (const title of ['第一幕 · 旧曲', '第二幕 · 裂痕', '第三幕 · 城与友', '第四幕 · 刃落', '第五幕 · 余烬']) {
    assert.ok(html.includes(title), `精简版缺少：${title}`);
  }
  for (let act = 1; act <= 5; act += 1) {
    const section = html.match(new RegExp(`<section[^>]+id=["']act-${act}["'][\\s\\S]*?<\\/section>`, 'i'))?.[0] || '';
    const dialogueCount = (section.match(/class=["'][^"']*\bdialogue\b/gi) || []).length;
    assert.ok(dialogueCount >= 2 && dialogueCount <= 4, `精简版第 ${act} 幕应包含 2–4 段对白，实际 ${dialogueCount}`);
    assert.match(section, /class=["'][^"']*\bturning-point\b/i, `精简版第 ${act} 幕缺少转折句`);
    assert.match(section, /class=["'][^"']*\bnarration\b/i, `精简版第 ${act} 幕缺少剧情摘要`);
  }
  const cjkCount = [...html.matchAll(/[\u3400-\u9fff]/g)].length;
  assert.ok(cjkCount >= 900 && cjkCount <= 1_700, `精简版中文字符数应为 900–1700，实际 ${cjkCount}`);
  assert.match(html, /href=["']index\.html["']/i, '精简版缺少完整版入口');

  checkLocalAssets('城与友-精简版.html');
  checkLocalAssets('index.html');
  for (const asset of ['assets/css/story.css', 'assets/js/story.js']) {
    assert.doesNotMatch(read(asset), /(?:https?:)?\/\//i, `${asset} 含远程资源`);
  }
}

const pages = [
  ['index.html', 'full'],
  ['城与友-精简版.html', 'concise'],
];

for (const [file, mode] of pages) {
  checkPage(file, mode);
  console.log(`PASS ${file} 基础结构`);
}

checkImageInventory();
console.log('PASS 图片资产清单');

for (const [file] of pages) {
  checkImageAlternatives(file);
  console.log(`PASS ${file} 图片替代文字`);
}

checkSharedExperience();
console.log('PASS 共享视觉与交互约束');

checkFullVersion();
console.log('PASS 完整版内容');

checkConciseVersion();
console.log('PASS 精简版内容与离线资源');

