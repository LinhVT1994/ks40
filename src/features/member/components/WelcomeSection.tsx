'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Search, X, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BookBuddy from '@/components/shared/BookBuddy';

export default function WelcomeSection({ name }: { name?: string }) {
  const router = useRouter();
  const [today, setToday] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setToday(new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date()));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <section className="ui-welcome">
      <div>
        <BookBuddy className="mx-auto mb-3 w-24" />
        <p className="mb-4 flex items-center gap-2 text-xs text-muted"><Calendar className="h-3.5 w-3.5 text-primary" />{today}</p>
        <h1 className="text-ink">Xin chào{name ? `, ${name}` : ''}<span className="text-primary">.</span></h1>
        <p className="mt-3 text-sm text-muted">Một ngày mới, một góc nhìn mới. Hôm nay bạn muốn khám phá điều gì?</p>
      </div>
      <form onSubmit={handleSearch} role="search">
        <label htmlFor="welcome-search" className="sr-only">Tìm kiếm kiến thức</label>
        <div className="ui-welcome-search">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input ref={inputRef} id="welcome-search" type="search" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm một điều bạn muốn biết..."
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          {searchQuery && <button type="button" aria-label="Xóa từ khóa" onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }} className="p-1 text-muted hover:text-primary"><X className="h-4 w-4" /></button>}
          <button type="submit" aria-label="Tìm kiếm" className="rounded-md bg-panel-soft p-1.5 text-primary"><ArrowUpRight className="h-4 w-4" /></button>
        </div>
      </form>
    </section>
  );
}
