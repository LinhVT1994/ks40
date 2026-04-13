import { Suspense } from "react";
import BrandLogo from "@/components/shared/BrandLogo";
import SocialLogin from "@/features/auth/components/SocialLogin";
import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/40 backdrop-blur-xl max-md:backdrop-blur-lg border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative z-10 glass-panel ring-1 ring-zinc-200/50 dark:ring-white/5">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h1 className="text-3xl font-black mb-3 tracking-tight text-zinc-900 dark:text-white font-display">Đăng nhập</h1>
        <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
          Tiếp tục hành trình chinh phục tri thức tại Lenote<span className="text-primary font-bold">.dev</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <Suspense>
          <SocialLogin />
        </Suspense>
      </div>

      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-zinc-100 dark:border-white/5"></div>
        <span className="flex-shrink-0 mx-4 text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest">hoặc</span>
        <div className="flex-grow border-t border-zinc-100 dark:border-white/5"></div>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center text-sm text-zinc-500 dark:text-slate-400">
        Chưa có tài khoản? <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">Đăng ký ngay</Link>
      </div>
    </div>
  );
}
