'use client';

import { useState } from 'react';
import { FileArchive, FileText, File, Download, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type Resource = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('gzip'))
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  if (mimeType.includes('pdf'))
    return <FileText className="w-5 h-5 text-rose-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

export default function ArticleResources({ resources }: { resources: Resource[] }) {
  const [open, setOpen] = useState(false);

  if (resources.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Download className="w-4 h-4" /> Tài nguyên đính kèm
          <span className="text-xs font-normal normal-case text-slate-400">({resources.length})</span>
        </h3>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-2 mt-4">
          {resources.map(r => (
            <Link
              key={r.id}
              href={`/download/${r.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
            >
              <FileIcon mimeType={r.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                  {r.name}
                </p>
                <p className="text-xs text-slate-400">{formatBytes(r.size)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-3.5 h-3.5" /> Tải về
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
