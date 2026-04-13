import React from 'react';
import MemberContainer from '@/components/layout/MemberContainer';
import Link from 'next/link';

export const metadata = {
  title: 'Chính sách Bảo mật | Lenote',
  description: 'Cách chúng tôi bảo vệ quyền riêng tư và dữ liệu của bạn tại Lenote.',
};

export default function PrivacyPage() {
  return (
    <MemberContainer className="max-w-3xl py-20 px-6">
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-white">Chính sách Bảo mật</h1>
          <p className="text-zinc-500 dark:text-slate-400">Cập nhật lần cuối: 04 tháng 04, 2026</p>
        </div>

        {/* TL;DR Section */}
        <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 space-y-3">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
            <span className="material-icons text-sm">verified_user</span>
            Cam kết của tôi
          </h2>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-slate-400">
            <li>• Tôi chỉ thu thập những gì thực sự cần thiết để bạn học tập (Email, Tên).</li>
            <li>• Tuyệt đối không bán dữ liệu cho AI hay bên thứ 3 nào để quảng cáo.</li>
            <li>• Bạn có toàn quyền xóa tài khoản và mọi dữ liệu liên quan bất cứ lúc nào.</li>
            <li>• Mọi thứ minh bạch và tối giản nhất có thể.</li>
          </ul>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Thông tin cá nhân</h2>
            <p>
              Khi bạn đăng ký, tôi thu thập:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email:</strong> Để làm định danh đăng nhập và gửi thông báo quan trọng.</li>
              <li><strong>Tên hiển thị:</strong> Để cá nhân hóa trải nghiệm trong bài viết và bình luận.</li>
              <li><strong>Dữ liệu học tập:</strong> Lịch sử đọc và các Bookmark giúp bạn tiếp tục hành trình học tập.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. Mục đích sử dụng</h2>
            <p>
              Dữ liệu của bạn chỉ được dùng cho 2 mục đích duy nhất:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Duy trì trạng thái đăng nhập (Authentication).</li>
              <li>Cải thiện trải nghiệm nội dung (phân tích nội dung nào bạn quan tâm để tôi viết tiếp).</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. Cookie & Tracking</h2>
            <p>
              Tôi sử dụng Cookie tối thiểu để ghi nhớ phiên làm việc của bạn. 
              Chúng tôi <strong>không</strong> sử dụng các tracker theo dõi hành vi xuyên suốt các website khác (cross-site tracking).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. Bảo mật dữ liệu</h2>
            <p>
              Hệ thống sử dụng các tiêu chuẩn mã hóa hiện đại (TLS/SSL) để truyền tải dữ liệu. 
              Vì đây là dự án cá nhân, tôi chọn các nhà cung cấp nền tảng uy tín để lưu trữ thông tin của bạn một cách an toàn nhất.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. Quyền kiểm soát của bạn</h2>
            <p>
              Bất cứ lúc nào bạn muốn dừng lại, bạn có quyền:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Thay đổi thông tin hồ sơ trong phần Cài đặt.</li>
              <li>Yêu cầu xóa toàn bộ dữ liệu cá nhân khỏi hệ thống bằng cách liên hệ email.</li>
            </ul>
          </section>
        </div>

        {/* Footer Link back */}
        <div className="pt-10 border-t border-zinc-300 dark:border-slate-800 text-center">
          <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
            ← Quay lại Trang chủ
          </Link>
        </div>
      </div>
    </MemberContainer>
  );
}
