'use client';

import React, { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Type, AlignLeft, ArrowLeft, Link as LinkIcon, Loader2, Globe, Users, Shield, Save } from 'lucide-react';
import Link from 'next/link';
import { ArticleAudience } from '@prisma/client';
import { updateBookAction } from '@/features/admin/actions/book';
import { uploadImage } from '@/lib/compress-image';

type BookEditProps = {
  book: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover: string | null;
    audience: ArticleAudience;
    published: boolean;
  };
};

export default function BookEditClient({ book }: BookEditProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title:       book.title,
    slug:        book.slug,
    description: book.description ?? '',
    cover:       book.cover ?? '',
    audience:    book.audience,
    published:   book.published,
  });

  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setSuccess(false);
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploadingCover(true);
    try {
      const preview = URL.createObjectURL(file);
      set('cover', preview);
      const url = await uploadImage(file, 1920, 1080);
      URL.revokeObjectURL(preview);
      set('cover', url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload ảnh bìa thất bại');
    } finally {
      setUploadingCover(false);
    }
  };

  const submit = () => {
    if (!form.title.trim()) { setError('Tiêu đề không được để trống.'); return; }
    if (!form.slug.trim())  { setError('Slug không được để trống.');    return; }
    setError('');
    setSuccess(false);
    startTransition(async () => {
      const res = await updateBookAction(book.id, form);
      if (!res.success) { setError(res.error); return; }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent pb-24">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/documents?tab=books"
              className="p-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Chỉnh sửa Lộ trình</h2>
              <p className="text-zinc-500 mt-1">Cập nhật thông tin cơ bản của cuốn sách.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/books/${book.id}/chapters`}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
            >
              Quản lý Chapters
            </Link>
            <button
              onClick={submit} disabled={pending}
              className="flex items-center gap-2 px-8 py-3 bg-zinc-800 dark:bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm font-medium">
            Đã lưu thay đổi thành công.
          </div>
        )}

        <div className="space-y-10">

          {/* Cover */}
          <div className="flex flex-col md:flex-row items-start gap-5">
            {uploadError && (
              <div className="w-full text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-500/20">
                {uploadError}
              </div>
            )}
            <div className="space-y-2 w-full max-w-lg">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                Ảnh bìa Lộ trình
              </label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} disabled={uploadingCover} />

              {form.cover ? (
                <div className="relative w-full rounded-xl overflow-hidden border border-zinc-300 dark:border-white/10 group bg-zinc-100 dark:bg-white/5 flex justify-center items-center">
                  <img src={form.cover} alt="Cover" className="w-full h-auto max-h-[400px] object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => coverRef.current?.click()} className="px-4 py-2 bg-white/20 hover:bg-white/40 text-white rounded-lg text-sm font-bold transition-all">
                      Đổi ảnh
                    </button>
                    <button onClick={() => set('cover', '')} className="px-4 py-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg text-sm font-bold transition-all">
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="url" value={form.cover} onChange={e => set('cover', e.target.value)}
                        placeholder="Dán link ảnh HTTPS..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-800 dark:text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <button
                      type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                      className="shrink-0 p-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
                    >
                      {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    </button>
                  </div>
                  <div
                    onClick={() => !uploadingCover && coverRef.current?.click()}
                    className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center transition-all group bg-zinc-50 dark:bg-white/5 ${uploadingCover ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                  >
                    {uploadingCover
                      ? <><Loader2 className="w-6 h-6 text-primary animate-spin" /><span className="text-xs text-zinc-500 mt-1">Đang nén & upload...</span></>
                      : <><ImagePlus className="w-6 h-6 text-zinc-300 group-hover:text-primary transition-colors" /><span className="text-xs text-zinc-500 group-hover:text-primary mt-1">Kéo thả hoặc click để chọn ảnh</span></>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Text fields */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3.5 h-3.5" /> Tiêu đề <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full max-w-[500px] text-base bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5" /> Slug <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.slug} onChange={e => set('slug', e.target.value)}
                className="w-full max-w-[500px] text-sm font-mono bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5" /> Mô tả ngắn
              </label>
              <textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                rows={3}
                className="w-full text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-zinc-800 dark:text-white"
              />
            </div>

            <div className="space-y-4 pt-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Quyền truy cập &amp; Xuất bản
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'PUBLIC',  label: 'Cộng đồng',    icon: Globe },
                  { id: 'MEMBERS', label: 'Thành viên KS', icon: Users },
                  { id: 'PREMIUM', label: 'Premium',       icon: Shield },
                ].map(aud => {
                  const Icon = aud.icon;
                  return (
                    <button
                      key={aud.id} onClick={() => set('audience', aud.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        form.audience === aud.id
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4 opacity-70" /> {aud.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl p-4 flex items-center justify-between max-w-lg">
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-white">Hiển thị công khai (Published)</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Sách sẽ kích hoạt và hiển thị trên bảng tin.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
