"use client";

import React from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3, Link2,
  Code, Image, Minus, List, ListOrdered, Quote,
  Eye, Columns, Edit3
} from 'lucide-react';

type ViewMode = 'editor' | 'split' | 'preview';

interface EditorToolbarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onInsert: (syntax: string, wrap?: boolean) => void;
}

const formatActions = [
  { icon: Heading1, label: 'H1', syntax: '# ', wrap: false },
  { icon: Heading2, label: 'H2', syntax: '## ', wrap: false },
  { icon: Heading3, label: 'H3', syntax: '### ', wrap: false },
  { divider: true },
  { icon: Bold, label: 'Bold', syntax: '**', wrap: true },
  { icon: Italic, label: 'Italic', syntax: '_', wrap: true },
  { icon: Quote, label: 'Quote', syntax: '> ', wrap: false },
  { divider: true },
  { icon: Code, label: 'Code', syntax: '`', wrap: true },
  { icon: Link2, label: 'Link', syntax: '[text](url)', wrap: false },
  { icon: Image, label: 'Image', syntax: '![alt](url)', wrap: false },
  { divider: true },
  { icon: List, label: 'List', syntax: '- ', wrap: false },
  { icon: ListOrdered, label: 'Ordered', syntax: '1. ', wrap: false },
  { icon: Minus, label: 'HR', syntax: '\n---\n', wrap: false },
];

export default function EditorToolbar({ viewMode, onViewChange, onInsert }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-300 dark:border-white/5 bg-transparent shrink-0">
      {/* Format buttons */}
      <div className="flex items-center gap-0.5 flex-1">
        {formatActions.map((action, i) => {
          if ('divider' in action && action.divider) {
            return <div key={i} className="w-px h-4 bg-zinc-200 dark:bg-white/10 mx-1" />;
          }
          const Icon = action.icon!;
          return (
            <button key={i} title={action.label}
              onClick={() => onInsert(action.syntax!, action.wrap)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-xl p-1 gap-0.5 shrink-0">
        {([
          { mode: 'editor', icon: Edit3, label: 'Editor' },
          { mode: 'split', icon: Columns, label: 'Split' },
          { mode: 'preview', icon: Eye, label: 'Preview' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <button key={mode} title={label} onClick={() => onViewChange(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === mode
                ? 'bg-white dark:bg-slate-700 text-zinc-800 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300'
            }`}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
