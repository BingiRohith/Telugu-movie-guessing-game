export interface Playback {
  stop: () => void;
  finished: Promise<void>;
}

export function playClip(path: string): Playback {
  const element = new Audio(path);
  let done = false;
  let stop: () => void = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    function end(error?: Error) {
      if (done) return;
      done = true;
      element.onended = null;
      element.onerror = null;
      element.pause();
      element.removeAttribute('src');
      element.load();
      if (error) reject(error);
      else resolve();
    }
    stop = () => end();
    element.onended = () => end();
    element.onerror = () => end(new Error('Audio could not play. Try again or open the text clue.'));
    void element.play().catch(() => end(new Error('Audio could not play. Try again or open the text clue.')));
  });
  return { stop, finished };
}
