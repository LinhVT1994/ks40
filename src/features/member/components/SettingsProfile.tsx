'use client';

import { useState, useTransition } from 'react';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { updateProfileAction } from '@/features/member/actions/profile';

export default function SettingsProfile({ user }: { user: User & { bio?: string | null } }) {
  const [name, setName] = useState(user.name ?? '');
  const [bio,  setBio]  = useState(user.bio ?? '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const { update } = useSession();

  // Fallback to ui-avatars if no image provided
  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff`;

  const handleSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await updateProfileAction({ name: name.trim(), bio: bio.trim() });
      if (res.success) {
        await update({ name: name.trim() });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.error || 'Đã có lỗi xảy ra');
      }
    });
  };

  const isDirty = name.trim() !== (user.name ?? '') || bio.trim() !== (user.bio ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          <div 
            className="w-20 h-20 rounded-full bg-cover bg-center border-2 border-slate-200 dark:border-white/10 overflow-hidden shadow-sm"
            style={{ backgroundImage: `url('${avatarUrl}')` }}
          />
          <button className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <Camera className="w-6 h-6" />
          </button>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ảnh đại diện</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Định dạng JPG, GIF hoặc PNG.<br/>Dung lượng tối đa 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Họ và tên</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email liên kết</label>
          <input
            type="email"
            value={user.email ?? ''}
            disabled
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Giới thiệu bản thân</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Viết vài dòng giới thiệu về bạn..."
          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
        />
        <p className="text-[11px] text-slate-400 text-right">{bio.length}/300</p>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending || !name.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-slate-900/20 dark:shadow-white/10"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu hồ sơ'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Đã cập nhật thành công
          </span>
        )}
      </div>
    </div>
  );
}
