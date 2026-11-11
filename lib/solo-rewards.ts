import { MODES, ROUND_COUNT, type Mode } from './rules.ts';

export type Progress = {
  points: number;
  games: Record<Mode, number>;
  perfect: boolean;
};

export const EMPTY_PROGRESS: Progress = {
  points: 0, games: { music: 0, dialogue: 0, song: 0 }, perfect: false,
};

export const TROPHIES = [
  { id: 'first-show', name: 'First Show', icon: '★', description: 'Finish your first solo game.', earned: (progress: Progress) => MODES.some((mode) => progress.games[mode] > 0) },
  { id: 'perfect-guess', name: 'Perfect Guess', icon: '◎', description: 'Get all five answers right in one game.', earned: (progress: Progress) => progress.perfect },
  { id: 'triple-feature', name: 'Triple Feature', icon: '✦', description: 'Finish Music, Dialogue, and Song.', earned: (progress: Progress) => MODES.every((mode) => progress.games[mode] > 0) },
  { id: 'cinema-club', name: 'Cinema Club', icon: '♛', description: 'Earn 1,000 total points.', earned: (progress: Progress) => progress.points >= 1000 },
] as const;

export type CompletedGame = { mode: Mode; points: number; correct: number };

export function addGame(progress: Progress, { mode, points, correct }: CompletedGame): Progress {
  return {
    points: progress.points + points,
    games: { ...progress.games, [mode]: progress.games[mode] + 1 },
    perfect: progress.perfect || correct === ROUND_COUNT,
  };
}

export function newTrophies(before: Progress, after: Progress) {
  return TROPHIES.filter((trophy) => !trophy.earned(before) && trophy.earned(after));
}
