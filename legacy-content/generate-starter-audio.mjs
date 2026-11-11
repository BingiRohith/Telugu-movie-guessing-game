import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { questions } from '../lib/questions.ts';

const sourceDir = resolve(process.argv[2] ?? '.wrangler/audio-tools');
const ffmpeg = resolve(process.argv[3] ?? sourceDir + '/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const text2wav = createRequire(sourceDir + '/generate.cjs')('text2wav');
const output = resolve('public/audio');
mkdirSync(output, { recursive: true });

const tracks = [
  { id: 'vennela', melody: [62, 65, 69, 72, 69, 67, 65, 62, 60, 62], step: 0.49, root: 50, bright: 0.13 },
  { id: 'panduga', melody: [65, 67, 69, 72, 69, 72, 74, 72, 69, 67, 65, 65], step: 0.39, root: 53, bright: 0.33 },
  { id: 'alala', melody: [60, 64, 67, 71, 74, 71, 67, 64, 62, 60], step: 0.51, root: 48, bright: 0.18 },
  { id: 'matti', melody: [57, 60, 62, 65, 62, 60, 57, 55, 57], step: 0.55, root: 45, bright: 0.27 },
];

function makeInstrumental({ melody, step, root, bright }) {
  const rate = 24000;
  const samples = Math.round(rate * (melody.length * step + 0.45));
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  const omega = (note) => 2 * Math.PI * 440 * 2 ** ((note - 69) / 12);
  const frequencies = melody.map(omega);
  const tonic = omega(root);
  const length = samples / rate;
  for (let i = 0; i < samples; i++) {
    const time = i / rate;
    const note = Math.min(melody.length - 1, Math.floor(time / step));
    const age = time - note * step;
    const phase = frequencies[note] * age + 0.5 * Math.sin(2 * Math.PI * 4.6 * age);
    const attack = Math.min(age / 0.025, 1);
    const pluck = attack * Math.exp(-5.1 * age) * (Math.sin(phase) + bright * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase));
    const drone = Math.sin(tonic * time) + 0.48 * Math.sin(tonic * 1.5 * time);
    const beat = Math.sin(2 * Math.PI * 82 * age) * Math.exp(-45 * age) * (note % 2 === 0 ? 1 : 0.45);
    const fade = Math.min(time / 0.08, (length - time) / 0.35, 1);
    wav.writeInt16LE(Math.round(32767 * fade * (0.55 * pluck + 0.09 * drone + 0.15 * beat)), 44 + i * 2);
  }
  return wav;
}

function encode(source, id, start = 0, length = 7) {
  execFileSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-i', source,
    '-map', '0:a:0', '-t', String(length), '-vn', '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ac', '1', '-ar', '44100',
    '-codec:a', 'libmp3lame', '-q:a', '5', resolve(output, id + '.mp3'),
  ], { stdio: 'inherit' });
}

for (const track of tracks) {
  const wav = resolve(sourceDir, track.id + '.wav');
  writeFileSync(wav, makeInstrumental(track));
  encode(wav, track.id);
}
for (const [index, question] of questions.dialogue.entries()) {
  const wav = resolve(sourceDir, question.id + '.wav');
  writeFileSync(wav, await text2wav(question.dialogue, { voice: index % 2 ? 'te+f2' : 'te', speed: 150 }));
  encode(wav, question.id, 0, 9);
}
for (const question of questions.song) encode(resolve(sourceDir, question.id + '.source'), question.id);
encode(resolve(sourceDir, 'desh.source'), 'desh', 12);
