import BrandLogo from "@/components/shared/BrandLogo";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 glass-panel">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Khôi phục mật khẩu</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Đừng lo lắng, đôi khi chúng ta cũng hay quên mà.</p>
      </div>
      
      <ForgotPasswordForm />
    </div>
  );
}
