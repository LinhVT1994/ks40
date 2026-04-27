'use client';

import { useState, useTransition } from 'react';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Camera, Loader2, CheckCircle2, Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube, Music } from 'lucide-react';
import { updateProfileAction } from '@/features/member/actions/profile';
import { compressImage } from '@/lib/compress-image';

type SocialUser = User & {
  bio?: string | null;
  username?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
};

const SOCIAL_FIELDS = [
  { key: 'websiteUrl',   label: 'Website',   icon: Globe,     placeholder: 'https://example.com' },
  { key: 'facebookUrl',  label: 'Facebook',  icon: Facebook,  placeholder: 'https://facebook.com/username' },
  { key: 'instagramUrl', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'twitterUrl',   label: 'X (Twitter)', icon: Twitter,   placeholder: 'https://x.com/username' },
  { key: 'linkedinUrl',  label: 'LinkedIn',  icon: Linkedin,  placeholder: 'https://linkedin.com/in/username' },
  { key: 'githubUrl',    label: 'GitHub',    icon: Github,    placeholder: 'https://github.com/username' },
  { key: 'youtubeUrl',   label: 'YouTube',   icon: Youtube,   placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktokUrl',    label: 'TikTok',    icon: Music,     placeholder: 'https://tiktok.com/@username' },
] as const;

export default function SettingsProfile({ user }: { user: SocialUser }) {
  const [name,     setName]     = useState(user.name ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [bio,      setBio]      = useState(user.bio ?? '');
  const [socials, setSocials] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of SOCIAL_FIELDS) init[f.key] = (user as any)[f.key] ?? '';
    return init;
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { update } = useSession();

  // Local state for avatar preview
  const [avatarPreview, setAvatarPreview] = useState<string>(user.image || '');

  // Fallback to ui-avatars if no image provided
  const avatarUrl = avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff`;

  const handleSave = () => {
    if (!name.trim()) return;
    const socialData: Record<string, string> = {};
    for (const f of SOCIAL_FIELDS) {
      socialData[f.key] = socials[f.key]?.trim() || '';
    }
    startTransition(async () => {
      const res = await updateProfileAction({
        name: name.trim(),
        bio: bio.trim(),
        username: username.trim() || undefined,
        ...socialData,
      });
      if (res.success) {
        await update({ name: name.trim(), username: username.trim() || undefined });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.error || 'Đã có lỗi xảy ra');
      }
    });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const blob = await compressImage(file, 512, 512, 0.85);
      const ext  = blob.type === 'image/webp' ? 'webp' : 'jpg';
      const compressed = new File([blob], `avatar.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', compressed);
      
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      // Update local preview & next-auth session
      setAvatarPreview(data.url);
      await update({ image: data.url });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi server khi upload ảnh');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const socialsDirty = SOCIAL_FIELDS.some(f => (socials[f.key]?.trim() ?? '') !== ((user as any)[f.key] ?? ''));
  const isDirty = name.trim() !== (user.name ?? '') || username.trim() !== (user.username ?? '') || bio.trim() !== (user.bio ?? '') || socialsDirty;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <label className={`relative group cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div 
            className="w-20 h-20 rounded-full bg-cover bg-center border-2 border-zinc-300 dark:border-white/10 overflow-hidden shadow-sm"
            style={{ backgroundImage: `url('${avatarUrl}')` }}
          />
          <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </div>
          <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarSelect} />
        </label>
        <div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Ảnh đại diện</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">Định dạng JPG, GIF hoặc PNG.<br/>Dung lượng tối đa 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-slate-500 mb-2 block">Tên hiển thị</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-zinc-800 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-slate-500 mb-2 block">
            Username <span className="text-zinc-400 font-medium normal-case tracking-normal">(dùng làm URL profile)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="vd: linhvu"
              maxLength={30}
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-zinc-800 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          <p className="text-[11px] text-zinc-400">Chỉ chữ thường, số, _ hoặc -. Từ 3–30 ký tự.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Email liên kết</label>
          <input
            type="email"
            value={user.email ?? ''}
            disabled
            className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Giới thiệu bản thân</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Viết vài dòng giới thiệu về bạn..."
          className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-zinc-800 dark:text-white placeholder:text-zinc-500 resize-none"
        />
        <p className="text-[11px] text-zinc-500 text-right">{bio.length}/300</p>
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-slate-300">Mạng xã hội</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Icon className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={socials[key]}
                onChange={e => setSocials(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all text-zinc-800 dark:text-white placeholder:text-zinc-400"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-white/5">
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending || !name.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-zinc-800/20 dark:shadow-white/10"
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
