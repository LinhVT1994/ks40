import BrandLogo from "@/components/shared/BrandLogo";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-black/40 backdrop-blur-xl max-md:backdrop-blur-lg border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative z-10 glass-panel ring-1 ring-zinc-200/50 dark:ring-white/5">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-black mb-3 tracking-tight text-zinc-900 dark:text-white font-display">Khôi phục mật khẩu</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">Đừng lo lắng, đôi khi chúng ta cũng hay quên mà.</p>
      </div>
      
      <ForgotPasswordForm />
    </div>
  );
}
