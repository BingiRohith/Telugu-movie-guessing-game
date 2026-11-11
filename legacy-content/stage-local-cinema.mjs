import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const source = 'local-cinema';
const target = 'out/audio/cinema';
const manifest = JSON.parse(await readFile(join(source, 'questions.json'), 'utf8'));
const names = Object.values(manifest).flat().map(({ clip }) => {
  const match = /^\/audio\/cinema\/([a-z-]+\.mp3)$/.exec(clip.path);
  if (!match) throw new Error('Invalid cinema clip path: ' + clip.path);
  return match[1];
});
await stat('out/index.html');
await Promise.all(names.map((name) => stat(join(source, name))));
await mkdir(target, { recursive: true });
await Promise.all(names.map((name) => copyFile(join(source, name), join(target, name))));
await copyFile(join(source, 'questions.json'), join(target, 'questions.json'));
console.log('Staged ' + names.length + ' archival clips for the local preview.');
