import { readFile, writeFile } from 'node:fs/promises';

const siteOrigin = 'https://masoom-weds-meeza.publicvm.com';
const data = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8'));
const imageSetting = data.images?.sharePreview || 'og-image.jpg';
const imageUrl = /^https?:\/\//i.test(imageSetting)
  ? imageSetting
  : `${siteOrigin}/${imageSetting.replace(/^\/+/, '')}`;

const pages = ['../index.html', '../envelope/index.html'];
for (const page of pages) {
  const url = new URL(page, import.meta.url);
  let html = await readFile(url, 'utf8');
  html = html.replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${imageUrl}$2`);
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(">)/, `$1${imageUrl}$2`);
  await writeFile(url, html);
}

console.log(`Share preview set to ${imageUrl}`);
