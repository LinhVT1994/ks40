import Link from 'next/link';
import { ArrowRight, BookOpen, Bookmark, Highlighter, NotebookPen } from 'lucide-react';
import BookBuddy from '@/components/shared/BookBuddy';

export default function LandingHero() {
  return (
    <>
      <section className="ui-hero">
        <div>
          <p className="ui-eyebrow mb-7">Một không gian cho tri thức</p>
          <h1 className="ui-hero-title text-ink mb-6">
            Đọc sâu hơn.<br />
            Hiểu nhiều hơn.<br />
            <em>Lớn lên mỗi ngày.</em>
          </h1>
          <p className="ui-hero-copy mb-8">
            Những bài viết đáng đọc, những ý tưởng đáng giữ.
            Lenote kết nối kiến thức và trải nghiệm, để mỗi lần ghé lại
            là một lần bạn khám phá thêm điều mới.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore" className="ui-button">Khám phá bài viết <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/register" className="ui-button ui-button-secondary">Tạo không gian của bạn</Link>
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <BookBuddy mood="grow" className="w-16" />
            <p className="leading-6"><span className="block font-medium text-ink">Một người bạn nhỏ, cùng bạn học mỗi ngày.</span>Chậm lại một chút. Học thêm một điều.</p>
          </div>
        </div>

        <div className="ui-hero-art" aria-label="Minh họa không gian đọc và ghi chú của Lenote">
          <div className="ui-notebook">
            <div className="mb-7 flex items-center justify-between border-b border-line pb-4">
              <span className="ui-wordmark">lenote<span>.dev</span></span>
              <span className="text-[10px] uppercase tracking-widest text-muted">Không gian đọc</span>
              <Bookmark className="h-4 w-4 text-primary" />
            </div>
            <p className="ui-eyebrow mb-4">Học tập & phát triển</p>
            <h2 className="ui-notebook-title text-ink mb-5">Tri thức bắt đầu từ<br />một câu hỏi hay.</h2>
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>Đọc không chỉ là tiếp nhận thông tin. Đó còn là cách ta kết nối những điều đã biết với những góc nhìn mới.</p>
              <p>Hãy giữ lại <span className="ui-notebook-mark">một ý tưởng khiến bạn dừng lại</span>, viết xuống suy nghĩ của mình và trở lại khi cần.</p>
            </div>
            <div className="ui-notebook-note">
              <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-accent-purple" />
              <div><span className="mb-1 block font-semibold text-ink">Ghi chú của bạn</span>Điều gì mình có thể áp dụng từ ý tưởng này?</div>
            </div>
            <div className="mt-6 flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Đọc · Suy ngẫm · Ghi nhớ</span>
              <span className="h-1 w-16 overflow-hidden rounded-full bg-panel-soft"><span className="block h-full w-2/3 bg-brand" /></span>
            </div>
          </div>
          <div className="ui-hero-caption"><span>Xem trước trải nghiệm</span><span>Ít xao nhãng, nhiều ý tưởng</span></div>
        </div>
      </section>
      <div className="ui-feature-strip">
        {[
          { icon: BookOpen, title: 'Đọc theo cách của bạn', detail: 'Bài viết, sách và những góc nhìn mới' },
          { icon: Highlighter, title: 'Giữ lại điều có giá trị', detail: 'Đánh dấu, ghi chú và đọc lại' },
          { icon: NotebookPen, title: 'Chia sẻ để cùng phát triển', detail: 'Kết nối qua trải nghiệm và tri thức' },
        ].map(({ icon: Icon, title, detail }) => (
          <div key={title}><Icon className="h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-ink">{title}</h2><p>{detail}</p></div></div>
        ))}
      </div>
    </>
  );
}
