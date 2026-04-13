'use client';

import { useState } from 'react';
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsNotifications() {
  const [isPending, setIsPending] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [pushToggles, setPushToggles] = useState({
    newArticles: true,
    comments: true,
    mentions: true,
    system: false,
  });



  const handleSave = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const ToggleItem = ({ 
    label, desc, checked, onChange 
  }: { 
    label: string, desc: string, checked: boolean, onChange: (v: boolean) => void 
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="pr-4">
        <p className="text-sm font-semibold text-zinc-800 dark:text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex justify-center shrink-0 h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-zinc-200 dark:bg-white/10'}`}
      >
        <div className={`transform transition-transform duration-200 ease-in-out bg-white rounded-full w-4 h-4 shadow-sm flex items-center justify-center ${checked ? 'translate-x-[10px]' : '-translate-x-[10px]'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Push Notifications */}
      <section>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-white">Thông báo Push (Hệ thống)</h3>
            <p className="text-xs text-zinc-500 mt-1">Thông báo đẩy trực tiếp trên trình duyệt hoặc điện thoại.</p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleItem 
            label="Bài viết mới từ mảng quan tâm" 
            desc="Nhận thông báo khi có bài viết hot thuộc thể loại bạn theo dõi."
            checked={pushToggles.newArticles}
            onChange={(v) => setPushToggles(p => ({ ...p, newArticles: v }))}
          />
          <ToggleItem 
            label="Bình luận mới" 
            desc="Khi ai đó trả lời hoặc thả tim bình luận của bạn."
            checked={pushToggles.comments}
            onChange={(v) => setPushToggles(p => ({ ...p, comments: v }))}
          />
          <ToggleItem 
            label="Được nhắc đến (Mentions)" 
            desc="Khi tác giả gọi tên (@) bạn trong bài viết hoặc comment."
            checked={pushToggles.mentions}
            onChange={(v) => setPushToggles(p => ({ ...p, mentions: v }))}
          />
          <ToggleItem 
            label="Thông báo hệ thống" 
            desc="Khảo sát, bảo trì nền tảng và cập nhật tính năng."
            checked={pushToggles.system}
            onChange={(v) => setPushToggles(p => ({ ...p, system: v }))}
          />
        </div>
      </section>



      <div className="flex justify-end pt-2">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu thiết lập
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-zinc-800/20 dark:shadow-white/10"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu tất cả tùy chọn'}
          </button>
        </div>
      </div>
    </div>
  );
}
