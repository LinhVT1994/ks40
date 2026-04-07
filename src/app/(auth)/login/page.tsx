import { Suspense } from "react";
import BrandLogo from "@/components/shared/BrandLogo";
import SocialLogin from "@/features/auth/components/SocialLogin";
import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-300 dark:border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 glass-panel ring-1 ring-slate-200/50 dark:ring-white/5">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Đăng nhập</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          Tiếp tục hành trình chinh phục và nâng tầm tri thức tại Lenote<span className="text-primary">.dev</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <Suspense>
          <SocialLogin />
        </Suspense>
      </div>

      <div className="relative flex items-center py-5">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">hoặc</span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản? <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">Đăng ký ngay</Link>
      </div>
    </div>
  );
}
