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
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-white/5 border rounded-2xl transition-all text-left group ${
          error 
            ? 'border-rose-500/50 bg-rose-500/5' 
            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
        } ${isOpen ? 'ring-4 ring-primary/10 border-primary shadow-sm' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Tag className={`w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`} />
          <div className="flex items-center truncate">
            {currentTopic ? (
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-lg shrink-0">{currentTopic.emoji || '🔖'}</span>
                <div className="flex items-center gap-1.5 truncate">
                  {parentOfCurrent && (
                    <span className="text-zinc-400 dark:text-slate-500 font-medium truncate text-xs">
                      {parentOfCurrent.label}
                    </span>
                  )}
                  {parentOfCurrent && (
                    <span className="text-zinc-300 dark:text-white/10">/</span>
                  )}
                  <span className="font-bold text-zinc-800 dark:text-white truncate">
                    {currentTopic.label}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 dark:text-slate-500 font-medium italic">
                Chọn chủ đề...
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 z-[100] bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Search Header */}
          <div className="p-3.5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề học tập..."
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-sm outline-none transition-all text-zinc-800 dark:text-white placeholder:text-zinc-400"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10">
            {filteredTopics.length > 0 ? (
              <div className="space-y-6 py-2">
                {filteredTopics.map((parent) => (
                  <div key={parent.id} className="space-y-2 px-1">
                    {/* Parent Topic Header */}
                    <div className="flex items-center gap-2.5 px-3 py-1.5">
                      <span className="text-xl">{parent.emoji || '🔖'}</span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-white tracking-tight">
                        {parent.label}
                      </span>
                    </div>

                    {/* Children Topics List */}
                    <div className="space-y-0.5 ml-4 pl-4 border-l border-zinc-100 dark:border-white/5">
                      {parent.children?.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            onSelect(child.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group text-left ${
                            selectedId === child.id
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                                selectedId === child.id ? 'bg-primary' : 'bg-blue-500'
                              }`}
                            />
                            <span className="truncate">{child.label}</span>
                          </div>
                          {selectedId === child.id && (
                            <Check className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      ))}
                      
                      {/* If parent has no children, allow selecting parent directly but style it as a selectable row */}
                      {(!parent.children || parent.children.length === 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(parent.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group text-left ${
                            selectedId === parent.id
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedId === parent.id ? 'bg-primary' : 'bg-zinc-400'}`} />
                            <span>{parent.label} (Chính)</span>
                          </div>
                          {selectedId === parent.id && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      )}
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
