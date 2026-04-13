"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Tag, Hash, X } from 'lucide-react';
import type { TopicItem } from '@/features/admin/actions/topic';

interface TopicSelectorProps {
  topics: TopicItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: boolean;
}

export default function TopicSelector({ topics, selectedId, onSelect, error }: TopicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find current selected topic object
  const findTopic = (items: TopicItem[], id: string): TopicItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findTopic(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentTopic = findTopic(topics, selectedId);
  const parentOfCurrent = currentTopic?.parentId ? findTopic(topics, currentTopic.parentId) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
      inputRef.current?.focus();
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredTopics = topics.map(parent => ({
    ...parent,
    children: parent.children?.filter(child => 
      child.label.toLowerCase().includes(search.toLowerCase()) ||
      parent.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(parent => (parent.children?.length ?? 0) > 0 || parent.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full max-w-[500px]" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border rounded-xl transition-all text-left ${
          error ? 'border-rose-500/50' : 'border-zinc-300 dark:border-white/10 hover:border-primary/50'
        } ${isOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <div className="flex items-center truncate">
            {currentTopic ? (
              <div className="flex items-center gap-1.5 text-sm truncate">
                {parentOfCurrent && (
                  <>
                    <span className="text-zinc-500 font-medium truncate">
                      {parentOfCurrent.label}
                    </span>
                    <span className="text-zinc-300 dark:text-white/20">/</span>
                  </>
                )}
                <span className="font-bold text-zinc-800 dark:text-white truncate">
                  {currentTopic.emoji && <span className="mr-1">{currentTopic.emoji}</span>}
                  {currentTopic.label}
                </span>
              </div>
            ) : (
              <span className="text-sm text-zinc-500 font-medium italic">Chọn chủ đề...</span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Header */}
          <div className="p-3 border-b border-zinc-200 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề học tập..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-xl text-sm outline-none transition-all text-zinc-800 dark:text-white"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10">
            {filteredTopics.length > 0 ? (
              <div className="space-y-4 py-1">
                {filteredTopics.map((parent) => (
                  <div key={parent.id} className="space-y-1">
                    <div className="px-3 py-1.5 flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500/80">
                         {parent.emoji} {parent.label}
                       </span>
                       <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5 mt-0.5" />
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {parent.children?.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            onSelect(child.id);
                            setIsOpen(false);
                          }}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                            selectedId === child.id
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-1.5 h-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: parent.color || '#3b82f6' }} 
                            />
                            <span>{child.label}</span>
                          </div>
                          {selectedId === child.id && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Hash className="w-8 h-8 text-zinc-200 dark:text-white/10 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Không tìm thấy chủ đề nào</p>
              </div>
            )}
          </div>

          {/* Footer suggestion if empty search? Maybe not needed for zen */}
        </div>
      )}
    </div>
  );
}
