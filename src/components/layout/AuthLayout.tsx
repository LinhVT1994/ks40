import React from "react";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-auth">
      <AuthHeader />
      
      <main className="ui-auth-main relative z-10">
        <aside className="ui-auth-story">
          <p className="ui-eyebrow">Không gian tri thức của bạn</p>
          <h2 className="text-ink">Những điều hay,<br />xứng đáng được<br /><span className="text-primary">lưu giữ.</span></h2>
          <p>Đọc những góc nhìn mới, ghi lại điều tâm đắc và xây dựng kho tri thức của riêng bạn cùng Lenote.</p>
          <blockquote>“Mỗi ngày, thêm một điều đáng nhớ.”</blockquote>
        </aside>
        <div className="flex w-full justify-center">{children}</div>
      </main>
      
      <AuthFooter />
    </div>
  );
}
