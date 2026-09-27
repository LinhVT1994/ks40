import BrandLogo from "@/components/shared/BrandLogo";
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="ui-auth-card relative z-10">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-slate-400">Đặt lại mật khẩu</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
