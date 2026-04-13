"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Lock, Users, Star, Calendar, Bell, Eye, Send, BookOpen, Hash, ArrowRight } from 'lucide-react';
import ArticleResourceUpload from './ArticleResourceUpload';
import type { ResourceDraft } from '@/features/admin/actions/article';
import { getSeriesListAction } from '@/features/admin/actions/series';
import { getArticlePickerListAction } from '@/features/admin/actions/article';

interface Audience {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

const audiences: Audience[] = [
  { id: 'public', label: 'Công khai', desc: 'Ai cũng có thể đọc, không cần đăng nhập', icon: Globe, color: 'text-emerald-500' },
  { id: 'members', label: 'Thành viên', desc: 'Chỉ người dùng đã đăng nhập', icon: Users, color: 'text-blue-500' },
  { id: 'premium', label: 'Premium', desc: 'Chỉ tài khoản Premium trở lên', icon: Star, color: 'text-amber-500' },
  { id: 'private', label: 'Riêng tư', desc: 'Chỉ mình bạn và Admin xem được', icon: Lock, color: 'text-zinc-500' },
];

interface Step3Props {
  title: string;
  articleId?: string; // needed to exclude self from picker
  onBack: () => void;
  onPublish: (audience: string, scheduleType: 'now' | 'later', scheduleDate: string, resources: ResourceDraft[], seriesId: string | null, seriesOrder: number | null, nextArticleId: string | null) => void;
  existingResources?: { id: string; name: string; size: number; mimeType: string }[];
  onDeleteExistingResource?: (id: string) => void;
  initialSeriesId?: string | null;
  initialSeriesOrder?: number | null;
  initialNextArticleId?: string | null;
}

export default function ArticleStep3({ title, articleId, onBack, onPublish, existingResources, onDeleteExistingResource, initialSeriesId, initialSeriesOrder, initialNextArticleId }: Step3Props) {
  const [selectedAudience, setSelectedAudience] = useState('members');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendNotif, setSendNotif] = useState(true);
  const [resources, setResources] = useState<ResourceDraft[]>([]);
  const [seriesList, setSeriesList] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(initialSeriesId ?? null);
  const [seriesOrder, setSeriesOrder] = useState<string>(initialSeriesOrder?.toString() ?? '');
  const [articlePickerList, setArticlePickerList] = useState<{ id: string; title: string; slug: string; thumbnail: string | null }[]>([]);
  const [nextArticleId, setNextArticleId] = useState<string | null>(initialNextArticleId ?? null);
  const [articleSearch, setArticleSearch] = useState('');

  useEffect(() => {
    getSeriesListAction().then(setSeriesList);
    getArticlePickerListAction(articleId).then(setArticlePickerList);
  }, [articleId]);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 md:p-12">
      <div className="max-w-5xl mx-auto flex flex-col min-h-full">
        
        {/* Header */}
        <div className="mb-10 border-b border-zinc-200 dark:border-white/5 pb-6">
          <h2 className="text-3xl font-bold text-zinc-800 dark:text-white font-display mb-2">Chia sẻ & Xuất bản</h2>
          <p className="text-zinc-500">Cấu hình người xem và thời gian phát hành bài viết của bạn.</p>
        </div>

        <div className="space-y-12 flex-1">
          
