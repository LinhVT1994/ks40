'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { updatePreferencesAction } from '@/features/onboarding/actions/onboarding';
import { Search, X, Plus, Compass, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import type { TopicItem } from '@/features/admin/actions/topic';

interface Props {
  initialTopics: string[];
  availableTopics: TopicItem[];
}

export default function ProfileTopics({ initialTopics, availableTopics }: Props) {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [isManagingTopics, setIsManagingTopics] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const triggerSave = (newTopics: string[]) => {
    startTransition(async () => {
      try {
        await updatePreferencesAction({ interestedTopics: newTopics });
        setLastSaved(new Date());
        router.refresh();
      } catch (error) {
        console.error('Failed to save topics:', error);
      }
    });
  };

  const toggleTopic = (id: string) => {
    const next = topics.includes(id) ? topics.filter(t => t !== id) : [...topics, id];
    setTopics(next);
    triggerSave(next);
  };

  const followedTopicsList = useMemo(() => {
    return availableTopics.filter(t => topics.includes(t.id));
  }, [availableTopics, topics]);

  const availableGroupsForDialog = useMemo(() => {
    const unselectedTopics = availableTopics.filter(t => !topics.includes(t.id));
    const parents = availableTopics.filter(t => !t.parentId);
    const children = unselectedTopics.filter(t => !!t.parentId);
    
    return parents.map(parent => ({
      ...parent,
      children: children.filter(c => c.parentId === parent.id)
    })).filter(p => p.children.length > 0);
  }, [availableTopics, topics]);

  const filteredGroupsForDialog = useMemo(() => {
    if (!searchQuery.trim()) return availableGroupsForDialog;
    const query = searchQuery.toLowerCase().trim();
    return availableGroupsForDialog.map(group => {
      const matchParent = group.label.toLowerCase().includes(query);
      const filteredChildren = group.children.filter(c => c.label.toLowerCase().includes(query));
      if (matchParent || filteredChildren.length > 0) {
        return { ...group, children: matchParent ? group.children : filteredChildren };
      }
      return null;
    }).filter((g): g is NonNullable<typeof g> => g !== null);
  }, [availableGroupsForDialog, searchQuery]);

  useEffect(() => {
    if (isManagingTopics && !activeCategoryId && availableGroupsForDialog.length > 0) {
      setActiveCategoryId(availableGroupsForDialog[0].id);
    }
  }, [isManagingTopics, activeCategoryId, availableGroupsForDialog]);

  const activeCategory = useMemo(() => {
    return availableGroupsForDialog.find(g => g.id === activeCategoryId);
  }, [availableGroupsForDialog, activeCategoryId]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-white/5">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" /> Chủ đề đang theo dõi
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Hệ thống sẽ ưu tiên các bài viết thuộc những lĩnh vực này trên Feed của bạn.</p>
        </div>

        <div className="flex items-center gap-4">
           {isPending && (
             <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary animate-pulse uppercase tracking-wider">
               <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
             </span>
           )}
           <button
            onClick={() => setIsManagingTopics(true)}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-[11px] font-black hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Khám phá thêm
          </button>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {followedTopicsList.length > 0 ? followedTopicsList.map(topic => (
          <div 
            key={topic.id}
            className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 hover:border-primary/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
               <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{topic.emoji}</span>
               <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-800 dark:text-slate-200 truncate">{topic.label}</div>
                  <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Đang quan tâm</div>
               </div>
            </div>
            <button
              onClick={() => toggleTopic(topic.id)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
              title="Bỏ quan tâm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-transparent">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
               <Compass className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white mb-1">Chưa có chủ đề nào</h3>
            <p className="text-xs text-zinc-500 max-w-[240px] mx-auto leading-relaxed">Hãy thêm các chủ đề bạn yêu thích để nhận được những gợi ý bài viết chất lượng hơn.</p>
          </div>
        )}
      </div>

      {/* Dialog reuse logic */}
      {isManagingTopics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsManagingTopics(false)} />
           <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[75vh] max-h-[700px] border border-zinc-200 dark:border-white/10">
              <div className="p-5 pb-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-800 dark:text-white leading-tight">Khám phá chủ đề</h2>
                    <p className="text-[10px] text-zinc-500 font-medium">Tìm và chọn các lĩnh vực bạn quan tâm.</p>
                  </div>
                </div>
                <button onClick={() => setIsManagingTopics(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors group">
                  <X className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50/30 dark:bg-white/5">
                <div className="relative group w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Bạn muốn thêm chủ đề gì?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-zinc-800 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-row">
                {searchQuery.trim() ? (
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {filteredGroupsForDialog.length > 0 ? (
                      <div className="space-y-6">
                        {filteredGroupsForDialog.map(group => (
                          <div key={group.id} className="space-y-2">
                            <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400">
                              <span>{group.emoji}</span> {group.label}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {group.children.map(topic => (
                                <button
                                  key={topic.id}
                                  type="button"
                                  onClick={() => toggleTopic(topic.id)}
                                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-[11px] font-bold text-zinc-500 hover:border-primary hover:text-primary transition-all active:scale-95"
                                >
                                  {topic.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <p className="text-xs text-zinc-500 font-medium">Không tìm thấy chủ đề nào khớp với "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <aside className="w-[160px] sm:w-[180px] border-r border-zinc-100 dark:border-white/5 overflow-y-auto p-2 space-y-1 bg-zinc-50/30 dark:bg-zinc-900/50 custom-scrollbar shrink-0">
                      {availableGroupsForDialog.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategoryId(category.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                            activeCategoryId === category.id 
                              ? 'bg-white dark:bg-white/10 text-primary shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 animate-in fade-in duration-200' 
                              : 'text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="text-base shrink-0">{category.emoji}</span>
                          <span className="text-[11px] font-bold truncate tracking-tight">{category.label}</span>
                        </button>
                      ))}
                    </aside>
                    <main className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar bg-white dark:bg-zinc-900">
                      {activeCategory ? (
                        <div key={activeCategory.id} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{activeCategory.emoji}</span>
                              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-white">{activeCategory.label}</h3>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400">{activeCategory.children.length} topics</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {activeCategory.children.map(topic => (
                              <button
                                key={topic.id}
                                type="button"
                                onClick={() => toggleTopic(topic.id)}
                                className="group flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-left active:scale-[0.98]"
                              >
                                <div className="min-w-0 pr-4">
                                  <div className="text-[11px] font-bold text-zinc-700 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{topic.label}</div>
                                  <div className="text-[9px] text-zinc-400 font-medium mt-0.5 truncate">{topic._count?.articles ?? 0} articles</div>
                                </div>
                                <div className="shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                                  <Plus className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </main>
                  </>
                )}
              </div>

              <div className="p-5 bg-zinc-50/80 dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    {followedTopicsList.slice(0, 4).map(t => (
                      <div key={t.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs shadow-sm" title={t.label}>
                        {t.emoji}
                      </div>
                    ))}
                    {followedTopicsList.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-primary text-white flex items-center justify-center text-[9px] font-black shadow-sm">
                        +{followedTopicsList.length - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Đang theo dõi {followedTopicsList.length}</p>
                </div>
                <button onClick={() => setIsManagingTopics(false)} className="px-6 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20">
                  Hoàn thành
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
