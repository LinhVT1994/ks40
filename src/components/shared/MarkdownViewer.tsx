"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { slugify } from '@/lib/slugify';

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const lang = match ? match[1] : 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative my-10 rounded-[1.5rem] overflow-hidden shadow-2xl group not-prose border border-white/5" style={{ backgroundColor: '#1e1e1e' }}>
        {/* Subtle language badge */}
        <div className="absolute top-4 left-6 text-[9px] font-black text-white/10 uppercase tracking-[0.2em] group-hover:text-white/20 transition-colors">
          {lang}
        </div>

        <button 
          onClick={handleCopy} 
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all active:scale-95"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <div className="overflow-x-auto text-[14px] font-mono leading-relaxed">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={lang}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '2.5rem 1.75rem 1.75rem',
              background: 'transparent',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono before:content-none after:content-none" {...props}>
      {children}
    </code>
  );
};

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none
      prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
      prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-2xl lg:prose-h2:text-3xl prose-h3:text-xl lg:prose-h3:text-2xl
      prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.9]
      prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-200 prose-blockquote:not-italic prose-blockquote:shadow-sm
      prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-slate-100 dark:prose-img:border-white/10 prose-img:w-full prose-img:object-cover
      prose-hr:border-slate-200 dark:prose-hr:border-white/10 prose-hr:my-12
      prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:marker:text-primary prose-li:leading-relaxed
      prose-ol:list-decimal prose-ol:pl-6
      prose-table:w-full prose-table:text-sm prose-table:border-collapse prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-sm
      prose-th:bg-slate-50 dark:prose-th:bg-white/5 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-slate-900 dark:prose-th:text-white prose-th:border prose-th:border-slate-200 dark:prose-th:border-white/10
      prose-td:p-4 prose-td:border prose-td:border-slate-200 dark:prose-td:border-white/10
      prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code: CodeBlock as any,
          pre: ({ children }: any) => <>{children}</>,
          img: ({ src, alt, ...props }: any) => src ? <img src={src} alt={alt ?? ''} {...props} /> : null,
          h2: ({ children }: any) => { const id = slugify(String(children)); return <h2 id={id}>{children}</h2>; },
          h3: ({ children }: any) => { const id = slugify(String(children)); return <h3 id={id}>{children}</h3>; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
