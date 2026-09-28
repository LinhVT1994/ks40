'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { resolveCover } from '@/lib/profile-covers';
import CoverPicker from './CoverPicker';

type Props = {
  cover: string | null;
  editable?: boolean;
};

/** Background layer for a cover value; fills its positioned parent. */
export function CoverBackground({ cover }: { cover: string | null }) {
  const resolved = resolveCover(cover);
  return (
    <div
      className="absolute inset-0 bg-cover bg-center transition-[background] duration-500"
      style={resolved.kind === 'image'
        ? { backgroundImage: `url("${encodeURI(resolved.url)}")` }
        : { background: resolved.background }}
    />
  );
}

/** Profile "wall": a full-width background behind the header, with the profile content starting just below it. */
export default function ProfileCover({ cover: initialCover, editable = false }: Props) {
  const [cover, setCover] = useState(initialCover);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {/* The wall: a full-width background behind the header; the profile starts below it */}
      <div className="absolute top-0 left-0 right-0 h-[300px] sm:h-[360px] lg:h-[420px] -z-10 overflow-hidden" aria-hidden="true">
        <CoverBackground cover={cover} />
        {/* Short fade so the wall's bottom edge melts into the page */}
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark" />
      </div>

      {editable && (
        <div className="absolute top-[80px] sm:top-[88px] left-0 right-0 z-20 pointer-events-none">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 flex justify-end">
            <div ref={panelRef} className="relative pointer-events-auto">
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                disabled={busy}
                aria-expanded={open}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface/85 dark:bg-black/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-slate-200 shadow-sm hover:bg-surface dark:hover:bg-black/70 transition-colors disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                Ảnh bìa
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-[min(320px,calc(100vw-48px))] p-4 rounded-2xl bg-surface dark:bg-[#2b2924] border border-zinc-200 dark:border-white/10 shadow-xl">
                  <CoverPicker cover={cover} onChange={setCover} onUploaded={() => setOpen(false)} onBusyChange={setBusy} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
