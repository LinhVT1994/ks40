'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { updatePreferencesAction } from '@/features/onboarding/actions/onboarding';
import { Search, X, Plus, Compass, ChevronRight, Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
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

  const groupedFollowedTopics = useMemo(() => {
    const parents = availableTopics.filter(t => !t.parentId);
    const results = parents.map(parent => ({
      ...parent,
      children: followedTopicsList.filter(c => c.parentId === parent.id)
    })).filter(p => p.children.length > 0);

    // Any topics without a valid parent in the list (if any)
    const orphans = followedTopicsList.filter(t => !t.parentId || !parents.find(p => p.id === t.parentId));
    if (orphans.length > 0) {
      results.push({
        id: 'other',
        label: 'Khác',
        emoji: '📌',
        children: orphans
      } as any);
    }
    return results;
  }, [followedTopicsList, availableTopics]);

  const availableGroupsForDialog = useMemo(() => {
    const parents = availableTopics.filter(t => !t.parentId);
    return parents.map(parent => ({
      ...parent,
      children: availableTopics.filter(c => c.parentId === parent.id).map(c => ({
        ...c,
        isFollowed: topics.includes(c.id)
      }))
    })).filter(g => g.children.length > 0);
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

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    availableTopics.filter(t => !t.parentId).forEach(p => {
      map[p.id] = p.label;
    });
    return map;
  }, [availableTopics]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isPending && (
        <div className="flex justify-end mb-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary animate-pulse uppercase tracking-wider">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
          </span>
        </div>
      )}

      {/* Topics Wrapped List */}
      <div className="flex flex-wrap gap-2">
        {followedTopicsList.length > 0 ? followedTopicsList.map(topic => (
          <div 
            key={topic.id}
            className="group flex items-center p-2.5 px-4 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/10 hover:border-primary/40 dark:shadow-md dark:shadow-primary/5 transition-all duration-300 relative overflow-hidden w-fit"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-zinc-900 dark:text-slate-200 leading-tight whitespace-nowrap">{topic.label}</div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => toggleTopic(topic.id)}
                className="p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                title="Bỏ theo dõi"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )) : null}
      </div>

      {/* Dialog reuse logic */}
      {isManagingTopics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setIsManagingTopics(false)} />
           <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[75vh] max-h-[700px] border border-zinc-200 dark:border-white/10">
              <div className="p-5 pb-3 border-b border-zinc-200/60 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">Khám phá chủ đề</h2>
                    <p className="text-[10px] text-zinc-500 font-medium">Chọn các lĩnh vực bạn quan tâm.</p>
                  </div>
                </div>
                <button onClick={() => setIsManagingTopics(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors group">
                  <X className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-zinc-200/60 dark:border-white/5 shrink-0 bg-zinc-50/40 dark:bg-white/5">
                <div className="relative group w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm chủ đề..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border-zinc-200 dark:border-transparent focus:border-primary/30 rounded-xl outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar bg-white dark:bg-slate-900 space-y-8">
                {filteredGroupsForDialog.length > 0 ? (
                  filteredGroupsForDialog.map(group => (
                    <div key={group.id} className="space-y-3">
                      <div className="sticky top-[-2px] bg-white dark:bg-slate-900 z-10 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 py-2.5 -mx-2 px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{group.label}</h3>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400">{group.children.length} topics</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
                        {group.children.map(topic => (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => toggleTopic(topic.id)}
                            className={`group flex items-center justify-between p-3 px-4 rounded-xl border transition-all text-left active:scale-[0.98] ${
                              topic.isFollowed
                                ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 dark:shadow-md dark:shadow-primary/5'
                                : 'border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-slate-800/20 hover:border-primary/30 hover:bg-white dark:hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <div className={`text-[11px] font-bold transition-colors leading-tight ${topic.isFollowed ? 'text-primary' : 'text-zinc-800 dark:text-slate-200'}`}>
                                {topic.label}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                    <p className="text-sm text-zinc-500 font-medium">Không tìm thấy chủ đề nào khớp với "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Xoá tìm kiếm</button>
                  </div>
                )}
              </div>

              <div className="p-5 bg-zinc-50/80 dark:bg-slate-900 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    {followedTopicsList.slice(0, 4).map(t => (
                      <div key={t.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-zinc-100 dark:bg-slate-800 flex items-center justify-center text-xs shadow-sm" title={t.label}>
                        {t.emoji}
                      </div>
                    ))}
                    {followedTopicsList.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-primary text-white flex items-center justify-center text-[9px] font-black shadow-sm">
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
