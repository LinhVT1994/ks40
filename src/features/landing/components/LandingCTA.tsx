import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function LandingCTA() {
  return (
    <section className="px-5 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl bg-brand p-7 sm:p-12 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-2 text-xs tracking-widest uppercase text-white/75"><BookOpen className="h-4 w-4" /> Một trang mới đang chờ bạn</p>
          <h2 className="mb-4 text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">Dành một chút thời gian.<br />Khám phá một điều mới.</h2>
          <p className="max-w-lg text-sm leading-7 text-white/80">Lưu lại bài viết yêu thích, ghi chú những ý tưởng hay và kết nối với những người cùng đam mê học hỏi.</p>
        </div>
        <Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-paper px-6 py-4 text-sm font-semibold text-brand transition-colors hover:bg-white">Bắt đầu cùng Lenote <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
