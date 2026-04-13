'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ImagePlus, ArrowRight, Tag, Type, AlignLeft, Hash, X, Link as LinkIcon, Plus, Loader2, Star } from 'lucide-react';
import ImagePositionPicker from '@/components/shared/editor/ImagePositionPicker';
import { getTagsAction } from '@/features/admin/actions/article';
import { uploadImage } from '@/lib/compress-image';
import type { TopicItem } from '@/features/admin/actions/topic';
import TopicSelector from '@/components/shared/editor/TopicSelector';

interface Step1Props {
  title: string; setTitle: (v: string) => void;
  slug: string; setSlug: (v: string) => void;
  topicId: string; setTopicId: (v: string) => void;
  tags: string[]; setTags: (v: string[]) => void;
  summary: string; setSummary: (v: string) => void;
  cover: string; setCover: (v: string) => void;
  coverPosition: string; setCoverPosition: (v: string) => void;
  thumbnail: string; setThumbnail: (v: string) => void;
  thumbnailPosition: string; setThumbnailPosition: (v: string) => void;
  topics: TopicItem[];
  onNext: () => void;
}

export default function MemberStep1({
  title, setTitle, slug, setSlug, topicId, setTopicId, tags, setTags, summary, setSummary,
  cover, setCover, coverPosition, setCoverPosition, thumbnail, setThumbnail, thumbnailPosition, setThumbnailPosition, 
  topics, onNext
}: Step1Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    getTagsAction().then(setAllTags);
  }, []);

  const suggestions = tagInput.trim()
    ? allTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    : allTags.filter(t => !tags.includes(t));

  const toSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSlug(toSlug(v));
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, 1920, 1080);
      setCover(url);
    } catch (err) { console.error(err); } finally { setUploadingCover(false); }
  };

  const handleThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const url = await uploadImage(file, 800, 600);
      setThumbnail(url);
    } catch (err) { console.error(err); } finally { setUploadingThumb(false); }
  };

  const addTag = (name: string) => {
    const val = name.trim();
    if (val && !tags.includes(val)) setTags([...tags, val]);
    setTagInput('');
    setShowSuggest(false);
    setActiveIndex(-1);
    tagInputRef.current?.focus();
  };

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
      setTags(tags.slice(0, -1));
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-transparent p-6 md:p-12 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/5">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {/* Section: Media */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Hình ảnh hiển thị</label>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover 16:9 */}
            <div className="flex-1 space-y-3 w-full">
               <span className="text-[10px] font-bold text-zinc-500 uppercase">Ảnh bìa (16:9)</span>
               {cover ? (
                 <ImagePositionPicker 
                   src={cover} 
                   position={coverPosition} 
                   onChange={setCoverPosition} 
                   aspectClass="aspect-video"
                   onClear={() => setCover('')}
                   onUpload={() => coverRef.current?.click()}
                 />
               ) : (
                 <div 
                   onClick={() => coverRef.current?.click()}
                   className="aspect-video rounded-3xl border-2 border-dashed border-zinc-300 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                 >
                   {uploadingCover ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <ImagePlus className="w-8 h-8 text-zinc-300 group-hover:text-primary transition-colors" />}
                   <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-primary">Tải ảnh bìa</span>
                 </div>
               )}
               <input ref={coverRef} type="file" className="hidden" onChange={handleCoverFile} accept="image/*" />
            </div>

            {/* Thumbnail 4:3 */}
            <div className="w-full md:w-56 space-y-3 shrink-0">
               <span className="text-[10px] font-bold text-zinc-500 uppercase">Thumbnail (4:3)</span>
               {thumbnail ? (
                  <ImagePositionPicker 
                    src={thumbnail} 
                    position={thumbnailPosition} 
                    onChange={setThumbnailPosition} 
                    aspectClass="aspect-[4/3]"
                    onClear={() => setThumbnail('')}
                    onUpload={() => thumbRef.current?.click()}
                  />
               ) : (
                  <div 
                    onClick={() => thumbRef.current?.click()}
                    className="aspect-[4/3] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    {uploadingThumb ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ImagePlus className="w-6 h-6 text-zinc-300 group-hover:text-primary transition-colors" />}
                    <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-primary">Ảnh nhỏ</span>
                  </div>
               )}
               <input ref={thumbRef} type="file" className="hidden" onChange={handleThumbFile} accept="image/*" />
            </div>
          </div>
        </section>

        {/* Section: General Info */}
        <section className="space-y-8">
          <div className="space-y-4">
            {/* Immersive Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Type className="w-3.5 h-3.5" /> Tiêu đề bài viết
              </label>
              <textarea 
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề hấp dẫn..."
                rows={1}
                className="w-full bg-transparent border-none p-0 text-3xl md:text-5xl font-black outline-none placeholder:text-zinc-200 dark:placeholder:text-white/10 resize-none leading-tight py-2"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
            
            {/* Subtle Permalink/Slug */}
            <div className="flex items-center gap-2 group">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-300 dark:border-white/10 rounded-full">
                <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">lenote.dev/article/</span>
                <input 
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="slug"
                  className="bg-transparent border-none outline-none text-[11px] font-mono font-bold text-primary min-w-[100px] w-auto inline-block p-0"
                  style={{ width: `${Math.max(slug.length, 4)}ch` }}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Nhấp để chỉnh sửa đường dẫn</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <Tag className="w-3.5 h-3.5" /> Chủ đề chính
            </label>
            <TopicSelector topics={topics} selectedId={topicId} onSelect={setTopicId} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <Hash className="w-3.5 h-3.5" /> Từ khóa (Tags)
            </label>
            <div className="relative">
              <div 
                className="flex flex-wrap gap-2 p-3 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl min-h-[58px] items-center cursor-text focus-within:ring-4 focus-within:ring-primary/10 transition-all"
                onClick={() => tagInputRef.current?.focus()}
              >
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm">
                    {tag}
                    <button onClick={(e) => { e.stopPropagation(); setTags(tags.filter(t => t !== tag)); }} className="hover:text-rose-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <input 
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={e => { setTagInput(e.target.value); setShowSuggest(true); setActiveIndex(-1); }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? "+ Thêm từ khóa..." : ""}
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-zinc-500 px-2 min-w-[120px]"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggest && (
                <div 
                  ref={suggestRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {suggestions.length > 0 && (
                    <div className="p-2">
                      {suggestions.map((t, i) => (
                        <button
                          key={t}
                          type="button"
                          onMouseDown={() => addTag(t)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-3 ${
                            i === activeIndex 
                              ? 'bg-zinc-800 dark:bg-primary text-white' 
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <Hash className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Create New Tag Option */}
                  {tagInput.trim() && !allTags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && (
                    <div className="border-t border-zinc-200 dark:border-white/5 p-2">
                      <button
                        type="button"
                        onMouseDown={() => addTag(tagInput)}
                        className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-3"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        Tạo tag mới: "{tagInput.trim()}"
                      </button>
                    </div>
                  )}

                  {suggestions.length === 0 && !tagInput.trim() && (
                    <div className="p-6 text-center">
                      <Tag className="w-8 h-8 text-zinc-200 dark:text-white/5 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bắt đầu gõ để tìm hoặc tạo tag</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <AlignLeft className="w-3.5 h-3.5" /> Tóm tắt bài viết
              </label>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${summary.length >= 280 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`}>
                {summary.length} / 300
              </span>
            </div>
            <textarea 
              value={summary}
              onChange={e => setSummary(e.target.value.slice(0, 300))}
              placeholder="Giới thiệu lôi cuốn về nội dung của bạn..."
              rows={3}
              maxLength={300}
              className="w-full bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
            />
          </div>
        </section>

        {/* Bottom Navigation for Step 1 */}
        <div className="pt-12 border-t border-zinc-200 dark:border-white/5 flex justify-end">
           <button 
             onClick={() => {
               console.log('Step 1 Next clicked', { title, topicId });
               onNext();
             }}
             className="flex items-center gap-2 px-10 py-4 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 bg-zinc-800 dark:bg-primary hover:opacity-90 shadow-zinc-800/10 dark:shadow-primary/20 cursor-pointer"
           >
             Tiếp theo: Viết nội dung <ArrowRight className="w-4 h-4" />
           </button>
        </div>

      </div>
    </div>
  );
}
