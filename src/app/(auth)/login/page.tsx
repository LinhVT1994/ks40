import { Suspense } from "react";
import BrandLogo from "@/components/shared/BrandLogo";
import SocialLogin from "@/features/auth/components/SocialLogin";
import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="ui-auth-card relative z-10">
      {/* Mobile Back Button */}
      <Link href="/" className="hidden absolute top-6 left-6 p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-primary transition-all">
        <ArrowLeft className="w-4 h-4" />
      </Link>

      <div className="text-left mb-6 sm:mb-8">
        <div className="flex mb-4 sm:mb-6">
          <BrandLogo size={40} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 sm:mb-3 tracking-tight text-zinc-900 dark:text-white font-display">Đăng nhập</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-[320px] font-medium">
          Tiếp tục hành trình chinh phục tri thức tại Lenote<span className="text-primary font-bold">.dev</span>
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Suspense>
          <SocialLogin />
        </Suspense>
      </div>

      <div className="relative flex items-center py-4 sm:py-6">
        <div className="flex-grow border-t border-zinc-100 dark:border-white/5"></div>
        <span className="flex-shrink-0 mx-4 text-zinc-400 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-widest">hoặc</span>
        <div className="flex-grow border-t border-zinc-100 dark:border-white/5"></div>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <div className="mt-6 sm:mt-8 text-center text-sm text-zinc-500 dark:text-slate-400">
        Chưa có tài khoản? <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">Đăng ký ngay</Link>
      </div>
    </div>
  );
}
