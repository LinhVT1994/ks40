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

const CodeBlock = React.memo(({ node, inline, className, children, ...props }: any) => {
  // Ensure we get a clean string from children (avoiding commas from array joined by String())
  const content = Array.isArray(children) ? children.join('') : String(children);
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const lang = match ? match[1] : 'text';
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = mounted && theme === 'light';

  // In react-markdown 10, 'inline' is often undefined.
  // We determine if it's block-level if it has a language match or contains newlines.
  const isInline = inline ?? (!match && !content.includes('\n'));

  // Fenced code block (both with and without language specifier)
  if (!isInline) {
    return (
      <div
        className={`relative my-6 rounded-xl overflow-hidden group not-prose border w-full ${PROSE_WIDTH} ${
          isLight 
            ? 'border-zinc-200 bg-white shadow-sm' 
            : 'border-white/5 bg-zinc-950 shadow-none'
        }`}
      >
        {/* Absolute Copy Button (Top Right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all scale-95 hover:scale-100 active:scale-90 bg-zinc-900 text-white hover:bg-black dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {copied ? (
              <Check className="w-2.5 h-2.5 text-emerald-400" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Absolute Language Badge (Bottom Right) */}
        {match && (
          <div className="absolute bottom-2 right-3 z-10 opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {lang}
            </span>
          </div>
        )}

        <div className={`max-h-[480px] overflow-auto text-[13px] font-mono leading-[1.6]
          scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent
          [&_*]:!whitespace-pre [&_code]:!font-mono
        `}>
          {match ? (
            <SyntaxHighlighter
              style={isLight ? oneLight : vscDarkPlus}
              language={lang}
              PreTag="div"
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                padding: '0.875rem 1rem',
                background: 'transparent',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                whiteSpace: 'pre',
                overflow: 'visible',
              }}
              codeTagProps={{
                style: {
                  background: 'transparent',
                  padding: 0,
                }
              }}
            >
              {content.replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <pre
              className="px-4 py-3.5 text-xs leading-relaxed whitespace-pre text-zinc-700 dark:text-slate-300"
            >
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <code className="bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono before:content-none after:content-none border border-zinc-200 dark:border-transparent break-words" {...props}>
      {content}
    </code>
  );
});

const PROSE_WIDTH = 'max-w-[720px] mx-auto';

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

export default function MarkdownViewer({ content }: { content: string }) {
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);
  return (
    <>
    {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    <div className="w-full min-w-0 break-words">
      <div className={`prose prose-lg prose-slate dark:prose-invert max-w-none w-full min-w-0
        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
        prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
        prose-h1:text-2xl lg:prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-4
        prose-h2:text-xl lg:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3
        prose-h3:text-lg lg:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
        prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2
        prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
        prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:bg-zinc-50/50 dark:prose-blockquote:bg-white/[0.02] prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-lg prose-blockquote:font-medium prose-blockquote:text-zinc-700 dark:prose-blockquote:text-zinc-200 prose-blockquote:max-w-[720px] prose-blockquote:mx-auto prose-blockquote:my-8 prose-blockquote:relative prose-blockquote:before:content-none
        prose-ul:list-disc prose-ul:pl-6 prose-ul:max-w-[720px] prose-ul:mx-auto
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:max-w-[720px] prose-ol:mx-auto
        prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-li:marker:text-primary prose-li:leading-relaxed
        prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold
        prose-hr:border-zinc-200 dark:prose-hr:border-white/10 prose-hr:my-12
      `}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: CodeBlock as any,
            pre: ({ children }: any) => <>{children}</>,
            p: (props: any) => (
              <div className={`mb-8 last:mb-0 text-zinc-700 dark:text-zinc-300 leading-[1.8] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${PROSE_WIDTH}`} {...props} />
            ),
            table: ({ children }: any) => (
              <div className={`overflow-x-auto my-8 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 shadow-md dark:shadow-none not-prose animate-in fade-in zoom-in-95 duration-700 ${PROSE_WIDTH}`}>
                <table className="w-full text-sm text-left border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }: any) => (
              <thead className="bg-zinc-50/30 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/10">{children}</thead>
            ),
            th: ({ children }: any) => (
              <th className="px-4 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">{children}</th>
            ),
            td: ({ children }: any) => (
              <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300 border-b border-zinc-100 dark:border-white/5 group-last:border-0">{children}</td>
            ),
            tr: ({ children }: any) => (
              <tr className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">{children}</tr>
            ),
            img: ({ src, alt, ...props }: any) => src ? (
              <div className={`my-16 group relative ${PROSE_WIDTH}`}>
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
