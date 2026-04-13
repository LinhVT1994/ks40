'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Copy, Trash2, FileArchive, FileText, File, Image as ImageIcon,
  Loader2, Check, Download, ExternalLink, Globe, Users, Star, Lock,
  Plus, Search,
} from 'lucide-react';
import { deleteSharedPackageAction } from '@/features/admin/actions/share';

type SharedFile = { id: string; name: string; size: number; mimeType: string };
type SharedPackage = {
  id: string; slug: string; title: string; description: string | null;
  audience: string; downloadCount: number; expiresAt: Date | null; createdAt: Date;
  uploadedBy: { name: string }; files: SharedFile[];
};

const fmt = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const fmtDate = (d: Date) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));

function FileIcon({ t, cls = 'w-3.5 h-3.5' }: { t: string; cls?: string }) {
  if (t.startsWith('image/')) return <ImageIcon className={`${cls} text-sky-500`} />;
  if (/zip|rar|tar|7z|gzip/.test(t)) return <FileArchive className={`${cls} text-amber-500`} />;
  if (t.includes('pdf')) return <FileText className={`${cls} text-rose-500`} />;
  return <File className={`${cls} text-zinc-500`} />;
}

function CopyBtn({ path }: { path: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(window.location.origin + path); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-primary transition-colors">
      {ok ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const AUDIENCE = [
  { value: 'PUBLIC',  label: 'Công khai', icon: Globe,  cls: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { value: 'MEMBERS', label: 'Thành viên', icon: Users, cls: 'text-blue-500',    badge: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  { value: 'PREMIUM', label: 'Premium',   icon: Star,  cls: 'text-amber-500',   badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  { value: 'PRIVATE', label: 'Riêng tư',  icon: Lock,  cls: 'text-zinc-500',   badge: 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400' },
];
const EXPIRES = [
  { value: '1d', label: '1 ngày' }, { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' }, { value: 'never', label: 'Mãi mãi' },
];

export default function SharesClient({ initialPackages }: { initialPackages: SharedPackage[] }) {
  const [packages, setPackages] = useState(initialPackages);
  const [search, setSearch]     = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTrans]     = useTransition();

  const del = (id: string) => {
    if (!confirm('Xóa gói này?')) return;
    setDeletingId(id);
    startTrans(async () => {
      await deleteSharedPackageAction(id);
      setPackages(p => p.filter(x => x.id !== id));
      setDeletingId(null);
    });
  };

  const filtered = packages.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm gói tài liệu..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500"
          />
        </div>
        <Link href="/admin/shares/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-zinc-800 dark:bg-primary text-white rounded-2xl hover:opacity-90 transition-all shrink-0">
          <Plus className="w-4 h-4" /> Tạo gói mới
        </Link>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-lg shadow-sm flex flex-col min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-12 px-6 py-3 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-50/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-lg items-center sticky top-[65px] md:top-[73px] z-20">
            <div className="col-span-5">Tiêu đề</div>
            <div className="col-span-2 text-center">Files</div>
            <div className="col-span-2 text-center">Quyền</div>
            <div className="col-span-3 text-center">Thời hạn</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-200 dark:divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm">
                {search ? 'Không tìm thấy gói nào.' : 'Chưa có gói nào.'}
              </div>
            ) : (
              filtered.map(pkg => {
                const sharePath = `/shared/docs/${pkg.slug}`;
                const expired = pkg.expiresAt && new Date(pkg.expiresAt) < new Date();
                const aud = AUDIENCE.find(a => a.value === pkg.audience)!;
                const AudIcon = aud.icon;
                const totalSize = pkg.files.reduce((s, f) => s + f.size, 0);

                return (
                  <div key={pkg.id} className="grid grid-cols-12 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                    {/* Title + actions */}
                    <div className="col-span-5 pr-4 min-w-0 h-full flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 dark:text-white truncate flex-1 group-hover:text-primary transition-colors">
                          {pkg.title}
                        </p>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyBtn path={sharePath} />
                          <a href={sharePath} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => del(pkg.id)} disabled={deletingId === pkg.id || isPending}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50">
                            {deletingId === pkg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{pkg.description}</p>
                      )}
                      <p className="text-[11px] text-zinc-500 mt-0.5">{fmtDate(pkg.createdAt)} · {pkg.uploadedBy.name}</p>
                    </div>

                    {/* Files + downloads */}
                    <div className="col-span-2 h-full flex flex-col items-center justify-center gap-0.5">
                      <span className="text-sm font-bold text-zinc-700 dark:text-slate-300">{pkg.files.length} file · {fmt(totalSize)}</span>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Download className="w-3 h-3" />{pkg.downloadCount} lượt tải
                      </span>
                    </div>

                    {/* Audience */}
                    <div className="col-span-2 h-full flex items-center justify-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${aud.badge}`}>
                        <AudIcon className="w-2.5 h-2.5" />{aud.label}
                      </span>
                    </div>

                    {/* Expiry + status */}
                    <div className="col-span-3 h-full flex flex-col items-center justify-center gap-1">
                      {expired
                        ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10">Hết hạn</span>
                        : pkg.expiresAt
                          ? <><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Khả dụng</span>
                            <span className="text-[10px] text-zinc-500">{fmtDate(pkg.expiresAt)}</span></>
                          : <><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Khả dụng</span>
                            <span className="text-[10px] text-zinc-500">Không giới hạn</span></>
                      }
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>
    </>
  );
}
