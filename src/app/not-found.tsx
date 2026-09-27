import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BookBuddy from '@/components/shared/BookBuddy';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-6 py-20 text-ink">
      <div className="max-w-md text-center">
        <BookBuddy mood="lost" className="mx-auto mb-6 w-40" />
        <p className="mb-4 text-xs font-medium tracking-[0.2em] text-muted">TRANG 404</p>
        <h1 className="font-display text-4xl font-normal leading-tight">Trang này chưa có trong thư viện.</h1>
        <p className="mt-5 text-sm leading-7 text-muted">Đường dẫn có thể đã thay đổi hoặc nội dung không còn ở đây. Hãy trở về để tiếp tục khám phá.</p>
        <Link href="/" className="ui-button ui-button-secondary mt-8"><ArrowLeft size={16} /> Về trang chủ</Link>
      </div>
    </div>
  );
}
