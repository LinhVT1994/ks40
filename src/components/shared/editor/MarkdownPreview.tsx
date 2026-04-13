"use client";

import React from 'react';
import MarkdownViewer from '@/components/shared/MarkdownViewer';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="h-full overflow-y-auto bg-transparent">
      <div className="max-w-3xl mx-auto px-8 py-10">
        {content.trim() ? (
          <MarkdownViewer content={content} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
              <span className="text-3xl">✍️</span>
            </div>
            <p className="text-zinc-500 font-medium text-sm">Bắt đầu gõ Markdown ở bên trái để xem preview ở đây</p>
          </div>
        )}
      </div>
    </div>
  );
}
