"use client";

import React, { useState, useRef, useCallback } from 'react';
import EditorToolbar from '@/components/shared/editor/EditorToolbar';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';

type ViewMode = 'editor' | 'split' | 'preview';

const PLACEHOLDER = `# Tiêu đề bài viết của bạn

## Giới thiệu

Bắt đầu viết nội dung của bạn ở đây. Editor này hỗ trợ **Markdown** đầy đủ.

## Tính năng hỗ trợ

- **In đậm** và *in nghiêng*
- [Liên kết](https://example.com)
- \`Code inline\` và block code
- Blockquote và Bảng (GFM)

## Code Block

\`\`\`typescript
const greeting = (name: string) => \`Xin chào, \${name}!\`;
\`\`\`

| Tên | Mô tả |
|-----|-------|
| Item A | Một tính năng |

---

> **Lưu ý**: Nhấn vào các nút toolbar để chèn nhanh cú pháp Markdown.
`;

export default function ArticleEditor() {
  const [content, setContent] = useState(PLACEHOLDER);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSyntax = useCallback((syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    let newContent: string;
    let cursorPos: number;

    if (wrap) {
      const inserted = `${syntax}${selected || 'text'}${syntax}`;
      newContent = content.substring(0, start) + inserted + content.substring(end);
      cursorPos = start + syntax.length + (selected || 'text').length + syntax.length;
    } else {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newContent = content.substring(0, lineStart) + syntax + content.substring(lineStart);
      cursorPos = lineStart + syntax.length + (end - lineStart);
    }

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, [content]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <EditorToolbar
        viewMode={viewMode}
        onViewChange={setViewMode}
        onInsert={insertSyntax}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-300 dark:border-white/5' : 'flex-1'}`}>
            <div className="flex items-center px-4 py-2 bg-zinc-50 dark:bg-slate-900/50 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Markdown</span>
              <span className="ml-auto text-xs text-zinc-500">{content.length} ký tự</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full resize-none p-6 font-mono text-sm leading-relaxed outline-none bg-white dark:bg-slate-950 text-zinc-800 dark:text-slate-200 placeholder:text-zinc-300"
              spellCheck={false}
              placeholder="Bắt đầu viết Markdown ở đây..."
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
            <div className="flex items-center px-4 py-2 bg-zinc-50 dark:bg-slate-900/50 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Preview</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
