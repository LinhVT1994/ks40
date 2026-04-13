'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Edit2, Trash2, Plus, Search, Filter, Calendar, LayoutGrid, Tag, Award, X, ChevronDown, Loader2, Eye, CheckCircle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { deleteArticleAction, quickUpdateArticleAction } from '@/features/admin/actions/article';
import { updateArticleQuickAction } from '@/features/member/actions/write';
import AdminPagination from './AdminPagination';
import type { getAdminArticlesAction } from '@/features/admin/actions/article';
import type { ArticleStatus, ArticleAudience, ArticleBadge, Article } from '@prisma/client';
import type { TopicItem } from '@/features/admin/actions/topic';
import { toast } from 'sonner';

type Articles = Awaited<ReturnType<typeof getAdminArticlesAction>>['articles'];

const AUDIENCE_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLIC:  { label: 'Public',   className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  MEMBERS: { label: 'Members',  className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  PREMIUM: { label: 'Premium',  className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  PRIVATE: { label: 'Private',  className: 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400' },
};

const ALL_BADGES: { value: ArticleBadge; label: string; color: string }[] = [
  { value: 'HOT',      label: 'Hot',      color: 'bg-rose-500' },
  { value: 'NEW',      label: 'New',      color: 'bg-blue-500' },
  { value: 'TRENDING', label: 'Trending', color: 'bg-purple-500' },
  { value: 'FEATURED', label: 'Featured', color: 'bg-amber-500' },
];

function Tooltip({ children, label, position = 'top' }: { children: React.ReactNode; label: string; position?: 'top' | 'bottom' }) {
  return (
    <div className="relative inline-flex group/tip">
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] font-bold text-white bg-zinc-800 rounded-lg whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-150 z-30 shadow-xl border border-white/10`}>
        {label}
        <div className={`absolute ${position === 'top' ? 'top-full' : 'bottom-full rotate-180'} left-1/2 -translate-x-1/2 -mt-px border-[4px] border-transparent border-t-zinc-800`} />
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default function DocumentsClient({
  articles,
  total,
  totalPages,
  currentPage,
  topics,
}: {
  articles: Articles;
  total: number;
  totalPages: number;
  currentPage: number;
  topics: TopicItem[];
}) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters]     = useState(false);
  const [deletingId,  setDeletingId]      = useState<string | null>(null);
  const [isPending,   startTransition]    = useTransition();

  // Context Menu State
  const [menu, setMenu] = useState<{ x: number; y: number; visible: boolean; doc: Articles[number] | null }>({
    x: 0, y: 0, visible: false, doc: null
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Approve modal state
  const [approveDoc, setApproveDoc] = useState<Articles[number] | null>(null);
  const [approveBadges, setApproveBadges] = useState<ArticleBadge[]>([]);
  const [approveAudience, setApproveAudience] = useState<ArticleAudience>('MEMBERS');
  const [rejectingDoc, setRejectingDoc] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const openApproveModal = (doc: Articles[number]) => {
    setApproveDoc(doc);
    setApproveBadges((doc as any).badges ?? []);
    setApproveAudience((doc as any).audience ?? 'MEMBERS');
  };

  const handleApprove = () => {
    if (!approveDoc) return;
    startTransition(async () => {
      const res = await updateArticleQuickAction(approveDoc.id, {
        status: 'PUBLISHED' as any,
        audience: approveAudience,
        badges: approveBadges,
      });
      if (res.success) {
        toast.success('Đã phê duyệt bài viết');
        setApproveDoc(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const toggleBadge = (badge: ArticleBadge) => {
    setApproveBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  const handleContextMenu = (e: React.MouseEvent, doc: Articles[number]) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, visible: true, doc });
  };

  const handleMoreClick = (e: React.MouseEvent, doc: Articles[number]) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ x: rect.left - 160, y: rect.bottom + 8, visible: true, doc });
  };

  // Close menu on click outside or scroll
  useEffect(() => {
    const handleClose = () => setMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleQuickUpdate = async (id: string, patch: any) => {
    startTransition(async () => {
      const res = await quickUpdateArticleAction(id, patch);
      if (res.success) {
        toast.success('Cập nhật bài viết thành công');
      } else {
        toast.error('Cập nhật thất bại: ' + res.error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá bài viết này không? Hành động này không thể hoàn tác.')) return;
    
    startTransition(async () => {
      const res = await deleteArticleAction(id);
      if (res.success) {
        toast.success('Đã xoá bài viết thành công');
      } else {
        toast.error('Xoá bài viết thất bại: ' + res.error);
      }
    });
  };

  const handlePageChange = (page: number) => updateParam('page', String(page));

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              defaultValue={searchParams.get('search') ?? ''}
              placeholder="Tìm kiếm bài viết..."
              onKeyDown={e => { if (e.key === 'Enter') updateParam('search', (e.target as HTMLInputElement).value); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all cursor-pointer rounded-xl border ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : 'text-zinc-500 bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 hover:border-zinc-300'}`}
          >
            <Filter className="w-4 h-4" /> Lọc nâng cao
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-3xl shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Chủ đề</label>
                <select
                  defaultValue={searchParams.get('topicId') ?? ''}
                  onChange={e => updateParam('topicId', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                >
                  <option value="">Tất cả chủ đề</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Trạng thái</label>
                <select
                  defaultValue={searchParams.get('status') ?? ''}
                  onChange={e => updateParam('status', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PUBLISHED">Đã đăng</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="SCHEDULED">Lên lịch</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { router.push(pathname); setShowFilters(false); }}
                  className="w-full py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white border border-zinc-300 dark:border-white/10 rounded-xl transition-all"
                >
                  Xóa lọc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm relative flex flex-col min-w-[900px] mt-4">
        {/* Header Grid with Custom Widths for Action */}
        <div className="grid grid-cols-[80px_4fr_40px_2fr_1fr_1fr_1fr_1fr_1fr] gap-x-3 px-6 py-3 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-50/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-2xl sticky top-[65px] md:top-[73px] z-20">
          <div className="">Ảnh</div>
          <div className="">Tiêu đề</div>
          <div className="text-center">&nbsp;</div>
          <div className="">Chủ đề</div>
          <div className="px-2">Tags</div>
          <div className="text-right">Lượt xem</div>
          <div className="text-center">Tác giả</div>
          <div className="text-center">Quyền</div>
          <div className="text-center">Trạng thái</div>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-white/5">
          {articles.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-sm">Không có bài viết nào được tìm thấy.</div>
          ) : (
            articles.map(doc => {
              return (
                <div
                  key={doc.id}
                  onContextMenu={(e) => handleContextMenu(e, doc)}
                  className="relative grid grid-cols-[80px_4fr_40px_2fr_1fr_1fr_1fr_1fr_1fr] gap-x-3 items-center px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group cursor-default"
                >
                  <div className="w-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-white/5 border border-zinc-300/60 dark:border-white/5 shrink-0">
                    {((doc as any).thumbnail || (doc as any).cover) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(doc as any).thumbnail || (doc as any).cover}
                        alt={doc.title}
                        className="w-full h-auto block"
                      />
                    ) : (
                      <div className="aspect-video w-full flex items-center justify-center text-zinc-300 dark:text-white/20 text-[10px] font-bold">
                        {doc.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="pr-4 min-w-0">
                    <Link href={`/article/${doc.slug}`} target="_blank" className="text-sm font-bold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors block leading-tight">
                      {doc.title}
                    </Link>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {doc.publishedAt ? formatDate(doc.publishedAt) : formatDate(doc.createdAt)}
                    </p>
                  </div>

                  <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip label="Thao tác nhanh">
                      <button 
                        onClick={(e) => handleMoreClick(e, doc)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-primary transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>

                  <div className="px-2">
                    <span
                      className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block"
                      style={{ backgroundColor: ((doc as any).topic?.color ?? '#64748b') + '18', color: (doc as any).topic?.color ?? '#64748b' }}
                    >
                      {(doc as any).topic?.label ?? '—'}
                    </span>
                  </div>
                  <div className="px-2 flex justify-center">
                    {doc.tags.length > 0 ? (
                      <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-500 truncate max-w-full text-center">
                        {doc.tags[0].tag.name}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="text-right text-sm font-bold text-zinc-700 dark:text-slate-300 pr-2">
                    {doc.viewCount.toLocaleString()}
                  </div>
                  <div className="text-center text-sm text-zinc-500 truncate px-1">
                    {doc.author?.name?.split(' ').pop() ?? '—'}
                  </div>
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${AUDIENCE_CONFIG[(doc as any).audience]?.className ?? AUDIENCE_CONFIG.PRIVATE.className}`}>
                      {AUDIENCE_CONFIG[(doc as any).audience]?.label ?? 'Private'}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      doc.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : (doc.status as any) === 'PENDING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      : (doc.status as any) === 'REJECTED' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                      : doc.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400'
                    }`}>
                      {doc.status === 'PUBLISHED' ? 'Đã đăng' : (doc.status as any) === 'PENDING' ? 'Chờ duyệt' : (doc.status as any) === 'REJECTED' ? 'Từ chối' : doc.status === 'SCHEDULED' ? 'Lên lịch' : 'Nháp'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        label="bài viết"
        onPageChange={handlePageChange}
      />

      {/* Approve Modal */}
      {approveDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApproveDoc(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-white/10 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-black text-zinc-800 dark:text-white">Duyệt bài viết</h3>
              <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{approveDoc.title}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Badges</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_BADGES.map(b => (
                    <button
                      key={b.value}
                      onClick={() => toggleBadge(b.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        approveBadges.includes(b.value) ? `${b.color} text-white` : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Quyền truy cập</label>
                <div className="flex gap-2">
                  {(['PUBLIC', 'MEMBERS', 'PREMIUM'] as ArticleAudience[]).map(a => (
                    <button
                      key={a}
                      onClick={() => setApproveAudience(a)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${approveAudience === a ? AUDIENCE_CONFIG[a].className + ' ring-2 ring-current ring-offset-1' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}
                    >
                      {AUDIENCE_CONFIG[a].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleApprove} 
                disabled={isPending}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Xác nhận Duyệt
              </button>
              <button onClick={() => setApproveDoc(null)} className="px-6 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectingDoc(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-white/10 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-black text-zinc-800 dark:text-white text-center">Từ chối bản thảo</h3>
              <p className="text-sm text-zinc-500 mt-2 text-center line-clamp-2">Cung cấp lý do từ chối để tác giả có thể chỉnh sửa và hoàn thiện bài viết tốt hơn.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Lý do từ chối (bắt buộc)</label>
              <textarea
                autoFocus
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Nội dung chưa phù hợp, thiếu hình ảnh minh họa..."
                className="w-full h-32 px-4 py-3 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectingDoc(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors">Hủy bỏ</button>
              <button
                disabled={!rejectionReason.trim() || isPending}
                onClick={async () => {
                  startTransition(async () => {
                    const res = await updateArticleQuickAction(rejectingDoc.id, { status: 'REJECTED' as any, rejectionReason });
                    if (res.success) { toast.success('Đã từ chối bài viết'); setRejectingDoc(null); setRejectionReason(''); } else { toast.error(res.error); }
                  });
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {menu.visible && menu.doc && (
        <div 
          ref={menuRef}
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[120] w-52 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-0.5">
            <Link href={`/article/${menu.doc.slug}`} target="_blank" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <ExternalLink className="w-4 h-4" /> Xem bài viết
            </Link>
            <Link href={`/admin/articles/${menu.doc.id}/edit`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <Edit2 className="w-4 h-4" /> Chỉnh sửa
            </Link>
            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
            
            {/* Quick Edit: Status */}
            <div className="relative group/sub">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4" /> Trạng thái
                </div>
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
              <div className="absolute left-full top-0 pl-1 opacity-0 scale-95 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:scale-100 group-hover/sub:pointer-events-auto transition-all z-[130] duration-200">
                {/* Invisible hover bridge to prevent menu from closing when moving mouse */}
                <div className="absolute left-0 top-0 bottom-0 w-4 -ml-2" />
                
                <div className="w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl p-1 relative">
                  {(['PUBLISHED', 'DRAFT', 'PENDING', 'REJECTED'] as ArticleStatus[]).map(s => (
                    <button
                      key={s}
                      id={`quick-status-${s}`}
                      onClick={() => { handleQuickUpdate(menu.doc!.id, { status: s }); setMenu({ ...menu, visible: false }); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors ${(menu.doc?.status as any) === s ? 'text-primary bg-primary/5' : 'text-zinc-500'}`}
                    >
                      {(s as string) === 'PUBLISHED' ? 'Đã đăng' : (s as string) === 'DRAFT' ? 'Nháp' : (s as string) === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Edit: Audience */}
            <div className="relative group/sub">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4" /> Quyền truy cập
                </div>
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
              <div className="absolute left-full top-0 pl-1 opacity-0 scale-95 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:scale-100 group-hover/sub:pointer-events-auto transition-all z-[130] duration-200">
                {/* Invisible hover bridge */}
                <div className="absolute left-0 top-0 bottom-0 w-4 -ml-2" />
                
                <div className="w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl p-1 relative">
                  {(['PUBLIC', 'MEMBERS', 'PREMIUM', 'PRIVATE'] as ArticleAudience[]).map(a => (
                    <button
                      key={a}
                      id={`quick-audience-${a}`}
                      onClick={() => { handleQuickUpdate(menu.doc!.id, { audience: a }); setMenu({ ...menu, visible: false }); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors ${(menu.doc as any)?.audience === a ? 'text-primary bg-primary/5' : 'text-zinc-500'}`}
                    >
                      {AUDIENCE_CONFIG[a]?.label ?? a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider and Pending Actions */}
            {(menu.doc.status as any) === 'PENDING' ? (
              <>
                <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                <button onClick={() => { openApproveModal(menu.doc!); setMenu({ ...menu, visible: false }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Duyệt & Đăng bài
                </button>
                <button onClick={() => { setRejectingDoc(menu.doc!); setMenu({ ...menu, visible: false }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối duyệt
                </button>
              </>
            ) : null}
            <div className="h-px border-t border-dashed border-zinc-300 dark:border-white/10 my-1 ml-3 mr-3" />
            <button onClick={() => { handleDelete(menu.doc!.id); setMenu({ ...menu, visible: false }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Xoá bài viết
            </button>
          </div>
        </div>
      )}
    </>
  );
}
