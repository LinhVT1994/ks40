'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Small, consistent building blocks for the consultation dialogs. */

export const fieldClass =
  'h-10 w-full rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/20 px-3 text-sm text-zinc-800 dark:text-white ' +
  'outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/15';

export function FieldLabel({ htmlFor, icon, children, hint }: { htmlFor?: string; icon?: React.ReactNode; children: React.ReactNode; hint?: string }) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag {...(htmlFor && { htmlFor })} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-slate-300">
      {icon && <span className="text-zinc-400 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      {children}
      {hint && <span className="font-normal text-zinc-400">{hint}</span>}
    </Tag>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select {...props} className={cn(fieldClass, 'appearance-none pr-8 tabular-nums font-medium cursor-pointer')}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    </div>
  );
}

/** A joined group of toggle buttons (single or multi select). */
export function Segmented<T extends string | number>({ options, isActive, onToggle, ariaLabel, className }: {
  options: { value: T; label: React.ReactNode }[];
  isActive: (v: T) => boolean;
  onToggle: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex rounded-lg border border-zinc-300 dark:border-white/10 p-0.5 bg-zinc-50 dark:bg-black/20', className)}>
      {options.map(o => (
        <button key={String(o.value)} type="button" aria-pressed={isActive(o.value)} onClick={() => onToggle(o.value)}
          className={cn('flex-1 h-8 rounded-md text-xs font-semibold tabular-nums transition-colors',
            isActive(o.value) ? 'bg-brand text-white shadow-sm' : 'text-zinc-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Multi-select chips with gaps. Selected chips use a light tint + accent border, so several
 * adjacent selections read as separate choices instead of one heavy bar.
 */
export function ChipGroup<T extends string | number>({ options, isActive, onToggle, ariaLabel, className }: {
  options: { value: T; label: React.ReactNode }[];
  isActive: (v: T) => boolean;
  onToggle: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('grid gap-1.5', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => {
        const on = isActive(o.value);
        return (
          <button key={String(o.value)} type="button" aria-pressed={on} onClick={() => onToggle(o.value)}
            className={cn('h-8 rounded-lg border text-xs font-semibold transition-colors',
              on ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-black/20 text-zinc-500 dark:text-slate-400 hover:border-primary/40 hover:text-zinc-700')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={cn('inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:pointer-events-none', className)} />;
}

export function GhostButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={cn('inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors', className)} />;
}

/** Centered modal (bottom sheet on mobile) with a compact header. */
export function Dialog({ titleId, title, icon, onClose, children, footer, size = 'md' }: {
  titleId: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] p-0 sm:p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cn('w-full max-h-[94vh] overflow-y-auto bg-surface dark:bg-[#2b2924] rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl', size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100 dark:border-white/5">
          <h2 id={titleId} className="flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-white">
            {icon && <span className="text-primary [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}{title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/60 dark:bg-white/[0.02] rounded-b-2xl">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}