          {/* Audience Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <Users className="w-3.5 h-3.5" /> Ai được đọc bài này?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {audiences.map((a) => {
                const Icon = a.icon;
                const isSelected = selectedAudience === a.id;
                return (
                  <button key={a.id} onClick={() => setSelectedAudience(a.id)}
                    className={`flex flex-col items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:border-primary/30'
                    }`}>
                    <div className="flex w-full items-start justify-between">
                      <div className={`p-3 rounded-xl bg-white dark:bg-white/10 shrink-0 shadow-sm ${a.color}`}>
                        <Icon className="w-5 h-5 relative z-10" />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-primary bg-primary' : 'border-zinc-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold ${isSelected ? 'text-primary' : 'text-zinc-800 dark:text-white'}`}>{a.label}</p>
                      <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{a.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Schedule Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <Calendar className="w-3.5 h-3.5" /> Thời gian đăng bài
            </label>
            
            <div className="flex gap-4">
              {([
                { id: 'now', label: 'Đăng ngay bây giờ' },
                { id: 'later', label: 'Lên lịch đăng sau' },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => setScheduleType(opt.id)}
                  className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold border-2 transition-all text-center ${
                    scheduleType === opt.id
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10 shadow-sm'
                      : 'border-zinc-300 dark:border-white/10 text-zinc-500 bg-zinc-50 dark:bg-white/5 hover:border-primary/30'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {scheduleType === 'later' && (
              <div className="flex items-center gap-4 bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-5 py-4 transition-all mt-4">
                <Calendar className="w-5 h-5 text-zinc-500 shrink-0" />
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white text-zinc-700 font-medium"
                />
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Series Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <BookOpen className="w-3.5 h-3.5" /> Thuộc series (tuỳ chọn)
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={selectedSeriesId ?? ''}
                  onChange={(e) => setSelectedSeriesId(e.target.value || null)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-700 dark:text-white outline-none focus:border-primary transition-colors"
                >
                  <option value="">— Không thuộc series nào —</option>
                  {seriesList.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              {selectedSeriesId && (
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 sm:w-48">
                  <Hash className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="number"
                    min={1}
                    placeholder="Thứ tự"
                    value={seriesOrder}
                    onChange={(e) => setSeriesOrder(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none dark:text-white text-zinc-700 font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Next Article Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <ArrowRight className="w-3.5 h-3.5" /> Bài tiếp theo nên đọc (tuỳ chọn)
            </label>
            {nextArticleId ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Đã chọn</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate">
                    {articlePickerList.find(a => a.id === nextArticleId)?.title ?? nextArticleId}
                  </p>
                </div>
                <button
                  onClick={() => setNextArticleId(null)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-rose-500 border border-zinc-300 dark:border-white/10 hover:border-rose-300 transition-colors"
                >
                  Xoá
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tìm bài viết..."
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors dark:text-white"
                />
                {articleSearch && (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-300 dark:border-white/10 divide-y divide-zinc-200 dark:divide-white/5 bg-white dark:bg-slate-900 shadow-lg">
                    {articlePickerList
                      .filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(a => (
                        <button
                          key={a.id}
                          onClick={() => { setNextArticleId(a.id); setArticleSearch(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        >
                          {a.thumbnail && (
                            <img src={a.thumbnail} alt="" className="w-10 h-7 rounded-md object-cover shrink-0" />
                          )}
                          <span className="truncate text-zinc-700 dark:text-slate-200 font-medium">{a.title}</span>
                        </button>
                      ))}
                    {articlePickerList.filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-sm text-zinc-500">Không tìm thấy bài viết nào</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Resources Section */}
          <ArticleResourceUpload
            resources={resources}
            onChange={setResources}
            existingResources={existingResources}
            onDeleteExisting={onDeleteExistingResource}
          />

          <div className="h-px bg-zinc-100 dark:bg-white/5" />

          {/* Notification Section */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <Bell className="w-3.5 h-3.5" /> Cài đặt thông báo
            </label>
            <button onClick={() => setSendNotif(!sendNotif)}
              className={`w-full flex items-center justify-between gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                sendNotif ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
              }`}>
              <div className="flex items-center gap-5">
                <div className={`p-3.5 rounded-xl shadow-sm ${sendNotif ? 'bg-white dark:bg-white/10 text-primary' : 'bg-white dark:bg-white/10 text-zinc-500'}`}>
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className={`font-bold ${sendNotif ? 'text-primary' : 'text-zinc-700 dark:text-slate-300'}`}>
                    Gửi thông báo đẩy cho người theo dõi
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">Người dùng sẽ nhận được email ngay khi bài viết của bạn được công khai.</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${sendNotif ? 'bg-primary' : 'bg-zinc-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${sendNotif ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="pt-6 mt-12 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-bold text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-slate-800 transition-all shadow-sm">
              <Eye className="w-4 h-4" /> Xem trước
            </button>
            <button onClick={() => onPublish(selectedAudience, scheduleType, scheduleDate, resources, selectedSeriesId, seriesOrder ? parseInt(seriesOrder, 10) : null, nextArticleId)} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10 dark:shadow-primary/20">
              <Send className="w-4 h-4" /> {scheduleType === 'now' ? 'Xuất bản ngay' : 'Lên lịch'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
