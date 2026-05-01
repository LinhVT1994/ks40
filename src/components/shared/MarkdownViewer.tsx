'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Check, Copy, X, ZoomIn, Info, Lightbulb, AlertTriangle, Flame, ShieldAlert } from 'lucide-react';
import { GlossaryProvider, AutoGlossaryHighlight } from '@/features/member/components/GlossaryHighlighter';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  dracula,
  okaidia,
  synthwave84,
  nord,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { slugify } from '@/lib/slugify';
import { cn } from '@/lib/utils';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw];

const CODE_THEME_MAP: Record<string, { [key: string]: React.CSSProperties }> = {
  classic: vscDarkPlus,
  dracula,
  monokai: okaidia,
  synthwave: synthwave84,
  nord,
};

const DEFAULT_CODE_THEME = 'dracula';

function useCodeTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_CODE_THEME);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('ks-code-theme') : null;
    if (stored && CODE_THEME_MAP[stored]) setThemeId(stored);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && CODE_THEME_MAP[detail]) setThemeId(detail);
    };
    window.addEventListener('code-theme-changed', handler);
    return () => window.removeEventListener('code-theme-changed', handler);
  }, []);

  return CODE_THEME_MAP[themeId] ?? CODE_THEME_MAP[DEFAULT_CODE_THEME];
}

