import React, { useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown, Loader2 } from 'lucide-react';

type FilterStatus = 'visible' | 'hidden' | 'spam' | 'all';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  activeStatus: FilterStatus;
  onStatusChange: (v: FilterStatus) => void;
  activeSort: 'newest' | 'oldest';
  onSortChange: (v: 'newest' | 'oldest') => void;
  counts: { all: number; visible: number; hidden: number; spam: number };
  showFilters: boolean;
  onToggleFilters: () => void;
  isPending?: boolean;
}

const STATUS_LABELS: { key: FilterStatus; label: string }[] = [
  { key: 'all',     label: 'Tất cả'   },
  { key: 'visible', label: 'Hiển thị' },
  { key: 'hidden',  label: 'Đã ẩn'   },
  { key: 'spam',    label: 'Spam'     },
];

export default function CommentFiltersBar({
  search, onSearchChange, activeStatus, onStatusChange, activeSort, onSortChange, counts,
  showFilters, onToggleFilters, isPending,
}: Props) {
  const [inputValue, setInputValue] = useState(search);

  // Sync internal state when search prop changes (e.g. from external clear)
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchChange(inputValue);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          )}
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm nội dung... (Enter để tìm)"
            className="w-full pl-9 pr-7 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500"
          />
          {(inputValue || search) && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggle button — mobile only */}
        <button
          onClick={onToggleFilters}
          className={`sm:hidden flex items-center gap-2 px-2 py-2.5 text-sm font-bold transition-all cursor-pointer ${
            showFilters ? 'text-primary' : 'text-zinc-500 hover:text-zinc-800 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" /> Lọc nâng cao
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Status + sort — desktop always visible */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-0.5 rounded-2xl">
            {STATUS_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onStatusChange(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeStatus === key
                    ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  activeStatus === key ? 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-300' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-slate-400'
                }`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-0.5 rounded-2xl">
            {(['newest', 'oldest'] as const).map(key => (
              <button
                key={key}
                onClick={() => onSortChange(key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSort === key
                    ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {key === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded filters — mobile only */}
      {showFilters && (
        <div className="sm:hidden p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-zinc-300/60 dark:border-white/10 rounded-3xl shadow-xl shadow-zinc-200/40 dark:shadow-black/20 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-slate-300 uppercase tracking-widest">Trạng thái</label>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-0.5 rounded-2xl">
                {STATUS_LABELS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onStatusChange(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeStatus === key
                        ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      activeStatus === key ? 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-300' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-slate-400'
                    }`}>
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-slate-300 uppercase tracking-widest">Sắp xếp</label>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-0.5 rounded-2xl">
                {(['newest', 'oldest'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => onSortChange(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeSort === key
                        ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {key === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
