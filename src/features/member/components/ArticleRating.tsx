'use client';

import { useState, useTransition, useCallback } from 'react';
import { Star, Pencil, Trash2, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import type { RatingSummary } from '@/features/articles/actions/rating';
import {
  upsertRatingAction,
  deleteRatingAction,
} from '@/features/articles/actions/rating';

// ─── Props ──────────────────────────────────────────────────

type Props = {
  articleId: string;
  initialSummary: RatingSummary;
};

// ─── Main Component ─────────────────────────────────────────

export default function ArticleRating({ articleId, initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [editing, setEditing] = useState(false);

  const handleRated = useCallback((updated: Partial<RatingSummary>) => {
    setSummary(prev => ({ ...prev, ...updated }));
    setEditing(false);
  }, []);

  const handleDeleted = useCallback(() => {
    setSummary(prev => ({ ...prev, userRating: null }));
  }, []);

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/5">
      <h3 className="text-sm font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
        <Star className="w-4 h-4" /> Đánh giá bài viết
      </h3>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Average + Distribution */}
        <AverageDisplay
          averageScore={summary.averageScore}
          totalCount={summary.totalCount}
          distribution={summary.distribution}
        />

        {/* Right: Form / Status */}
        <div className="flex-1 min-w-0">
          {!summary.canRate.eligible && !summary.userRating && (
            <RatingGate reason={summary.canRate.reason!} progress={summary.canRate.progress} />
          )}

          {summary.canRate.eligible && !summary.userRating && (
            <RatingForm articleId={articleId} onRated={handleRated} />
          )}

          {summary.userRating && !editing && (
            <UserReviewSummary
              score={summary.userRating.score}
              review={summary.userRating.review}
              onEdit={() => setEditing(true)}
              onDelete={handleDeleted}
              articleId={articleId}
            />
          )}

          {summary.userRating && editing && (
            <RatingForm
              articleId={articleId}
              initialScore={summary.userRating.score}
              initialReview={summary.userRating.review ?? ''}
              onRated={handleRated}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AverageDisplay ─────────────────────────────────────────

function AverageDisplay({
  averageScore,
  totalCount,
  distribution,
}: {
  averageScore: number;
  totalCount: number;
  distribution: [number, number, number, number, number];
}) {
  return (
    <div className="shrink-0 w-full lg:w-[260px]">
      <div className="text-center lg:text-left mb-4">
        <div className="text-4xl font-black text-zinc-800 dark:text-white tracking-tighter">
          {totalCount > 0 ? averageScore.toFixed(1) : '—'}
        </div>
        <div className="flex items-center justify-center lg:justify-start gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-4 h-4 ${i <= Math.round(averageScore) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-white/10'}`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {totalCount > 0 ? `${totalCount} đánh giá` : 'Chưa có đánh giá'}
        </p>
      </div>

      {/* Distribution bars */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution[star - 1];
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-bold text-zinc-500">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-zinc-400 tabular-nums">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── RatingGate ─────────────────────────────────────────────

function RatingGate({ reason, progress }: { reason: string; progress?: number }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10">
      {reason === 'unauthenticated' && (
        <>
          <LogIn className="w-5 h-5 text-zinc-400 shrink-0" />
          <p className="text-sm text-zinc-500">Đăng nhập để đánh giá bài viết này.</p>
        </>
      )}
      {reason === 'is_author' && (
        <>
          <Lock className="w-5 h-5 text-zinc-400 shrink-0" />
          <p className="text-sm text-zinc-500">Đây là bài viết của bạn.</p>
        </>
      )}
      {reason === 'not_enough_progress' && (
        <>
          <Lock className="w-5 h-5 text-zinc-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-zinc-500">
              Đọc thêm {Math.max(0, 70 - (progress ?? 0)).toFixed(0)}% để đánh giá
            </p>
            <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">{(progress ?? 0).toFixed(0)}% / 70% yêu cầu</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── RatingForm ─────────────────────────────────────────────

function RatingForm({
  articleId,
  initialScore = 0,
  initialReview = '',
  onRated,
  onCancel,
}: {
  articleId: string;
  initialScore?: number;
  initialReview?: string;
  onRated: (updated: Partial<RatingSummary>) => void;
  onCancel?: () => void;
}) {
  const [score, setScore] = useState(initialScore);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(initialReview);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (score === 0) return;
    startTransition(async () => {
      const result = await upsertRatingAction(articleId, score, review || undefined);
      if (result.success) {
        toast.success(initialScore > 0 ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá');
        onRated({ userRating: { score, review: review || null } });
      } else {
        toast.error(result.error ?? 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setScore(prev => (prev === i ? 0 : i))}
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                i <= (hover || score)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-zinc-300 dark:text-white/15'
              }`}
            />
          </button>
        ))}
        {score > 0 && (
          <span className="ml-2 text-sm font-bold text-zinc-600 dark:text-slate-300">
            {score}/5
          </span>
        )}
      </div>

      {/* Review textarea */}
      <div className="relative">
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          maxLength={300}
          rows={3}
          disabled={isPending}
          placeholder="Nhận xét ngắn (tùy chọn)..."
          className="w-full px-4 py-3 text-sm rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] text-zinc-800 dark:text-slate-200 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
        />
        <span className="absolute bottom-2 right-3 text-[10px] text-zinc-400 tabular-nums">
          {review.length}/300
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={score === 0 || isPending}
          className="px-5 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'Đang gửi...' : initialScore > 0 ? 'Cập nhật' : 'Gửi đánh giá'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300 transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}

// ─── UserReviewSummary ──────────────────────────────────────

function UserReviewSummary({
  score,
  review,
  onEdit,
  onDelete,
  articleId,
}: {
  score: number;
  review: string | null;
  onEdit: () => void;
  onDelete: () => void;
  articleId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Xóa đánh giá này?')) return;
    startTransition(async () => {
      const result = await deleteRatingAction(articleId);
      if (result.success) {
        toast.success('Đã xóa đánh giá');
        onDelete();
      } else {
        toast.error(result.error ?? 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-5 h-5 ${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-white/10'}`}
            />
          ))}
          <span className="ml-2 text-sm font-bold text-zinc-600 dark:text-slate-300">{score}/5</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            disabled={isPending}
            className="p-1.5 text-zinc-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-all"
            title="Chỉnh sửa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
            title="Xóa đánh giá"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {review && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
          &ldquo;{review}&rdquo;
        </p>
      )}
      <p className="mt-2 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Đánh giá của bạn</p>
    </div>
  );
}

