'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  fallbackUrl?: string;
}

export default function BackButton({ className = '', fallbackUrl = '/' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If we have history, go back. Otherwise go to fallback.
    // Note: window.history.length > 1 isn't always reliable in SPA,
    // but in Next.js it works well enough for a simple "Back".
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`group flex items-center gap-2 text-zinc-500 hover:text-primary transition-all duration-300 font-medium text-sm ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span>Quay lại</span>
    </button>
  );
}