const CodeBlock = React.memo(({ node, inline, className, children, ...props }: any) => {
  const content = Array.isArray(children) ? children.join('') : String(children);
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const lang = match ? match[1] : 'text';
  const codeTheme = useCodeTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(content.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInline = inline ?? (!match && !content.includes('\n'));

  if (!isInline) {
    return (
      <div
        className={`relative my-10 rounded-xl overflow-hidden group not-prose border w-full transform-gpu isolation-isolate
          border-zinc-200 dark:border-white/10
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-slate-500">{lang}</span>
          </div>
        )}

        <div className="max-h-[640px] overflow-auto text-[13px] md:text-[14px] leading-relaxed [&_*]:!whitespace-pre
          scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          {match ? (
            <SyntaxHighlighter
              style={codeTheme}
              language={lang}
              PreTag="div"
              className="syntax-highlighter"
              customStyle={{
                margin: 0,
                padding: '1.25rem 1.5rem',
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
            <pre style={{ fontFamily: MONO_FONT }} className="px-6 py-5 text-sm leading-relaxed whitespace-pre text-zinc-700 bg-zinc-50/50 dark:bg-black/40 dark:text-slate-400">
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <code className="bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-slate-400 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono before:content-none after:content-none border border-zinc-200 dark:border-transparent break-words" {...props}>
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 z-[10001] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-110 active:scale-95 group"
        title="Đóng (Esc)"
      >
        <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
      </button>

      <div className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300 cursor-default" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5"
        />
        {alt && (
          <div className="mt-4 px-6 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.3em]">
              {alt}
            </p>
          </div>
        )}
      </div>
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
        className="relative max-w-[95vw] max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
<div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-slate-900">{children}</div>
      </div>
    </div>
  );
}

export default function MarkdownViewer({ 
  content, 
  compact = false,
  variant = 'article'
}: { 
  content: string; 
  compact?: boolean;
  variant?: 'article' | 'note';
}) {
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);
  const [tableLightbox, setTableLightbox] = React.useState<React.ReactNode | null>(null);

  const memoizedComponents = React.useMemo(() => ({
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('glossary:')) {
        const slug = href.slice('glossary:'.length);
        return (
          <span className="group/gloss relative inline-block">
            <Link
              href={`/glossary/${slug}`}
              className="text-primary font-medium underline decoration-dotted decoration-1 underline-offset-4 decoration-primary/30 hover:decoration-solid cursor-help"
              {...props}
            >
              {children}
            </Link>
          </span>
        );
      }
      return <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>{children}</a>;
    },
    li: ({ children }: any) => <li data-annotation-target><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></li>,
    blockquote: ({ children }: any) => {
      // 1. Extract text from children to check for [!TYPE]
      let textContent = '';
      const flatten = (nodes: any): string => {
        return React.Children.toArray(nodes).map(node => {
          if (typeof node === 'string') return node;
          if (React.isValidElement(node) && (node.props as any).children) return flatten((node.props as any).children);
          return '';
        }).join('');
      };
      
      textContent = flatten(children).trim();
      const match = textContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DETAILS)\]/i);

      if (match) {
        const type = match[1].toUpperCase() as 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' | 'DETAILS';
        
        if (type === 'DETAILS') {
          // Extract the summary title from the first line after [!DETAILS]
          const summaryTitle = textContent.replace(/^\[!DETAILS\]\s*/i, '').split('\n')[0] || 'Xem chi tiết';
          
          // Remove the prefix from the children for rendering
          const removeDetailsPrefix = (nodes: any): any => {
            let done = false;
            const process = (nodes: any): any => {
              return React.Children.map(nodes, (child) => {
                if (done) return child;

                if (typeof child === 'string') {
                  const regex = /^\[!DETAILS\].*?(\n|$)/i;
                  if (regex.test(child.trimStart())) {
                    done = true;
                    return child.replace(regex, '').trimStart();
                  }
                }
                
                if (React.isValidElement(child) && (child.props as any).children) {
                  return React.cloneElement(child, { 
                    children: process((child.props as any).children) 
                  } as any);
                }
                return child;
              });
            };
            return process(nodes);
          };

          return (
            <details className={cn(
              "my-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/30 dark:bg-white/[0.02] overflow-hidden group transition-all duration-300",
              PROSE_WIDTH
            )}>
              <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-white/[0.05] transition-colors list-none font-medium text-zinc-900 dark:text-slate-200 select-none">
                <div className="w-5 h-5 flex items-center justify-center rounded-md bg-primary/10 text-primary group-open:rotate-90 transition-transform duration-300">
                  <Check className="w-3 h-3" />
                </div>
                <span>{summaryTitle}</span>
              </summary>
              <div className="px-6 pb-6 pt-2 text-zinc-600 dark:text-slate-400 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                <AutoGlossaryHighlight>{removeDetailsPrefix(children)}</AutoGlossaryHighlight>
              </div>
            </details>
          );
        }

        const config = {
          NOTE: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Thông tin' },
          TIP: { icon: Lightbulb, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Mẹo nhỏ' },
          IMPORTANT: { icon: Flame, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', label: 'Quan trọng' },
          WARNING: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Lưu ý' },
          CAUTION: { icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Cẩn trọng' },
        }[type as Exclude<typeof type, 'DETAILS'>];

        const Icon = config.icon;

        // Recursively remove the [!TYPE] prefix from the first text node
        const removePrefix = (nodes: any): any => {
          return React.Children.map(nodes, (child, i) => {
            if (i === 0) {
              if (typeof child === 'string') return child.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
              if (React.isValidElement(child) && (child.props as any).children) {
                return React.cloneElement(child, {
                  children: removePrefix((child.props as any).children)
                } as any);
              }
            }
            return child;
          });
        };

        return (
          <div className={cn(
            "my-10 rounded-2xl border p-6 animate-in fade-in slide-in-from-bottom-2 duration-500",
            config.bg, config.border,
            PROSE_WIDTH
          )}>
            <div className={cn("flex items-center gap-3 mb-3 font-black uppercase tracking-widest text-[11px]", config.color)}>
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
            </div>
            <div className="text-zinc-700 dark:text-slate-300 leading-relaxed font-medium">
              <AutoGlossaryHighlight>{removePrefix(children)}</AutoGlossaryHighlight>
            </div>
          </div>
        );
      }

      // Default Blockquote (Minimalist Style)
      return (
        <blockquote className={cn(
          "not-prose border-l-2 border-primary/40 bg-zinc-50/50 dark:bg-white/[0.03] py-6 pl-5 pr-6 my-10 text-zinc-600 dark:text-slate-400 italic font-medium leading-relaxed text-lg md:text-xl rounded-r-xl",
          PROSE_WIDTH
        )}>
          <AutoGlossaryHighlight>{children}</AutoGlossaryHighlight>
        </blockquote>
      );
    },
    code: CodeBlock as any,
    pre: ({ children }: any) => <>{children}</>,
    p: ({ node, children, ...props }: any) => {
      const isImageOnly = node?.children?.length === 1 && node.children[0]?.tagName === 'img';
      if (isImageOnly) return <>{children}</>;

      // Check for local [!DROP-CAP] tag
      let textContent = '';
      const flatten = (nodes: any): string => {
        return React.Children.toArray(nodes).map(node => {
          if (typeof node === 'string') return node;
          if (React.isValidElement(node) && (node.props as any).children) return flatten((node.props as any).children);
          return '';
        }).join('');
      };
      textContent = flatten(children).trim();
      const hasDropCap = textContent.startsWith('[!DROP-CAP]');

      const removeDropCapPrefix = (nodes: any): any => {
        return React.Children.map(nodes, (child, i) => {
          if (i === 0) {
            if (typeof child === 'string') return child.replace(/^\[!DROP-CAP\]\s*/i, '');
            if (React.isValidElement(child) && (child.props as any).children) {
              return React.cloneElement(child, {
                children: removeDropCapPrefix((child.props as any).children)
              } as any);
            }
          }
          return child;
        });
      };

      const dropCapClasses = hasDropCap ? 
        "first-letter:float-left first-letter:text-[4.25rem] first-letter:font-bold first-letter:mr-3 first-letter:text-primary first-letter:leading-none first-letter:mt-[0.075em] first-letter:font-display" 
        : "";

      return (
        <div 
          data-paragraph 
          data-annotation-target 
          className={cn(
            `mb-6 last:mb-0 text-zinc-700 dark:text-slate-400 text-lg lg:text-xl leading-[1.85] ${PROSE_WIDTH}`,
            dropCapClasses
          )} 
          {...props}
        >
          <AutoGlossaryHighlight>{hasDropCap ? removeDropCapPrefix(children) : children}</AutoGlossaryHighlight>
        </div>
      );
    },
    table: ({ children }: any) => {
      const tableEl = <table className="w-full min-w-max text-base text-left border-collapse">{children}</table>;
      return (
        <div className={`relative my-12 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-none not-prose animate-in fade-in zoom-in-95 duration-700 group/table ${WIDE_WIDTH}`}>
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
      <th className="px-5 py-3 text-sm font-bold text-zinc-500 dark:text-slate-500">{children}</th>
    ),
    td: ({ children }: any) => (
      <td data-annotation-target className="px-5 py-3 text-zinc-600 dark:text-slate-400 border-b border-zinc-100 dark:border-white/5 group-last:border-0">
        <AutoGlossaryHighlight>{children}</AutoGlossaryHighlight>
      </td>
    ),
    tr: ({ children }: any) => (
      <tr className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">{children}</tr>
    ),
    img: ({ src, alt, ...props }: any) => {
      const isGif = src?.toLowerCase().split(/[#?]/)[0].endsWith('.gif');
      return src ? (
        <div className={`my-12 group relative ${WIDE_WIDTH}`}>
          <div className="relative cursor-pointer overflow-hidden rounded-2xl" onClick={() => setLightbox({ src, alt: alt ?? '' })}>
            <img
              src={src} alt={alt ?? ''} loading="lazy"
              className={cn(
                "w-full h-auto border border-zinc-200 dark:border-white/10 shadow-2xl transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]",
                isGif && "filter brightness-[0.9] group-hover:brightness-100"
              )}
              {...props}
            />
            
            {/* GIF Badge */}
            {isGif && (
              <div className="absolute top-4 right-4 z-10 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest">
                GIF
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                {isGif ? (
                  <div className="flex items-center gap-2 text-white font-bold text-sm px-2">
                    <ZoomIn className="w-5 h-5" />
                    <span>XEM GIF</span>
                  </div>
                ) : (
                  <ZoomIn className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </div>
          {alt && (
            <p className="mt-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
              {alt}
            </p>
          )}
        </div>
      ) : null;
    },
    h1: ({ children }: any) => { const id = slugify(String(children)); return <h1 id={id} data-annotation-target className={`${PROSE_WIDTH}`}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h1>; },
    h2: ({ children }: any) => { const id = slugify(String(children)); return <h2 id={id} data-annotation-target className={`${PROSE_WIDTH}`}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h2>; },
    h3: ({ children }: any) => { const id = slugify(String(children)); return <h3 id={id} data-annotation-target className={`${PROSE_WIDTH}`}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h3>; },
    h4: ({ children }: any) => <h4 data-annotation-target className={`${PROSE_WIDTH}`}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h4>,
  }), []);

  return (
    <GlossaryProvider>
      {compact ? (
        <div className={cn(
          variant === 'note' ? "prose prose-slate max-w-none dark:text-slate-400" : "prose prose-xl prose-slate max-w-none dark:text-slate-400",
          variant === 'note' ? "prose-compact" : "prose-p:m-0 prose-p:leading-relaxed",
          "prose-strong:text-zinc-900 dark:prose-strong:text-slate-200 prose-strong:font-bold",
          "prose-em:italic",
          "prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline",
          "prose-code:text-[0.85em] prose-code:bg-zinc-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/30 prose-blockquote:py-2 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-zinc-600 dark:prose-blockquote:text-slate-400 prose-blockquote:font-medium prose-blockquote:before:content-none prose-blockquote:after:content-none"
        )}>
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            allowedElements={['p','strong','em','a','code','br','ul','ol','li','blockquote']}
            unwrapDisallowed
            components={{
              p: ({ children }: any) => <p data-annotation-target><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></p>,
              li: ({ children }: any) => <li data-annotation-target><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></li>,
              blockquote: ({ children }: any) => <blockquote><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></blockquote>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
          {tableLightbox && <TableLightbox onClose={() => setTableLightbox(null)}>{tableLightbox}</TableLightbox>}
          <div className="w-full min-w-0 break-words">
           <div className={`prose prose-xl prose-slate max-w-none w-full min-w-0 dark:text-slate-400
              prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight
              prose-headings:text-zinc-900 dark:prose-headings:text-slate-200
              
              prose-h1:text-page sm:prose-h1:text-4xl lg:prose-h1:text-4xl prose-h1:mt-6 prose-h1:mb-6
              prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-6
              prose-h3:text-xl sm:prose-h3:text-2xl lg:prose-h3:text-2xl prose-h3:mt-4 prose-h3:mb-5
              prose-h4:text-lg sm:prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-4
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4 prose-a:decoration-1 prose-a:decoration-primary/40
              prose-ul:list-disc prose-ul:pl-8 prose-ul:space-y-4 prose-ul:max-w-[720px] prose-ul:mx-auto prose-ul:mt-2 prose-ul:mb-8
              prose-ol:list-decimal prose-ol:pl-8 prose-ol:space-y-4 prose-ol:max-w-[720px] prose-ol:mx-auto prose-ol:mt-2
              prose-li:text-zinc-700 dark:prose-li:text-slate-400 prose-li:marker:text-primary prose-li:leading-relaxed prose-li:text-lg lg:prose-li:text-xl
              prose-strong:text-zinc-900 dark:prose-strong:text-slate-200 prose-strong:font-medium
              prose-hr:my-12 prose-hr:border-zinc-200 dark:prose-hr:border-white/10 prose-hr:w-1/5 prose-hr:mx-auto
              prose-blockquote:before:content-none prose-blockquote:after:content-none
            `}>
              <ReactMarkdown
                remarkPlugins={REMARK_PLUGINS}
                rehypePlugins={REHYPE_PLUGINS}
                components={memoizedComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </>
      )}
    </GlossaryProvider>
  );
}
