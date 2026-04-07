'use server';

import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function forgotPasswordAction(formData: FormData): Promise<ForgotPasswordResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  const user = await db.user.findUnique({ where: { email } });

  // Luôn trả về success để không lộ email có tồn tại hay không
  if (!user || !user.password) {
    console.log(`[ResetPassword] Email không tồn tại hoặc là tài khoản Google: ${email}`);
    return { success: true };
  }

  // Xoá token cũ nếu có
  await db.passwordResetToken.deleteMany({ where: { email } });

  // Tạo token mới, hết hạn sau 30 phút
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordResetToken.create({ data: { email, token, expiresAt } });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[ResetPassword] ${resetUrl}`);
  }

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error('[ResetPassword] Gửi email thất bại:', err);
  }

  return { success: true };
}
