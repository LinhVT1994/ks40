'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, CalendarCheck, CalendarClock, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAvailableSlotsAction, requestConsultationAction } from '../actions/consultation';
import SlotPicker, { type PickerSlot } from './SlotPicker';

type Props = {
  hostId: string;
  hostName: string;
  intro: string | null;
  durationMin: number;
};

const fmtLong = (iso: string, durationMin: number) => {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const t = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} · ${t(start)}–${t(end)}`;
};

/** "Đặt lịch tư vấn" button + two-step dialog (pick a slot on the calendar → describe the question). */
export default function BookConsultationButton({ hostId, hostName, intro, durationMin }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [slots, setSlots] = useState<PickerSlot[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isPending, startTransition] = useTransition();
  const viewerZone = useMemo(() => (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''), []);

  const loadSlots = () => {
    setSlots(null);
    getAvailableSlotsAction(hostId)
      .then(list => setSlots(list.map(s => ({ start: new Date(s.start), taken: s.taken }))))
      .catch(() => setSlots([]));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const openDialog = () => {
    setOpen(true);
    setStep(1);
    setPicked(null);
    loadSlots();
  };

  const submit = () => {
    if (!picked) return;
    startTransition(async () => {
      const res = await requestConsultationAction({ hostId, startAt: picked, topic });
      if (!res.success) {
        toast.error(res.error);
        if (res.error.includes('không còn trống') || res.error.includes('vừa có người đặt')) { setPicked(null); setStep(1); loadSlots(); }
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

  const freeCount = slots?.filter(s => !s.taken).length ?? 0;

  return (
    <>
      <button type="button" onClick={openDialog} className={buttonClass}>
        <CalendarClock className="w-3.5 h-3.5" /> Đặt lịch tư vấn
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="book-title" className="w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto bg-surface dark:bg-[#2b2924] rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div>
                <h2 id="book-title" className="text-lg font-display font-semibold text-zinc-800 dark:text-white">Đặt lịch tư vấn với {hostName}</h2>
                <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {durationMin} phút · Miễn phí · Qua Google Meet/Zoom</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>

            {step === 1 ? (
              <div className="p-5 sm:p-6 space-y-5">
                {intro && <p className="text-sm text-zinc-600 dark:text-slate-300 leading-relaxed border-l-2 border-primary/40 pl-3">{intro}</p>}
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bước 1 · Chọn thời gian</p>
                  <p className="text-[11px] text-zinc-500">Giờ {viewerZone}{slots && slots.length > 0 && <> · <strong className="text-primary">{freeCount}</strong> khung còn trống</>}</p>
                </div>
                {slots === null ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 py-12 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch…</div>
                ) : slots.length === 0 || freeCount === 0 ? (
                  <p className="text-sm text-zinc-500 py-12 text-center">Tác giả chưa có khung giờ trống trong 2 tuần tới. Hãy quay lại sau nhé.</p>
                ) : (
                  <SlotPicker slots={slots} selected={picked} onSelect={setPicked} />
                )}
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-white"><CalendarCheck className="w-4 h-4 text-primary" /> {picked && fmtLong(picked, durationMin)}</span>
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-primary hover:underline shrink-0">Đổi giờ</button>
                </div>
                <div>
                  <label htmlFor="book-topic" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Bước 2 · Bạn muốn hỏi về điều gì?</label>
                  <textarea id="book-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={1000} rows={5} autoFocus
                    placeholder="Mô tả ngắn vấn đề để tác giả chuẩn bị trước, ví dụ: mình đang học Revit và muốn hỏi cách tổ chức family cho dự án nhà phố…"
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-zinc-800 dark:text-white resize-none" />
                  <p className="mt-1 flex justify-between text-[10px] text-zinc-400"><span>Tối thiểu 10 ký tự</span><span>{topic.trim().length}/1000</span></p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pb-5 sm:pb-6">
              {step === 1 ? (
                <>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Tác giả sẽ xác nhận lịch. Link họp hiện sau khi được xác nhận.</p>
                  <button type="button" onClick={() => setStep(2)} disabled={!picked} className="ui-button shrink-0 disabled:opacity-50 disabled:pointer-events-none">Tiếp tục</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Quay lại</button>
                  <button type="button" onClick={submit} disabled={topic.trim().length < 10 || isPending} className="ui-button shrink-0 disabled:opacity-50 disabled:pointer-events-none">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Gửi yêu cầu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
