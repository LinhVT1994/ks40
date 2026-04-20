'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MemberStep1 from './MemberStep1';
import MemberStep2 from './MemberStep2';
import MemberStep3 from './MemberStep3';
import { createMemberArticleAction, updateMemberArticleAction, submitMemberArticleAction } from '@/features/member/actions/write';
import type { TopicItem } from '@/features/admin/actions/topic';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EditData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  overview: string;
  objectives: string;
  content: string;
  cover: string;
  coverPosition: string;
  thumbnail: string;
  thumbnailPosition: string;
  topicId: string;
  tags: string[];
  status?: string;
  rejectionReason?: string | null;
}

interface Props {
  topics: TopicItem[];
  editArticle?: EditData;
}

export default function MemberArticleStepper({ topics, editArticle }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Autosave status
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentId, setCurrentId] = useState<string | undefined>(editArticle?.id);

  const isEdit = !!editArticle;

  // Step 1: Info
  const [title, setTitle] = useState(editArticle?.title ?? '');
  const [slug, setSlug] = useState(editArticle?.slug ?? '');
  const [topicId, setTopicId] = useState(editArticle?.topicId ?? '');
  const [tags, setTags] = useState<string[]>(
    editArticle?.tags?.map((t: any) => t.tag?.name).filter(Boolean) ?? []
  );
  const [summary, setSummary] = useState(editArticle?.summary ?? '');
  const [cover, setCover] = useState(editArticle?.cover ?? '');
  const [coverPosition, setCoverPosition] = useState(editArticle?.coverPosition ?? '50% 50%');
  const [thumbnail, setThumbnail] = useState(editArticle?.thumbnail ?? '');
  const [thumbnailPosition, setThumbnailPosition] = useState(editArticle?.thumbnailPosition ?? '50% 50%');

  // Step 2: Content
  const [content, setContent] = useState(editArticle?.content ?? '');
  const [overview, setOverview] = useState(editArticle?.overview ?? '');
  const [objectives, setObjectives] = useState(editArticle?.objectives ?? '');

  // Autosave logic
  useEffect(() => {
    // Only autosave if we have the minimum requirements (Title & Topic)
    if (!title || !topicId) return;

    const timer = setTimeout(async () => {
      setSavingStatus('saving');
      const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
      
      const data = {
        title, slug, summary, overview, objectives, 
        content, cover: cover || undefined, coverPosition,
        thumbnail: thumbnail || undefined, thumbnailPosition,
        topicId, tags, readTime
      };

      try {
        if (currentId) {
          // Update existing draft
          await updateMemberArticleAction(currentId, data);
        } else {
          // Create new draft
          const result = await createMemberArticleAction(data);
          if (result.success) {
            setCurrentId(result.id);
            // Update URL without reload to reflect the new ID
            window.history.replaceState(null, '', `/write/${result.id}`);
          }
        }
        setSavingStatus('saved');
        // Reset to idle after a show period
        setTimeout(() => setSavingStatus('idle'), 3000);
      } catch (err) {
        console.error('Autosave error:', err);
        setSavingStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, slug, topicId, content, summary, overview, objectives, tags, cover, thumbnail, currentId]);

  const handlePublish = () => {
    setError(null);
    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const data = {
      title,
      slug,
      summary,
      overview,
      objectives,
      content,
      cover: cover || undefined,
      coverPosition,
      thumbnail: thumbnail || undefined,
      thumbnailPosition,
      topicId,
      tags,
      readTime,
    };

    startTransition(async () => {
      // 1. Save the final version first
      const saveResult = currentId
        ? await updateMemberArticleAction(currentId, { ...data })
        : await createMemberArticleAction(data);

      if (!saveResult.success) {
        setError(saveResult.error);
        setStep(3);
        return;
      }

      const finalId = currentId || saveResult.id;

      // 2. Submit for review
      const submitResult = await submitMemberArticleAction(finalId);

      if (submitResult.success) {
        toast.success('Đã gửi bài viết thành công! Admin sẽ kiểm duyệt sớm.', {
          description: 'Cảm ơn sự đóng góp tuyệt vời của bạn.',
        });
        router.push(`/profile/me?tab=drafts`);
        router.refresh();
      } else {
        setError(submitResult.error);
        setStep(3);
      }
    });
  };

  const handleSaveOnly = () => {
    setError(null);
    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const data = {
      title, slug, summary, overview, objectives, 
      content, cover: cover || undefined, coverPosition,
      thumbnail: thumbnail || undefined, thumbnailPosition,
      topicId, tags, readTime,
    };

    startTransition(async () => {
      const result = currentId
        ? await updateMemberArticleAction(currentId, { ...data })
        : await createMemberArticleAction(data);

      if (result.success) {
        toast.success('Đã lưu bản nháp thành công');
        router.push(`/profile/me?tab=drafts`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Immersive Header / Local Nav */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-zinc-300 dark:border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="text-xs font-black text-zinc-500 hover:text-primary uppercase tracking-widest transition-colors"
          >
            Hủy bỏ
          </button>
          <div className="h-4 w-px bg-zinc-200 dark:bg-white/10" />
          <h1 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-widest">
            {currentId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
          </h1>
        </div>

        <div className="flex items-center gap-8">
          {/* Stepper Dots/Status */}
          <div className="hidden md:flex items-center gap-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'bg-primary ring-4 ring-primary/20 scale-125' : 
                  step > s ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-white/10'
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  step === s ? 'text-zinc-800 dark:text-white' : 'text-zinc-500'
                }`}>
                  {s === 1 ? 'Thông tin' : s === 2 ? 'Nội dung' : 'Gửi duyệt'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-zinc-100 dark:bg-white/5 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             {step > 1 && (
               <button 
                 onClick={() => setStep(prev => prev - 1)}
                 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
               >
                 Quay lại
               </button>
             )}
             
             {step < 3 ? (
               <button 
                 onClick={() => setStep(prev => prev + 1)}
                 className="px-6 py-2 bg-zinc-800 dark:bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/10 cursor-pointer"
               >
                 Tiếp theo
               </button>
             ) : (
               <div className="flex items-center gap-2">
                 <button 
                    onClick={handleSaveOnly}
                    disabled={isPending}
                    className="px-6 py-2 bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all border border-zinc-300 dark:border-white/5 cursor-pointer"
                 >
                    Lưu nháp
                 </button>
                 <button 
                    onClick={handlePublish}
                    disabled={isPending}
                    className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
                 >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gửi bài viết'}
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ${step !== 1 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`${step !== 1 ? 'w-full h-full flex flex-col' : 'max-w-4xl mx-auto py-12 px-6'}`}>
          {/* Rejection Feedback Banner - Only show in Step 1 */}
          {step === 1 && editArticle?.status === 'REJECTED' && editArticle?.rejectionReason && (
            <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Phản hồi từ Admin</h3>
                  <p className="text-[11px] text-rose-500/60 font-medium uppercase tracking-wider">Cần điều chỉnh nội dung</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-slate-300 leading-relaxed italic italic bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-500/5">
                "{editArticle.rejectionReason}"
              </p>
            </div>
          )}
          {step === 1 && (
            <MemberStep1 
              title={title} setTitle={setTitle}
              slug={slug} setSlug={setSlug}
              topicId={topicId} setTopicId={setTopicId}
              tags={tags} setTags={setTags}
              summary={summary} setSummary={setSummary}
              cover={cover} setCover={setCover}
              coverPosition={coverPosition} setCoverPosition={setCoverPosition}
              thumbnail={thumbnail} setThumbnail={setThumbnail}
              thumbnailPosition={thumbnailPosition} setThumbnailPosition={setThumbnailPosition}
              topics={topics}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <MemberStep2 
              title={title}
              content={content} setContent={setContent}
              overview={overview} setOverview={setOverview}
              objectives={objectives} setObjectives={setObjectives}
              topic={topics.find(t => t.id === topicId)}
              tags={tags}
              cover={cover}
              coverPosition={coverPosition}
              thumbnail={thumbnail}
              thumbnailPosition={thumbnailPosition}
              author={session?.user ? {
                name: session.user.name ?? 'Tác giả',
                image: session.user.image ?? undefined
              } : undefined}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <MemberStep3 
              data={{ 
                title, 
                content,
                overview,
                objectives,
                topic: topics.find(t => t.id === topicId),
                tags, 
                summary, 
                cover, 
                coverPosition,
                thumbnail,
                author: session?.user ? {
                  name: session.user.name ?? 'Tác giả',
                  image: session.user.image ?? undefined
                } : undefined,
                wordCount: content.split(/\s+/).length 
              }}
              onBack={() => setStep(2)}
              onPublish={handlePublish}
              isPending={isPending}
            />
          )}
        </div>
      </div>

      {/* Floating Autosave Indicator - Fixed corner position */}
      <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-xl transition-all duration-500 transform ${
          savingStatus === 'idle' ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'
        } ${
          savingStatus === 'saving' ? 'bg-white/90 dark:bg-slate-900/90 border-primary/20 text-primary' : 
          savingStatus === 'saved' ? 'bg-emerald-500/90 text-white border-emerald-400/20' : 
          'bg-rose-500/90 text-white border-rose-400/20'
        }`}>
          {savingStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {savingStatus === 'saving' ? 'Đang lưu bản nháp...' : 
             savingStatus === 'saved' ? 'Đã tự động lưu bản nháp' : 
             'Lỗi lưu bản nháp'}
          </span>
        </div>
      </div>
    </div>
  );
}
