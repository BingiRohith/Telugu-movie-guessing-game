'use client';

import { useState } from 'react';

export function SourcePreview({ videoId, title }: { videoId: string; title: string }) {
  const [open, setOpen] = useState(false);
  return <div>
    <button className="secondary listen-ready" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close preview' : 'Preview official media'}</button>
    {open && <iframe className="cinema-player" src={`https://www.youtube.com/embed/${videoId}?playsinline=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
  </div>;
}
