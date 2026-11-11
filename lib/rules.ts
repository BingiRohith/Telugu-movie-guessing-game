export const MODES = ['music', 'dialogue', 'song'] as const;
export type Mode = (typeof MODES)[number];

export const PACES = { normal: 20, quick: 10 } as const;
export type Pace = keyof typeof PACES;
export const ROUND_COUNT = 5;

export function pointsForAnswer(correct: boolean, elapsedMs: number, pace: Pace) {
  const limitMs = PACES[pace] * 1000;
  if (!correct || elapsedMs < 0 || elapsedMs >= limitMs) return 0;

  if (elapsedMs <= limitMs / 3) return 100;
  if (elapsedMs <= limitMs * 2 / 3) return 80;
  return 60;
}
