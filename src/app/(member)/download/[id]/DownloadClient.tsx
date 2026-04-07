'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle2, FileArchive, FileText, File } from 'lucide-react';
import Script from 'next/script';

type Resource = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, size = 6 }: { mimeType: string; size?: number }) {
  const cls = `w-${size} h-${size}`;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('gzip'))
    return <FileArchive className={`${cls} text-amber-500`} />;
  if (mimeType.includes('pdf'))
    return <FileText className={`${cls} text-rose-500`} />;
  return <File className={`${cls} text-slate-400`} />;
}

const COUNTDOWN = 10;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
const ADSENSE_SLOT   = process.env.NEXT_PUBLIC_ADSENSE_SLOT   ?? '';

export default function DownloadClient({ resource }: { resource: Resource }) {
  const [count, setCount] = useState(COUNTDOWN);
  const [ready, setReady] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (count <= 0) { setReady(true); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const handleDownload = () => {
    setDownloaded(true);
    // Trigger browser download
    const a = document.createElement('a');
    a.href = resource.url;
    a.download = resource.name;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 gap-8">
      {/* AdSense script */}
      {ADSENSE_CLIENT && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {/* File info card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-5 text-center">
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5">
          <FileIcon mimeType={resource.mimeType} size={10} />
        </div>

        <div>
          <p className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{resource.name}</p>
          <p className="text-sm text-slate-400 mt-1">{formatBytes(resource.size)}</p>
        </div>

        {downloaded ? (
          <div className="flex flex-col items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
            <p className="text-sm font-bold">Đang tải xuống…</p>
          </div>
        ) : ready ? (
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
          >
            <Download className="w-4 h-4" /> Tải xuống ngay
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Progress ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-white/10" />
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                  strokeLinecap="round" className="text-primary transition-all duration-1000"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (count / COUNTDOWN)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900 dark:text-white">
                {count}
              </span>
            </div>
            <p className="text-sm text-slate-500">Vui lòng chờ {count} giây…</p>
          </div>
        )}
      </div>

      {/* AdSense banner */}
      {ADSENSE_CLIENT && ADSENSE_SLOT && (
        <div className="w-full max-w-2xl">
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <Script id="adsense-init">{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>
        </div>
      )}

      {/* Placeholder khi chưa cấu hình AdSense */}
      {!ADSENSE_CLIENT && (
        <div className="w-full max-w-2xl h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 text-sm">
          Khu vực quảng cáo Google AdSense
        </div>
      )}
    </div>
  );
}
