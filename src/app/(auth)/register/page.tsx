import BrandLogo from "@/components/shared/BrandLogo";
import RegisterForm from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-300 dark:border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 glass-panel ring-1 ring-slate-200/50 dark:ring-white/5">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Tạo tài khoản mới</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Bắt đầu hành trình chinh phục công nghệ 4.0 của bạn với Lenote<span className="text-primary">.dev</span>.</p>
      </div>
      
      <RegisterForm />
      
      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
        Đã có tài khoản? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Đăng nhập ngay</Link>
      </div>
    </div>
  );
}
