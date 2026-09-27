import BrandLogo from "@/components/shared/BrandLogo";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="ui-auth-card relative z-10">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>
        <h2 className="text-3xl font-semibold mb-3 tracking-tight text-zinc-900 dark:text-white font-display">Khôi phục mật khẩu</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">Đừng lo lắng, đôi khi chúng ta cũng hay quên mà.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
