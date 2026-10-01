'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { CalendarClock, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAvailableSlotsAction, requestConsultationAction } from '../actions/consultation';
import { cn } from '@/lib/utils';

type Props = {
  hostId: string;
  hostName: string;
  intro: string | null;
  durationMin: number;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const fmtDay = (d: Date) => d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "Đặt lịch tư vấn" button + dialog on a writer's public profile. Times are shown in the viewer's own zone. */
export default function BookConsultationButton({ hostId, hostName, intro, durationMin }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Date[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isPending, startTransition] = useTransition();
  const viewerZone = useMemo(() => (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''), []);

  const loadSlots = () => {
    setSlots(null);
    getAvailableSlotsAction(hostId).then(list => {
      const dates = list.map(s => new Date(s));
      setSlots(dates);
      setDay(dates.length ? dayKey(dates[0]) : null);
    }).catch(() => setSlots([]));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const days = useMemo(() => {
    const map = new Map<string, Date[]>();
    for (const s of slots ?? []) {
      const k = dayKey(s);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);

  const openDialog = () => {
    setOpen(true);
    setPicked(null);
    loadSlots();
  };

  const submit = () => {
    if (!picked) return;
    startTransition(async () => {
      const res = await requestConsultationAction({ hostId, startAt: picked, topic });
      if (!res.success) {
        toast.error(res.error);
        if (res.error.includes('không còn trống') || res.error.includes('vừa có người đặt')) { setPicked(null); loadSlots(); }
        return;
      }
      toast.success(`Đã gửi yêu cầu tới ${hostName}. Bạn sẽ nhận thông báo khi tác giả phản hồi.`);
      setOpen(false);
      setTopic('');
    });
  };

  const buttonClass = 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all';

  if (!session) {
    return (
      <Link href="/login" className={buttonClass}>
        <CalendarClock className="w-3.5 h-3.5" /> Đặt lịch tư vấn
      </Link>
    );
  }

  const daySlots = days.find(([k]) => k === day)?.[1] ?? [];

  return (
    <>
      <button type="button" onClick={openDialog} className={buttonClass}>
        <CalendarClock className="w-3.5 h-3.5" /> Đặt lịch tư vấn
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="book-title" className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface dark:bg-[#2b2924] rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div>
                <h2 id="book-title" className="text-lg font-display font-semibold text-zinc-800 dark:text-white">Đặt lịch tư vấn với {hostName}</h2>
                <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {durationMin} phút · Miễn phí · Qua Google Meet/Zoom</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-6">
              {intro && <p className="text-sm text-zinc-600 dark:text-slate-300 leading-relaxed border-l-2 border-primary/40 pl-3">{intro}</p>}

              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">1 · Chọn thời gian <span className="normal-case tracking-normal font-medium">(giờ {viewerZone})</span></p>
                {slots === null ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải khung giờ…</div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">Tác giả chưa có khung giờ trống trong 2 tuần tới.</p>
                ) : (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {days.map(([k, list]) => (
                        <button key={k} type="button" onClick={() => { setDay(k); setPicked(null); }}
                          className={cn('shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors',
                            day === k ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-slate-300 hover:border-primary/40')}>
                          {fmtDay(list[0])}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {daySlots.map(s => {
                        const iso = s.toISOString();
                        return (
                          <button key={iso} type="button" onClick={() => setPicked(iso)}
                            className={cn('px-2 py-2 rounded-lg border text-sm font-medium tabular-nums transition-colors',
                              picked === iso ? 'border-primary bg-brand text-white' : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-200 hover:border-primary/40')}>
                            {fmtTime(s)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section>
                <label htmlFor="book-topic" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">2 · Bạn muốn hỏi về điều gì?</label>
                <textarea id="book-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={1000} rows={4}
                  placeholder="Mô tả ngắn vấn đề để tác giả chuẩn bị trước, ví dụ: mình đang học Revit và muốn hỏi cách tổ chức family cho dự án nhà phố…"
                  className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-zinc-800 dark:text-white resize-none" />
                <p className="mt-1 text-right text-[10px] text-zinc-400">{topic.trim().length}/1000</p>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 p-6 pt-0">
              <p className="text-[11px] text-zinc-500 leading-relaxed">Tác giả sẽ xác nhận lịch. Link họp sẽ hiện sau khi được xác nhận.</p>
              <button type="button" onClick={submit} disabled={!picked || topic.trim().length < 10 || isPending}
                className="ui-button shrink-0 disabled:opacity-50 disabled:pointer-events-none">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
