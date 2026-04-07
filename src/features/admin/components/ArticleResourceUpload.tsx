"use client";

import React, { useRef, useState } from 'react';
import { FileArchive, FileText, File, Trash2, Upload, Loader2, Paperclip } from 'lucide-react';
import type { ResourceDraft } from '@/features/admin/actions/article';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('gzip')) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

interface Props {
  resources: ResourceDraft[];
  onChange: (resources: ResourceDraft[]) => void;
  existingResources?: { id: string; name: string; size: number; mimeType: string }[];
  onDeleteExisting?: (id: string) => void;
}

export default function ArticleResourceUpload({ resources, onChange, existingResources = [], onDeleteExisting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const added: ResourceDraft[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/upload/file', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? 'Upload thất bại'); continue; }
        added.push({ name: file.name, url: json.url, size: file.size, mimeType: file.type });
      } catch {
        setError('Upload thất bại, thử lại sau.');
      }
    }

    if (added.length > 0) onChange([...resources, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => onChange(resources.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <Paperclip className="w-3.5 h-3.5" /> Tài nguyên đính kèm
      </label>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".zip,.rar,.7z,.tar,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
            {uploading ? 'Đang tải lên…' : 'Kéo thả file hoặc click để chọn'}
          </p>
          <p className="text-xs text-slate-400 mt-1">ZIP, RAR, 7Z, PDF, DOCX, XLSX… — tối đa 100MB mỗi file</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}

      {/* Existing resources */}
      {existingResources.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã đính kèm</p>
          {existingResources.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <FileIcon mimeType={r.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(r.size)}</p>
              </div>
              {onDeleteExisting && (
                <button
                  onClick={() => onDeleteExisting(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New file list */}
      {resources.length > 0 && (
        <div className="space-y-2">
          {existingResources.length > 0 && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thêm mới</p>}
          {resources.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <FileIcon mimeType={r.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(r.size)}</p>
              </div>
              <button
                onClick={() => remove(i)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
