import { questions } from '../lib/questions.ts';
import { writeFile } from 'node:fs/promises';

const sources = [...new Map(Object.values(questions).flat().map(q => [q.clip.videoId, q])).values()];
const checks = await Promise.allSettled(sources.map(async question => {
  const response = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(question.clip.source), { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${question.id}: oEmbed HTTP ${response.status}`);
  const meta = await response.json();
  const expected = question.clip.credit.split(' · ')[0].split(' / ');
  if (!expected.includes(meta.author_name.trim())) throw new Error(`${question.id}: unexpected publisher ${meta.author_name}`);
  return { id: question.id, film: question.film, year: question.year, source: question.clip.source, title: meta.title, publisher: meta.author_name, publisherUrl: meta.author_url, status: 'metadata available; in-browser playback still requires manual verification' };
}));
const report = { checkedAt: new Date().toISOString(), checks: checks.map((check, index) => check.status === 'fulfilled' ? check.value : { id: sources[index].id, source: sources[index].clip.source, status: 'unverified', error: String(check.reason) }) };
await writeFile(new URL('../SOURCE_CHECK.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
for (const check of report.checks) console.log(check.id + ': ' + (check.publisher ?? check.error));
if (checks.some(check => check.status === 'rejected')) process.exitCode = 1;
