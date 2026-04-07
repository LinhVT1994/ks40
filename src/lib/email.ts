import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'KS40 <onboarding@resend.dev>',
    to: email,
    subject: 'Đặt lại mật khẩu KS40',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
        <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;">Đặt lại mật khẩu</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.
          Link dưới đây có hiệu lực trong <strong>30 phút</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `,
  });
}
