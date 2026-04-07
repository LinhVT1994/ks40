import BrandLogo from "@/components/shared/BrandLogo";
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 glass-panel">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Đặt lại mật khẩu</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
