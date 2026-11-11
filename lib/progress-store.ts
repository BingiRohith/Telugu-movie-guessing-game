import { addGame, EMPTY_PROGRESS, newTrophies, type CompletedGame, type Progress } from './solo-rewards.ts';

function openProgress(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('telugu-solo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('progress');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function accessProgress(game?: CompletedGame) {
  const database = await openProgress();
  try {
    return await new Promise<{ before: Progress; after: Progress }>((resolve, reject) => {
      const transaction = database.transaction('progress', game ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('progress');
      const request = store.get('solo');
      let before = EMPTY_PROGRESS;
      let after = EMPTY_PROGRESS;

      request.onsuccess = () => {
        before = (request.result as Progress | undefined) ?? EMPTY_PROGRESS;
        after = game ? addGame(before, game) : before;
        if (game) store.put(after, 'solo');
      };
      transaction.oncomplete = () => resolve({ before, after });
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not save solo progress.'));
    });
  } finally {
    database.close();
  }
}

export async function readProgress() {
  return (await accessProgress()).after;
}

export async function saveCompletedGame(game: CompletedGame) {
  const { before, after } = await accessProgress(game);
  return { progress: after, unlocked: newTrophies(before, after) };
}
