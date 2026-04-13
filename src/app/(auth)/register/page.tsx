import BrandLogo from "@/components/shared/BrandLogo";
import RegisterForm from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative z-10 glass-panel ring-1 ring-zinc-200/50 dark:ring-white/5">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-black mb-3 tracking-tight text-zinc-900 dark:text-white font-display">Tạo tài khoản mới</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">Bắt đầu hành trình chinh phục tri thức tại Lenote<span className="text-primary font-bold">.dev</span></p>
      </div>
      
      <RegisterForm />
      
      <div className="mt-8 text-center text-[11px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-white/5 pt-8">
        Đã có tài khoản? <Link href="/login" className="text-primary hover:text-primary/80 transition-colors ml-1">Đăng nhập ngay</Link>
      </div>
    </div>
  );
}
