'use client';

import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2,
  Info,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  Flame,
  ChevronDown,
  Image as ImageIcon,
  Copy,
  Check,
  ZoomIn,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GlossaryProvider, AutoGlossaryHighlight } from '@/features/member/components/GlossaryHighlighter';
import { slugify } from '@/lib/slugify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  dracula,
  okaidia,
  synthwave84,
  nord,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

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

const CodeBlock = React.memo(({ inline, className, children, ...props }: any) => {
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
      <div className="relative my-10 rounded-xl overflow-hidden group not-prose border border-zinc-200 dark:border-white/10 w-full transform-gpu isolate max-w-[720px] xl:max-w-[600px] 2xl:max-w-[720px] mx-auto">
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all scale-95 hover:scale-100 active:scale-90 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        {match && (
          <div className="absolute bottom-3 right-4 z-10 opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-slate-500">{lang}</span>
          </div>
        )}

        <div className="max-h-[640px] overflow-auto text-[13px] md:text-[14px] leading-relaxed [&_*]:!whitespace-pre scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
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
CodeBlock.displayName = 'CodeBlock';

function ScreenSizeDebugger() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getBreakpoint = (w: number) => {
    if (w >= 1536) return '2xl';
    if (w >= 1280) return 'xl';
    if (w >= 1024) return 'lg';
    if (w >= 768) return 'md';
    if (w >= 640) return 'sm';
    return 'xs';
  };

  return (
    <div className="fixed bottom-32 right-6 z-[9999] flex flex-col items-end gap-2">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl text-white font-mono text-xs flex flex-col gap-1"
          >
            <div className="flex justify-between gap-8 text-white/50">
              <span>Dimension:</span>
              <span className="text-primary font-bold">{size.width} x {size.height}</span>
            </div>
            <div className="flex justify-between gap-8 text-white/50">
              <span>Breakpoint:</span>
              <span className="text-emerald-400 font-bold uppercase">{getBreakpoint(size.width)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setShow(!show)}
        className="p-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl border border-white/10 dark:border-zinc-200 hover:scale-110 active:scale-95 transition-all"
        title="Check Screen Size"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
    </div>
  );
}

interface MarkdownViewerProps {
  content: string;
  className?: string;
  compact?: boolean;
  leftAlign?: boolean;
  variant?: 'article' | 'note';
}

const PROSE_WIDTH_BASE = 'max-w-[720px] xl:max-w-[600px] 2xl:max-w-[720px]';
const WIDE_WIDTH  = 'max-w-[960px] mx-auto';

function DropCap({ text, className }: { text: string; className?: string }) {
  const firstChar = text.trim().charAt(0);
  const restText = text.trim().slice(1);
  return (
    <div className={cn("relative my-12", className)}>
      <span className="float-left text-7xl font-medium mr-3 mt-2 text-primary leading-[0.8] drop-shadow-sm select-none font-display">
        {firstChar}
      </span>
      <p className="text-lg lg:text-xl leading-[1.85] text-zinc-700 dark:text-slate-400 font-medium italic">
        <AutoGlossaryHighlight>{restText}</AutoGlossaryHighlight>
      </p>
      <div className="clear-both" />
    </div>
  );
}

function ImageCarousel({ images, onImageClick }: { images: { src: string; alt: string }[]; onImageClick: (img: { src: string; alt: string }) => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % images.length);
  };
  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) return null;

  return (
    <div className={cn("group/carousel not-prose relative my-10 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl h-[400px] sm:h-[550px] lg:h-[650px] w-full mx-auto")}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          layoutId={images[index].src}
          initial={{ opacity: 0, x: -direction * 100 + "%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * 100 + "%" }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 26,
            opacity: { duration: 0.3 }
          }}
          className="absolute top-0 left-0 w-full h-full cursor-pointer z-10 m-0 p-0"
          onClick={() => onImageClick(images[index])}
        >
          <img
            src={images[index].src}
            alt={images[index].alt}
            className="block m-0 p-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-30 pointer-events-none">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/20 opacity-0 group-hover/carousel:opacity-100 transition-all active:scale-90 pointer-events-auto shadow-2xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/20 opacity-0 group-hover/carousel:opacity-100 transition-all active:scale-90 pointer-events-auto shadow-2xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-30 pointer-events-none flex flex-col gap-3 opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 translate-y-2 group-hover/carousel:translate-y-0">
        <div className="flex flex-col items-start gap-3">
           {(() => {
             const [title, ...descParts] = (images[index].alt || 'Untitled').split('|');
             const description = descParts.join('|').trim();
             return (
               <div className="w-fit max-w-[280px] sm:max-w-md bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-auto relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
                  <div className="pl-3">
                    <p className="text-base sm:text-lg font-medium text-white/90 leading-tight tracking-tight mb-1">{title.trim()}</p>
                    {description && (
                      <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed line-clamp-2 font-medium tracking-wide">
                        {description}
                      </p>
                    )}
                  </div>
               </div>
             );
           })()}

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-white/60 font-medium text-[10px] tracking-[0.2em] shadow-xl pointer-events-auto flex items-center gap-2.5">
            <span className="text-primary/80">{index + 1}</span>
            <div className="w-px h-2.5 bg-white/10" />
            <span className="text-white/30">{images.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageLightbox({ images, index, onClose }: { images: { src: string; alt: string }[]; index: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [direction, setDirection] = useState(0);
  const [mounted, setMounted] = useState(false);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    setMounted(true);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <button onClick={onClose} className="absolute top-8 right-8 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all z-[100001] active:scale-90 backdrop-blur-xl">
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-20" onClick={onClose}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div 
            key={currentIndex}
            custom={direction}
            layoutId={images[currentIndex].src}
            initial={{ opacity: 0, scale: 0.9, x: -direction * 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: direction * 100 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 26,
              opacity: { duration: 0.4 }
            }}
            className="relative max-w-7xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group/content flex items-center justify-center max-w-full max-h-full">
              <img src={images[currentIndex].src} alt={images[currentIndex].alt} className="max-w-full max-h-full object-contain rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5" />
              
              <div className="absolute bottom-4 left-4 w-full max-w-sm pointer-events-none opacity-0 group-hover/content:opacity-100 transition-opacity duration-300">
                 {(() => {
                   const [title, ...descParts] = (images[currentIndex].alt || 'Untitled').split('|');
                   const description = descParts.join('|').trim();
                   return (
                     <div className="w-fit max-w-[280px] sm:max-w-md bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl relative overflow-hidden pointer-events-auto">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
                        <div className="pl-3">
                          <p className="text-base sm:text-lg font-medium text-white/90 tracking-tight mb-1">{title.trim()}</p>
                          {description && (
                            <p className="text-[10px] sm:text-xs text-white/40 font-medium tracking-wide leading-relaxed line-clamp-2">{description}</p>
                          )}
                        </div>
                     </div>
                   );
                 })()}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 right-8 text-white/20 font-medium text-xs tracking-[0.4em] uppercase">
        {currentIndex + 1} / {images.length}
      </div>
    </div>,
    document.body
  );
}

export default function MarkdownViewer({ content, className, compact = false, leftAlign = false, variant = 'article' }: MarkdownViewerProps) {
  const [lightbox, setLightbox] = useState<{ images: { src: string; alt: string }[]; index: number } | null>(null);

  const PROSE_WIDTH = cn(PROSE_WIDTH_BASE, leftAlign ? 'ml-0' : 'mx-auto');

  const memoizedComponents = useMemo(() => ({
    h1: ({ children }: any) => <h1 className={cn("text-3xl sm:text-4xl font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-8 mt-16", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h1>,
    h2: ({ children }: any) => <h2 className={cn("text-2xl sm:text-3xl font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-6 mt-12", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h2>,
    h3: ({ children }: any) => <h3 className={cn("text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-4 mt-8", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h3>,
    h4: ({ children }: any) => <h4 className={cn("text-lg sm:text-xl font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-4 mt-6", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h4>,
    h5: ({ children }: any) => <h5 className={cn("text-base sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-4 mt-6", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h5>,
    h6: ({ children }: any) => <h6 className={cn("text-base font-medium tracking-tight text-zinc-900 dark:text-slate-200 mb-4 mt-6", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></h6>,
    ul: ({ children }: any) => <ul className={cn("my-6 space-y-4", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></ul>,
    ol: ({ children }: any) => <ol className={cn("my-6 space-y-4", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></ol>,
    li: ({ children }: any) => <li className="ml-4 text-base md:text-lg 2xl:text-xl leading-relaxed text-zinc-700 dark:text-slate-400"><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></li>,
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('glossary:')) {
        const slug = href.slice('glossary:'.length);
        return (
          <span className="group/gloss relative inline-block">
            <Link href={`/glossary/${slug}`} className="text-primary font-medium underline decoration-dotted decoration-1 underline-offset-4 decoration-primary/30 hover:decoration-solid cursor-help" {...props}>
              {children}
            </Link>
          </span>
        );
      }
      return <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>{children}</a>;
    },
    p: ({ children }: any) => {
      // Un-wrap images to allow them to break out of PROSE_WIDTH
      if (React.Children.count(children) === 1) {
        const child: any = React.Children.toArray(children)[0];
        if (child?.type === 'img' || (typeof child === 'object' && (child?.props?.src || child?.props?.node?.tagName === 'img'))) {
          return <>{children}</>;
        }
      }

      const textContent = React.Children.toArray(children).join('');
      if (textContent.startsWith('[!DROP-CAP]')) {
        const actualText = textContent.replace(/^\[!DROP-CAP\]\s*/i, '');
        return <DropCap text={actualText} className={PROSE_WIDTH} />;
      }
      return <p className={cn("text-base md:text-lg 2xl:text-xl leading-[1.75] mb-8 text-zinc-700 dark:text-slate-400 font-normal", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></p>;
    },
    blockquote: ({ children }: any) => {
      let textContent = '';
      const flatten = (nodes: any): string => {
        return React.Children.toArray(nodes).map(node => {
          if (typeof node === 'string') return node;
          if (React.isValidElement(node) && (node.props as any).children) return flatten((node.props as any).children);
          return '';
        }).join('');
      };
      
      textContent = flatten(children).trim();
      const match = textContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DETAILS|CAROUSEL)\]/i);

      if (match) {
        const type = match[1].toUpperCase();

        if (type === 'CAROUSEL') {
          const extractedImages: { src: string; alt: string }[] = [];
          const findImages = (nodes: any) => {
            React.Children.forEach(nodes, (child) => {
              if (!child) return;
              if (React.isValidElement(child)) {
                const props = child.props as any;
                if (child.type === 'img' || props?.src) {
                  const src = props.src;
                  const alt = props.alt || '';
                  if (src) extractedImages.push({ src, alt });
                } else if (props?.children) {
                  findImages(props.children);
                }
              }
            });
          };
          findImages(children);
          return <ImageCarousel images={extractedImages} onImageClick={(img) => {
            const idx = extractedImages.findIndex(i => i.src === img.src);
            setLightbox({ images: extractedImages, index: idx });
          }} />;
        }

        const config: any = {
          NOTE: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Thông tin' },
          TIP: { icon: Lightbulb, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Mẹo nhỏ' },
          IMPORTANT: { icon: Flame, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', label: 'Quan trọng' },
          WARNING: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Lưu ý' },
          CAUTION: { icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Cẩn trọng' },
          DETAILS: { icon: ChevronDown, color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-50/50 dark:bg-white/[0.02]', border: 'border-zinc-200 dark:border-white/10', label: 'Chi tiết' }
        }[type];

        if (type === 'DETAILS') {
          const lines = textContent.replace(/^\[!DETAILS\]\s*/i, '').split('\n').map(l => l.trim()).filter(l => l !== '');
          const summaryText = lines[0] || 'Xem chi tiết';
          return (
            <details className={cn("group my-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] transition-all duration-300 mx-auto [&_p:first-child]:mt-0 [&_p]:mb-3 [&_p:last-child]:mb-0", PROSE_WIDTH)}>
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 list-none">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tight text-base sm:text-lg"><AutoGlossaryHighlight>{summaryText}</AutoGlossaryHighlight></span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-8 pt-6 border-t border-zinc-200/50 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-300 text-base md:text-lg 2xl:text-xl leading-[1.75] [&_p:last-child]:mb-0">
                <AutoGlossaryHighlight>
                  {(() => {
                    let tagStripped = false;
                    const recursiveStrip = (nodes: any): any => {
                      return React.Children.map(nodes, (node) => {
                        if (tagStripped) return node;
                        if (typeof node === 'string') {
                          // 1. Remove the tag line
                          let cleaned = node.replace(/^\[!DETAILS\].*?(\n|$)/i, '');
                          
                          // 2. If we haven't stripped the summary line yet, try to remove it
                          if (!tagStripped) {
                            const summaryPattern = summaryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(`^\\s*(\\*{2})?${summaryPattern}(\\*{2})?\\s*(\\n|$)`, 'i');
                            const furtherCleaned = cleaned.replace(regex, '');
                            if (furtherCleaned !== cleaned) {
                              tagStripped = true;
                              return furtherCleaned.trim() === '' ? null : furtherCleaned;
                            }
                          }

                          if (cleaned !== node) {
                            // If we only removed the tag but not the summary, we keep going
                            return cleaned.trim() === '' ? null : cleaned;
                          }
                        }
                        if (React.isValidElement(node) && (node.props as any).children) {
                          return React.cloneElement(node, { children: recursiveStrip((node.props as any).children) } as any);
                        }
                        return node;
                      });
                    };
                    return recursiveStrip(children);
                  })()}
                </AutoGlossaryHighlight>
              </div>
            </details>
          );
        }

        const Icon = config.icon;
        return (
          <div className={cn("my-8 rounded-2xl border px-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500 [&_p:first-child]:mt-0 [&_p]:mb-3 [&_p:last-child]:mb-0", config.bg, config.border, PROSE_WIDTH)}>
            <div className={cn("flex items-center gap-2 mb-1 font-medium uppercase tracking-[0.2em] text-[10px]", config.color)}>
              <Icon className="w-3.5 h-3.5" />
              <span>{config.label}</span>
            </div>
            <div className="text-zinc-700 dark:text-slate-300 text-base lg:text-lg leading-relaxed font-medium">
              <AutoGlossaryHighlight>
                {(() => {
                  let tagStripped = false;
                  const recursiveStrip = (nodes: any): any => {
                    return React.Children.map(nodes, (node) => {
                      if (tagStripped) return node;
                      if (typeof node === 'string') {
                        const cleaned = node.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
                        if (cleaned !== node) tagStripped = true;
                        return cleaned;
                      }
                      if (React.isValidElement(node) && (node.props as any).children) {
                        return React.cloneElement(node, { children: recursiveStrip((node.props as any).children) } as any);
                      }
                      return node;
                    });
                  };
                  return recursiveStrip(children);
                })()}
              </AutoGlossaryHighlight>
            </div>
          </div>
        );
      }

      return <blockquote className={cn("not-prose border-l-4 border-primary pl-6 pr-10 py-4 my-10 italic text-zinc-600 dark:text-slate-400 bg-zinc-50 dark:bg-zinc-900/50 rounded-r-xl text-base md:text-lg 2xl:text-xl leading-[1.75] [&_p]:mb-0", PROSE_WIDTH)}><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></blockquote>;
    },
    img: ({ src, alt, ...props }: any) => {
      const isGif = src?.toLowerCase().split(/[#?]/)[0].endsWith('.gif');
      
      // Parse alt for width parameters: ![Description|width=600] or ![Description|600]
      const [altText, ...params] = (alt || '').split('|');
      const widthParam = params.find(p => p.trim().startsWith('width=') || /^\d+$/.test(p.trim()));
      const rawWidth = widthParam?.includes('=') ? widthParam.split('=')[1] : widthParam;
      const cleanWidth = rawWidth?.trim();
      
      const widthStyle = cleanWidth ? { 
        maxWidth: /^\d+$/.test(cleanWidth) ? `${cleanWidth}px` : cleanWidth,
        width: '100%'
      } : {};

      return src ? (
        <div 
          className={cn(!cleanWidth && WIDE_WIDTH, "m-0 group relative rounded-2xl transition-all duration-1000 h-fit mx-auto")}
          style={widthStyle}
        >
          {/* Layer 1: Shadow Layer */}
          <div className="absolute inset-0 rounded-2xl transition-all duration-1000 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-none" />
          
          {/* Layer 2: Image Clipper - Flex vacuum wrap with rounding fix */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl isolation-isolate transform-gpu [mask-image:-webkit-radial-gradient(white,black)]">
            <img 
              src={src} 
              alt={altText.trim()} 
              {...props} 
              className="w-full h-auto block !m-0 cursor-zoom-in transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03] will-change-transform origin-center" 
              onClick={() => setLightbox({ images: [{ src, alt: alt || '' }], index: 0 })} 
            />
            
            {isGif && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">GIF</span>
                </div>
              </div>
            )}
            
            {/* Overlay controls - Minimalist Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 cursor-zoom-in flex flex-col justify-end p-6" onClick={() => setLightbox({ images: [{ src, alt: alt || '' }], index: 0 })}>
              <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500 flex items-center justify-between">
                 <div className="flex items-center gap-2.5">
                   <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20"><Maximize2 className="w-4 h-4 text-white" /></div>
                   <span className="text-white font-medium tracking-wide text-[10px] uppercase">{isGif ? 'Xem GIF' : 'Xem ảnh'}</span>
                 </div>
                 {altText && <p className="text-white/80 text-[10px] italic font-medium max-w-[50%] truncate">{altText.trim()}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : null;
    },
    table: ({ children }: any) => (
      <div className="w-full not-prose my-8 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 shadow-sm mx-auto" style={{ maxWidth: '960px' }}>
        <table className="w-full min-w-max text-base text-left border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-50/30 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/10">{children}</thead>,
    th: ({ children }: any) => <th className="px-5 py-3 text-sm font-medium text-zinc-500 dark:text-slate-500 uppercase tracking-widest text-[10px]">{children}</th>,
    td: ({ children }: any) => <td className="px-5 py-3 text-zinc-600 dark:text-slate-400 border-b border-zinc-100 dark:border-white/5 group-last:border-0"><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></td>,
    strong: ({ children }: any) => <strong className="font-medium text-zinc-900 dark:text-slate-200"><AutoGlossaryHighlight>{children}</AutoGlossaryHighlight></strong>,
    hr: () => <hr className="my-12 border-zinc-200 dark:border-white/10 w-1/5 mx-auto" />,
    code: CodeBlock,
    pre: ({ children }: any) => <>{children}</>,
  }), []);

  return (
    <GlossaryProvider>
      <ScreenSizeDebugger />
      <div className={cn("markdown-viewer-root relative", className)}>
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <div className="markdown-content prose dark:prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={memoizedComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>

        <AnimatePresence>
          {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </div>
    </GlossaryProvider>
  );
}
