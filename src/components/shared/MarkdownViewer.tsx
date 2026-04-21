'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Check, Copy, X, ZoomIn } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';
import { slugify } from '@/lib/slugify';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const CodeBlock = React.memo(({ node, inline, className, children, ...props }: any) => {
  const content = Array.isArray(children) ? children.join('') : String(children);
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const lang = match ? match[1] : 'text';

  useEffect(() => setMounted(true), []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInline = inline ?? (!match && !content.includes('\n'));
  const isDark = mounted && resolvedTheme === 'dark';

  if (!isInline) {
    return (
      <div
        className={`relative my-10 rounded-xl overflow-hidden group not-prose border w-full transform-gpu isolation-isolate
          border-zinc-200 bg-zinc-50/50 dark:border-white/10 dark:bg-black/40
          ${PROSE_WIDTH}`}
      >
        {/* Copy Button */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all scale-95 hover:scale-100 active:scale-90 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        {/* Language Badge */}
        {match && (
          <div className="absolute bottom-3 right-4 z-10 opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{lang}</span>
          </div>
        )}

        <div className="max-h-[640px] overflow-auto text-[13px] md:text-[14px] leading-relaxed [&_*]:!whitespace-pre
          scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          {match ? (
            <SyntaxHighlighter
              style={isDark ? vscDarkPlus : oneLight}
              language={lang}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1.25rem 1.5rem',
                background: 'transparent',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: MONO_FONT,
                overflow: 'visible',
                whiteSpace: 'pre',
              }}
              codeTagProps={{ style: { fontFamily: MONO_FONT, background: 'transparent' } }}
            >
              {content.replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <pre style={{ fontFamily: MONO_FONT }} className="px-6 py-5 text-sm leading-relaxed whitespace-pre text-zinc-700 dark:text-zinc-300">
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <code className="bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono before:content-none after:content-none border border-zinc-200 dark:border-transparent break-words" {...props}>
      {content}
    </code>
  );
});

const PROSE_WIDTH = 'max-w-[720px] mx-auto';
const WIDE_WIDTH  = 'max-w-[960px] mx-auto';

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      />
      {alt && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium tracking-wider px-4 text-center">
          {alt}
        </p>
      )}
    </div>
  );
}

function TableLightbox({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
<div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900">{children}</div>
      </div>
    </div>
  );
}

export default function MarkdownViewer({ content, compact = false }: { content: string; compact?: boolean }) {
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);
  const [tableLightbox, setTableLightbox] = React.useState<React.ReactNode | null>(null);

  if (compact) {
    return (
      <div className="prose prose-zinc dark:prose-invert max-w-none
        prose-p:m-0 prose-p:leading-relaxed
        prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold
        prose-em:italic
        prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
        prose-code:text-[0.85em] prose-code:bg-zinc-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={['p','strong','em','a','code','br','ul','ol','li']} unwrapDisallowed>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <>
    <style jsx global>{`
      /* Zen Minimalist Syntax Highlighting */
      .syntax-highlighter {
        --token-text: #3f3f46;
        --token-muted: #a0a0a0;
        --token-comment: #a0a0a0;
        --token-accent1: #4f46e5; /* Actions: Keywords, Functions */
        --token-accent2: #18181b; /* Data: Strings, Numbers */
      }

      .dark .syntax-highlighter {
        --token-text: #e4e4e7;
        --token-muted: #71717a;
        --token-comment: #52525b;
        --token-accent1: #818cf8; /* Actions */
        --token-accent2: #ffffff; /* Data */
      }

      .syntax-highlighter .token.comment,
      .syntax-highlighter .token.prolog,
      .syntax-highlighter .token.doctype,
      .syntax-highlighter .token.cdata { color: var(--token-comment); font-style: italic; }
      
      .syntax-highlighter .token.punctuation,
      .syntax-highlighter .token.operator,
      .syntax-highlighter .token.namespace { color: var(--token-muted); }
      
      .syntax-highlighter .token.property,
      .syntax-highlighter .token.tag,
      .syntax-highlighter .token.boolean,
      .syntax-highlighter .token.number,
      .syntax-highlighter .token.constant,
      .syntax-highlighter .token.symbol,
      .syntax-highlighter .token.deleted { color: var(--token-accent2); font-weight: 600; }
      
      .syntax-highlighter .token.selector,
      .syntax-highlighter .token.attr-name,
      .syntax-highlighter .token.string,
      .syntax-highlighter .token.char,
      .syntax-highlighter .token.builtin,
      .syntax-highlighter .token.inserted { color: var(--token-accent2); }
      
      .syntax-highlighter .token.atrule,
      .syntax-highlighter .token.attr-value,
      .syntax-highlighter .token.keyword,
      .syntax-highlighter .token.function,
      .syntax-highlighter .token.class-name { color: var(--token-accent1); font-weight: 600; }
      
      .syntax-highlighter .token.regex,
      .syntax-highlighter .token.important,
      .syntax-highlighter .token.variable { color: var(--token-accent2); }
    `}</style>
    {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    {tableLightbox && <TableLightbox onClose={() => setTableLightbox(null)}>{tableLightbox}</TableLightbox>}
    <div className="w-full min-w-0 break-words">
      <div className={`prose prose-xl prose-slate dark:prose-invert max-w-none w-full min-w-0
        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
        prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
        prose-h1:text-page sm:prose-h1:text-4xl lg:prose-h1:text-4xl prose-h1:mt-10 prose-h1:mb-8
        prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6
        prose-h3:text-xl sm:prose-h3:text-2xl lg:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-5
        prose-h4:text-lg sm:prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-4
        prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
        prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 dark:prose-blockquote:bg-primary/10 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-xl lg:prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:text-zinc-800 dark:prose-blockquote:text-zinc-100 prose-blockquote:max-w-[720px] prose-blockquote:mx-auto prose-blockquote:my-16 prose-blockquote:relative prose-blockquote:before:content-['"'] prose-blockquote:before:absolute prose-blockquote:before:-top-4 prose-blockquote:before:-left-4 prose-blockquote:before:text-6xl prose-blockquote:before:text-primary/20 prose-blockquote:before:font-serif
        prose-ul:list-disc prose-ul:pl-8 prose-ul:space-y-4 prose-ul:max-w-[720px] prose-ul:mx-auto prose-ul:mb-8
        prose-ol:list-decimal prose-ol:pl-8 prose-ol:space-y-4 prose-ol:max-w-[720px] prose-ol:mx-auto
        prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-li:marker:text-primary prose-li:leading-relaxed prose-li:text-lg lg:prose-li:text-xl
        prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold
        prose-hr:hidden
      `}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: CodeBlock as any,
            pre: ({ children }: any) => <>{children}</>,
            p: ({ node, children, ...props }: any) => {
              const isImageOnly = node?.children?.length === 1 && node.children[0]?.tagName === 'img';
              if (isImageOnly) return <>{children}</>;
              return <div className={`mb-8 last:mb-0 text-zinc-700 dark:text-zinc-200 text-lg lg:text-xl leading-[1.85] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${PROSE_WIDTH}`} {...props} />;
            },
            table: ({ children }: any) => {
              const tableEl = <table className="w-full min-w-max text-base text-left border-collapse">{children}</table>;
              return (
                <div className={`relative my-12 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 shadow-md dark:shadow-none not-prose animate-in fade-in zoom-in-95 duration-700 group/table ${WIDE_WIDTH}`}>
                  <button
                    onClick={() => setTableLightbox(tableEl)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white opacity-0 group-hover/table:opacity-100 transition-all"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="overflow-x-auto">{tableEl}</div>
                </div>
              );
            },
            thead: ({ children }: any) => (
              <thead className="bg-zinc-50/30 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/10">{children}</thead>
            ),
            th: ({ children }: any) => (
              <th className="px-5 py-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">{children}</th>
            ),
            td: ({ children }: any) => (
              <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300 border-b border-zinc-100 dark:border-white/5 group-last:border-0">{children}</td>
            ),
            tr: ({ children }: any) => (
              <tr className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">{children}</tr>
            ),
            img: ({ src, alt, ...props }: any) => src ? (
              <div className={`my-12 group relative ${WIDE_WIDTH}`}>
                <div className="relative cursor-zoom-in" onClick={() => setLightbox({ src, alt: alt ?? '' })}>
                  <img
                    src={src} alt={alt ?? ''} loading="lazy"
                    className="w-full h-auto rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
                    {...props}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                {alt && (
                  <p className="mt-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                    {alt}
                  </p>
                )}
              </div>
            ) : null,
            h1: ({ children }: any) => { const id = slugify(String(children)); return <h1 id={id} className={`animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both ${PROSE_WIDTH}`}>{children}</h1>; },
            h2: ({ children }: any) => { const id = slugify(String(children)); return <h2 id={id} className={`animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both ${PROSE_WIDTH}`}>{children}</h2>; },
            h3: ({ children }: any) => { const id = slugify(String(children)); return <h3 id={id} className={`animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both ${PROSE_WIDTH}`}>{children}</h3>; },
            h4: ({ children }: any) => <h4 className={`animate-in fade-in duration-700 fill-mode-both ${PROSE_WIDTH}`}>{children}</h4>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
    </>
  );
}
