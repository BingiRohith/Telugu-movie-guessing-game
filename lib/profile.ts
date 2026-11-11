export interface PlayerProfile {
  id: string;
  displayName: string;
  username?: string;
  avatar?: string;
  createdAt?: number;
}

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} ._'’-]{1,23}$/u;
export const AVATARS = [
  { id: 'star', icon: '✦', name: 'Cinema star' },
  { id: 'music', icon: '♫', name: 'Music lover' },
  { id: 'film', icon: '🎬', name: 'Movie buff' },
  { id: 'headphones', icon: '🎧', name: 'Sound explorer' },
  { id: 'mic', icon: '🎙️', name: 'Dialogue master' },
  { id: 'trophy', icon: '★', name: 'Quiz champion' },
] as const;
