import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
const source = new URL('../public/', import.meta.url);
const output = new URL('../docs/', import.meta.url);
await mkdir(output, { recursive: true });
for (const filename of await readdir(source)) {
  const target = filename === 'index.html' ? 'studio.html' : filename;
  let content = await readFile(new URL(filename, source), 'utf8');
  if (filename.endsWith('.html')) {
    content = content.replace(/(href|src)="\//g, '$1="./');
    if (filename === 'beta1.html') content = content.replace('href="./"', 'href="./studio.html"');
  }
  await writeFile(new URL(target, output), content);
  if (filename === 'beta1.html') await writeFile(new URL('index.html', output), content);
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Built GitHub Pages site in docs/; the home page opens Beta 1.');
