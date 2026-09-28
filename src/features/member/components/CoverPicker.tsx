'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { COVER_PRESETS, resolveCover } from '@/lib/profile-covers';
import { setProfileCoverAction } from '@/features/member/actions/profile';
import { cn } from '@/lib/utils';

type Props = {
  cover: string | null;
  onChange: (cover: string | null) => void;
  /** Called after an upload succeeds (e.g. to close a popover). */
  onUploaded?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** Preset grid + upload + reset. Persists immediately; parent owns the displayed value. */
export default function CoverPicker({ cover, onChange, onUploaded, onBusyChange }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const resolved = resolveCover(cover);
  const busy = uploading || isPending;

  const setBusy = (b: boolean) => onBusyChange?.(b);

  const applyPreset = (value: string | null) => {
    const previous = cover;
    onChange(value);
    setBusy(true);
    startTransition(async () => {
      const res = await setProfileCoverAction(value);
      setBusy(false);
      if (!res.success) {
        onChange(previous);
        toast.error(res.error ?? 'Không thể đổi ảnh bìa');
        return;
      }
      router.refresh();
    });
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload/cover', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Tải ảnh thất bại');
      onChange(json.url);
      onUploaded?.();
      toast.success('Đã cập nhật ảnh bìa');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Chọn nền có sẵn</p>
      <div className="grid grid-cols-3 gap-2.5">
        {COVER_PRESETS.map(p => {
          const active = resolved.kind === 'preset' && resolved.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              title={p.label}
              disabled={busy}
              onClick={() => applyPreset(`preset:${p.id}`)}
              className={cn(
                'relative h-14 rounded-xl border overflow-hidden transition-all disabled:opacity-60',
                active ? 'border-primary ring-2 ring-primary/30' : 'border-zinc-200 dark:border-white/10 hover:border-primary/40',
              )}
              style={{ background: p.background }}
            >
              {active && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
              <span className="sr-only">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Tải ảnh của bạn
        </button>
        <p className="text-[10px] text-zinc-500 text-center">JPEG, PNG, WebP · tối đa 5MB · nên dùng ảnh ngang 1600×400</p>
        {cover && (
          <button
            type="button"
            disabled={busy}
            onClick={() => applyPreset(null)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Về nền mặc định
          </button>
        )}
      </div>
    </div>
  );
}
