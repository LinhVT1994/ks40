'use client';

import { useEffect, useState } from 'react';
import { Download, FileArchive, FileText, File, Image as ImageIcon, Clock, Shield, Lock } from 'lucide-react';
import Script from 'next/script';
import { incrementPackageDownloadAction } from '@/features/admin/actions/share';

type SharedFile = { id: string; name: string; url: string; size: number; mimeType: string };
type SharedPkg = {
  slug: string; title: string; description: string | null;
  audience: string; uploadedBy: { name: string }; files: SharedFile[];
};

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, cls = 'w-5 h-5' }: { mimeType: string; cls?: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className={`${cls} text-sky-500`} />;
  if (/zip|rar|tar|7z|gzip/.test(mimeType)) return <FileArchive className={`${cls} text-amber-500`} />;
  if (mimeType.includes('pdf')) return <FileText className={`${cls} text-rose-500`} />;
  return <File className={`${cls} text-slate-400`} />;
}

const COUNTDOWN = 10;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
const ADSENSE_SLOT   = process.env.NEXT_PUBLIC_ADSENSE_SLOT   ?? '';

export default function ShareDownloadClient({ pkg, isLoggedIn }: { pkg: SharedPkg; isLoggedIn: boolean }) {
  const [count,   setCount]   = useState(isLoggedIn ? 0 : COUNTDOWN);
  const [ready,   setReady]   = useState(isLoggedIn);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (isLoggedIn) return;
    if (count <= 0) { setReady(true); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, isLoggedIn]);

  const downloadFile = async (file: SharedFile) => {
    if (!tracked) { setTracked(true); incrementPackageDownloadAction(pkg.slug); }
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  const downloadAll = () => pkg.files.forEach(f => setTimeout(() => downloadFile(f), 300));
  const totalSize = pkg.files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      {ADSENSE_CLIENT && (
        <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous" strategy="afterInteractive" />
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">

        {/* LEFT — info */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Chia sẻ bởi {pkg.uploadedBy.name}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{pkg.title}</h1>
            {pkg.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3">{pkg.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <File className="w-3.5 h-3.5" /> {pkg.files.length} file
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
            <span>{formatBytes(totalSize)}</span>
          </div>

          {/* AdSense */}
          {ADSENSE_CLIENT && ADSENSE_SLOT && !isLoggedIn && (
            <div className="mt-2">
              <ins className="adsbygoogle" style={{ display: 'block' }}
                data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT}
                data-ad-format="auto" data-full-width-responsive="true" />
              <Script id="adsense-share">{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>
            </div>
          )}
          {!ADSENSE_CLIENT && !isLoggedIn && (
            <div className="h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 text-xs mt-2">
              Khu vực quảng cáo Google AdSense
            </div>
          )}
        </div>

        {/* RIGHT — files + action */}
        <div className="flex flex-col gap-4">
          {/* File list */}
          <div className="bg-white/60 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {pkg.files.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <FileIcon mimeType={f.mimeType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(f.size)}</p>
                  </div>
                  {ready ? (
                    <button onClick={() => downloadFile(f)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors shrink-0">
                      <Download className="w-3.5 h-3.5" /> Tải
                    </button>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-white/20 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          {ready ? (
            <button onClick={downloadAll}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm">
              <Download className="w-4 h-4" /> Tải tất cả ({pkg.files.length} file)
            </button>
          ) : (
            <div className="bg-white/60 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-5 flex items-center gap-5">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-white/10" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                    strokeLinecap="round" className="text-primary transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (count / COUNTDOWN)}`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white">{count}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Vui lòng chờ {count} giây…
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  <a href="/login" className="text-primary hover:underline font-medium">Đăng nhập</a> để tải xuống ngay không cần chờ
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
