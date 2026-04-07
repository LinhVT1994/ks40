'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileArchive, FileText, File, Image as ImageIcon,
  Loader2, X, Globe, Users, Star, Lock,
  Type, AlignLeft, Clock, Shield, Link as LinkIcon,
} from 'lucide-react';

const fmt = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

function FileIcon({ t, cls = 'w-4 h-4' }: { t: string; cls?: string }) {
  if (t.startsWith('image/')) return <ImageIcon className={`${cls} text-sky-500`} />;
  if (/zip|rar|tar|7z|gzip/.test(t)) return <FileArchive className={`${cls} text-amber-500`} />;
  if (t.includes('pdf')) return <FileText className={`${cls} text-rose-500`} />;
  return <File className={`${cls} text-slate-400`} />;
}

const AUDIENCE = [
  { value: 'PUBLIC',  label: 'Công khai',  icon: Globe,  cls: 'text-emerald-500' },
  { value: 'MEMBERS', label: 'Thành viên', icon: Users,  cls: 'text-blue-500'    },
  { value: 'PREMIUM', label: 'Premium',    icon: Star,   cls: 'text-amber-500'   },
  { value: 'PRIVATE', label: 'Riêng tư',   icon: Lock,   cls: 'text-slate-400'   },
];

const EXPIRES = [
  { value: '1d',    label: '1 ngày'   },
  { value: '7d',    label: '7 ngày'   },
  { value: '30d',   label: '30 ngày'  },
  { value: 'never', label: 'Mãi mãi' },
];

export default function NewShareForm() {
  const router = useRouter();

  const [title,     setTitle]     = useState('');
  const [slug,      setSlug]      = useState('');
  const [desc,      setDesc]      = useState('');
  const [expires,   setExpires]   = useState('never');
  const [audience,  setAudience]  = useState('PUBLIC');
  const [files,     setFiles]     = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = (list: FileList | null) =>
    list && setFiles(p => [...p, ...Array.from(list)]);

  const submit = async () => {
    if (!title.trim()) return setError('Vui lòng nhập tiêu đề');
    if (!files.length)  return setError('Chưa chọn file nào');
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append('title', title.trim());
    if (slug.trim()) form.append('slug', slug.trim());
    form.append('description', desc.trim());
    form.append('expiresIn', expires);
    form.append('audience', audience);
    files.forEach(f => form.append('files', f));
    try {
      const res  = await fetch('/api/share/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Upload thất bại');
      else router.push('/admin/shares');
    } catch {
      setError('Lỗi mạng, thử lại.');
    }
    setUploading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10 border-b border-slate-100 dark:border-white/5 pb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tạo gói tài liệu</h2>
          <p className="text-slate-500 mt-1">Upload file và chia sẻ với người dùng qua một link duy nhất.</p>
        </div>

        <div className="space-y-10">

          {/* Tiêu đề */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề gói tài liệu..."
              className="w-full max-w-lg text-base bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5" /> Slug{' '}
              <span className="font-normal normal-case text-slate-400">(tuỳ chọn, để trống sẽ tự tạo)</span>
            </label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'))}
              placeholder="slug-tuy-chon"
              className="w-full max-w-lg text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
            />
            <p className="text-[11px] text-slate-400 font-mono pl-1">
              /share/<span className="text-primary">{slug || <span className="italic">tu-dong-tao</span>}</span>
            </p>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="w-3.5 h-3.5" /> Mô tả
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Mô tả ngắn về gói tài liệu này..."
              rows={3}
              className="w-full text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Audience + Expires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Quyền truy cập
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE.map(a => {
                  const Icon = a.icon;
                  const active = audience === a.value;
                  return (
                    <button key={a.value} onClick={() => setAudience(a.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        active
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50 hover:text-primary'
                      }`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : a.cls}`} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Thời hạn
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPIRES.map(e => (
                  <button key={e.value} onClick={() => setExpires(e.value)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      expires === e.value
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50 hover:text-primary'
                    }`}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Files */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Files <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all text-slate-400 hover:text-primary"
            >
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
              <Upload className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-semibold">Kéo thả hoặc nhấn để chọn file</p>
                <p className="text-xs text-slate-400 mt-1">Tối đa 200MB mỗi file</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <FileIcon t={f.type} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate font-medium">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(f.size)}</span>
                    <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-rose-500 transition-colors ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Navigation */}
          <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={submit}
              disabled={uploading || !title.trim() || !files.length}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Đang upload…</>
                : <><Upload className="w-4 h-4" />Tạo gói & Upload</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
