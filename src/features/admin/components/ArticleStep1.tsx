"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ImagePlus, ArrowRight, Tag, Type, AlignLeft, Hash, X, Star, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';
import ImagePositionPicker from '@/components/shared/editor/ImagePositionPicker';
import { getTagsAction } from '@/features/admin/actions/article';
import { uploadImage } from '@/lib/compress-image';
import type { TopicItem } from '@/features/admin/actions/topic';
import TopicSelector from '@/components/shared/editor/TopicSelector';

const badgeOptions = ['Hot', 'New', 'Trending', 'Featured'];

interface Step1Props {
  title: string;
  category: string;
  tags: string[];
  badges: string[];
  summary: string;
  coverPreview: string | null;
  coverPosition: string;
  thumbnailPreview: string | null;
  thumbnailPosition: string;
  slug: string;
  topics: TopicItem[];
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onTagsChange: (tags: string[]) => void;
  onBadgesChange: (badges: string[]) => void;
  onSummaryChange: (v: string) => void;
  onCoverChange: (url: string) => void;
  onCoverPositionChange: (pos: string) => void;
  onThumbnailChange: (url: string) => void;
  onThumbnailPositionChange: (pos: string) => void;
  onCancel: () => void;
  onNext: () => void;
}

export default function ArticleStep1({
  title, category, tags, badges, summary,
  coverPreview, coverPosition, thumbnailPreview, thumbnailPosition,
  slug, topics,
  onTitleChange, onSlugChange, onCategoryChange, onTagsChange, onBadgesChange, onSummaryChange,
  onCoverChange, onCoverPositionChange, onThumbnailChange, onThumbnailPositionChange,
  onCancel, onNext,
}: Step1Props) {
  const coverRef  = useRef<HTMLInputElement>(null);
  const thumbRef  = useRef<HTMLInputElement>(null);
  const validPreview = (url: string | null) => (url && !url.startsWith('blob:')) ? url : null;
  const [coverUrl,  setCoverUrl]  = useState(validPreview(coverPreview) ?? '');
  const [thumbUrl,  setThumbUrl]  = useState(validPreview(thumbnailPreview) ?? '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);

  // Tag combobox state
  const [tagInput,      setTagInput]      = useState('');
  const [allTags,       setAllTags]       = useState<string[]>([]);
  const [showSuggest,   setShowSuggest]   = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);
  const tagInputRef  = useRef<HTMLInputElement>(null);
  const suggestRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTagsAction().then(setAllTags);
  }, []);

  const suggestions = tagInput.trim()
    ? allTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    : allTags.filter(t => !tags.includes(t));

  const addTag = (name: string) => {
    const val = name.trim();
    if (val && !tags.includes(val)) onTagsChange([...tags, val]);
    setTagInput('');
    setShowSuggest(false);
    setActiveIndex(-1);
    tagInputRef.current?.focus();
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploadingCover(true);
    try {
      // Preview ngay lập tức
      const preview = URL.createObjectURL(file);
      setCoverUrl(preview);
      // Upload + compress (max 1920×1080)
      const url = await uploadImage(file, 1920, 1080);
      URL.revokeObjectURL(preview);
      setCoverUrl(url);
      onCoverChange(url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload thất bại');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploadingThumb(true);
    try {
      const preview = URL.createObjectURL(file);
      setThumbUrl(preview);
      // Upload + compress (max 800×600)
      const url = await uploadImage(file, 800, 600);
      URL.revokeObjectURL(preview);
      setThumbUrl(url);
      onThumbnailChange(url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload thất bại');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleCoverUrlBlur = () => { if (coverUrl.trim()) onCoverChange(coverUrl.trim()); };
  const handleThumbUrlBlur = () => { if (thumbUrl.trim()) onThumbnailChange(thumbUrl.trim()); };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
      setActiveIndex(-1);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 border-b border-zinc-200 dark:border-white/5 pb-6">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Thông tin bài viết</h2>
          <p className="text-zinc-500 mt-1">Cung cấp các thông tin cơ bản và hình ảnh hiển thị cho bài viết của bạn.</p>
        </div>

        <div className="space-y-10">
          
          {/* TOP SECTION: Media */}
          <div className="flex flex-col md:flex-row items-start gap-5">

            {/* Upload error */}
            {uploadError && (
              <div className="w-full text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-500/20">
                {uploadError}
              </div>
            )}

            {/* Cover Image */}
            <div className="space-y-2 w-full max-w-lg">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ảnh bìa (16:9)</label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} disabled={uploadingCover} />
              {validPreview(coverPreview) ? (
                <ImagePositionPicker
                  src={validPreview(coverPreview)!}
                  position={coverPosition}
                  onChange={onCoverPositionChange}
                  aspectClass="aspect-video"
                  onClear={() => { setCoverUrl(''); onCoverChange(''); }}
                  onUpload={() => coverRef.current?.click()}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="url"
                        value={coverUrl}
                        onChange={e => setCoverUrl(e.target.value)}
                        onBlur={handleCoverUrlBlur}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-800 dark:text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => coverRef.current?.click()}
                      disabled={uploadingCover}
                      className="shrink-0 p-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
                      title="Upload ảnh"
                    >
                      {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    </button>
                  </div>
                  <div
                    onClick={() => !uploadingCover && coverRef.current?.click()}
                    className={`w-full aspect-video rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center transition-all group bg-zinc-50 dark:bg-white/5 ${uploadingCover ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                  >
                    {uploadingCover
                      ? <><Loader2 className="w-6 h-6 text-primary animate-spin" /><span className="text-xs text-zinc-500 mt-1">Đang nén & upload...</span></>
                      : <><ImagePlus className="w-6 h-6 text-zinc-300 group-hover:text-primary transition-colors" /><span className="text-xs text-zinc-500 group-hover:text-primary mt-1">Kéo thả hoặc click để chọn ảnh</span></>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-2 w-52 shrink-0">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Thumbnail (4:3)</label>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbFile} disabled={uploadingThumb} />
              {validPreview(thumbnailPreview) ? (
                <ImagePositionPicker
                  src={validPreview(thumbnailPreview)!}
                  position={thumbnailPosition}
                  onChange={onThumbnailPositionChange}
                  aspectClass="aspect-[4/3]"
                  onClear={() => { setThumbUrl(''); onThumbnailChange(''); }}
                  onUpload={() => thumbRef.current?.click()}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="url"
                        value={thumbUrl}
                        onChange={e => setThumbUrl(e.target.value)}
                        onBlur={handleThumbUrlBlur}
                        placeholder="https://..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-800 dark:text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => thumbRef.current?.click()}
                      disabled={uploadingThumb}
                      className="shrink-0 p-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
                      title="Upload ảnh"
                    >
                      {uploadingThumb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div
                    onClick={() => !uploadingThumb && thumbRef.current?.click()}
                    className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center transition-all group bg-zinc-50 dark:bg-white/5 ${uploadingThumb ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                  >
                    {uploadingThumb
                      ? <><Loader2 className="w-5 h-5 text-primary animate-spin" /><span className="text-[10px] text-zinc-500 mt-1">Uploading...</span></>
                      : <><ImagePlus className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" /><span className="text-[10px] text-zinc-500 group-hover:text-primary mt-1 uppercase font-bold">Thêm ảnh</span></>
                    }
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5 my-4" />

          {/* BOTTOM SECTION: Text Fields */}
          <div className="space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3.5 h-3.5" /> Tiêu đề bài viết <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                className="w-full max-w-[500px] text-base font-normal bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 dark:text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Topic */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Chủ đề <span className="text-rose-500">*</span>
              </label>
              <TopicSelector 
                topics={topics}
                selectedId={category}
                onSelect={onCategoryChange}
              />
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> Nhãn nổi bật (Badges)
              </label>
              <div className="flex flex-wrap gap-2">
                {badgeOptions.map(b => (
                  <button 
                    key={b} 
                    onClick={() => {
                      if (badges.includes(b)) {
                        onBadgesChange([]);
                      } else {
                        onBadgesChange([b]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      badges.includes(b)
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Từ khóa (Tags)
              </label>
              <div className="relative">
                <div
                  className="flex flex-wrap gap-2 p-2 bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl min-h-[52px] items-center focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all cursor-text"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-zinc-300 dark:border-white/10 rounded-lg text-[13px] font-semibold text-zinc-700 dark:text-slate-200 shadow-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeTag(tag); }}
                        className="text-zinc-500 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    placeholder={tags.length === 0 ? "Tìm hoặc tạo tag mới..." : ""}
                    onChange={e => { setTagInput(e.target.value); setShowSuggest(true); setActiveIndex(-1); }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-white px-2 placeholder:text-zinc-500 min-w-[160px]"
                  />
                </div>

                {/* Dropdown */}
                {showSuggest && (
                  <div
                    ref={suggestRef}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto"
                  >
                    {suggestions.length > 0 && (
                      <div className="p-1">
                        {suggestions.map((t, i) => (
                          <button
                            key={t}
                            type="button"
                            onMouseDown={() => addTag(t)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                              i === activeIndex
                                ? 'bg-primary text-white'
                                : 'text-zinc-700 dark:text-slate-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                            }`}
                          >
                            <Hash className="w-3.5 h-3.5 opacity-50 shrink-0" />
                            {t}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tạo mới */}
                    {tagInput.trim() && !allTags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && (
                      <div className="border-t border-zinc-200 dark:border-white/5 p-1">
                        <button
                          type="button"
                          onMouseDown={() => addTag(tagInput)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          Tạo tag &ldquo;<span className="font-semibold">{tagInput.trim()}</span>&rdquo;
                        </button>
                      </div>
                    )}

                    {suggestions.length === 0 && !tagInput.trim() && (
                      <p className="px-4 py-3 text-xs text-zinc-500">Chưa có tag nào. Gõ để tạo mới.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5" /> Mô tả bài viết
              </label>
              <textarea
                value={summary}
                onChange={e => onSummaryChange(e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn hiển thị trên card và kết quả tìm kiếm..."
                className="w-full text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-zinc-800 dark:text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Navigation */}
            <div className="pt-6 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all"
              >
                Hủy bỏ
              </button>
              <div className="flex items-center gap-4">
                <p className="text-[11px] text-zinc-500 italic hidden sm:block">* Điền đủ Tiêu đề và Chủ đề để tiếp tục</p>
                <button
                  onClick={onNext}
                  disabled={!title.trim() || !category}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Tiếp thao: Viết nội dung
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
