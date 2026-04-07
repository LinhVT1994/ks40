import React from 'react';
import MemberContainer from '@/components/layout/MemberContainer';
import Link from 'next/link';

export const metadata = {
  title: 'Điều khoản Dịch vụ | Lenote.dev',
  description: 'Các quy định và hướng dẫn khi tham gia cộng đồng tri thức tại Lenote.dev.',
};

export default function TermsPage() {
  return (
    <MemberContainer className="max-w-3xl py-20 px-6">
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Điều khoản Dịch vụ</h1>
          <p className="text-slate-500 dark:text-slate-400">Cập nhật lần cuối: 04 tháng 04, 2026</p>
        </div>

        {/* TL;DR Section */}
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <span className="material-icons text-sm">bolt</span>
            Tóm tắt nhanh (TL;DR)
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Đây là dự án cá nhân, không phải công ty. Mọi thứ được xây dựng bằng sự tâm huyết.</li>
            <li>• Kiến thức là để chia sẻ, nhưng vui lòng không copy-paste bài viết của tôi đi nơi khác.</li>
            <li>• Đăng ký Premium là một hình thức ủng hộ để tôi duy trì và phát triển nền tảng.</li>
            <li>• Hãy cùng nhau xây dựng môi trường học chuyên nghiệp, không spam, không phá hoại.</li>
          </ul>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Chấp thuận điều khoản</h2>
            <p>
              Bằng việc truy cập hoặc đăng ký tài khoản tại <strong>Lenote.dev</strong>, bạn mặc nhiên đồng ý với các điều khoản này. 
              Nếu bạn không đồng ý, thật tiếc là bạn nên dừng việc sử dụng dịch vụ tại đây.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. Bản quyền & Nội dung</h2>
            <p>
              Mọi bài viết, giáo trình, sơ đồ kiến trúc và mã nguồn mẫu trên nền tảng này đều do tôi (người sáng lập Lenote.dev) biên soạn. 
              Bạn được quyền sử dụng kiến thức này cho công việc và học tập cá nhân, nhưng:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nghiêm cấm sao chép nguyên văn hoặc sử dụng AI để tóm tắt lậu và đăng tải lên các nền tảng khác.</li>
              <li>Nếu trích dẫn một phần, vui lòng để lại nguồn link gốc đến website.</li>
              <li>Nội dung Premium là dành riêng cho bạn, vui lòng không chia sẻ tài khoản cho người khác.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. Đăng ký & Ủng hộ</h2>
            <p>
              Lenote.dev cung cấp các gói đặc quyền để tiếp cận nội dung chuyên sâu (System Design, DevOps, AI...). 
              Việc bạn đăng ký là sự đóng góp trực tiếp giúp tôi duy trì server và dành thời gian nghiên cứu nội dung chất lượng hơn.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Giao dịch là hình thức ủng hộ cá nhân (support based).</li>
              <li>Tôi cam kết cung cấp nội dung đúng như mô tả nhưng không có chính sách hoàn tiền sau khi bạn đã truy cập tài liệu chuyên sâu.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. Giới hạn trách nhiệm</h2>
            <p>
              Tôi nỗ lực hết mình để đảm bảo kiến thức chính xác và nền tảng hoạt động ổn định. Tuy nhiên:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kiến thức công nghệ thay đổi từng ngày, các bài viết cũ có thể không còn phù hợp hoàn toàn với thực tế hiện tại.</li>
              <li>Tôi không chịu trách nhiệm cho các sự cố kỹ thuật từ nhà cung cấp server hoặc lỗi mạng cá nhân của bạn.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. Liên hệ trực tiếp</h2>
            <p>
              Vì đây là dự án cá nhân, mọi thắc mắc hay góp ý bạn có thể gửi trực tiếp cho tôi qua email: 
              <a href="mailto:tuanlinh@lenote.dev" className="text-primary hover:underline ml-1">tuanlinh@lenote.dev</a>.
            </p>
          </section>
        </div>

        {/* Footer Link back */}
        <div className="pt-10 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            ← Quay lại Trang chủ
          </Link>
        </div>
      </div>
    </MemberContainer>
  );
}
