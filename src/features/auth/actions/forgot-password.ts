'use server';

import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { allowAuthAttempt } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/seo';

export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function forgotPasswordAction(formData: FormData): Promise<ForgotPasswordResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email || email.length > 254) {
    return { success: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  if (!await allowAuthAttempt('forgot', email)) return { success: true };
  const user = await db.user.findUnique({ where: { email } });

  // Luôn trả về success để không lộ email có tồn tại hay không
  if (!user || !user.password) {
    return { success: true };
  }

  // Xoá token cũ nếu có
  await db.passwordResetToken.deleteMany({ where: { email } });

  // Tạo token mới, hết hạn sau 30 phút
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordResetToken.create({ data: { email, token: crypto.createHash('sha256').update(token).digest('hex'), expiresAt } });

  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error('[ResetPassword] Gửi email thất bại:', err);
  }

  return { success: true };
}
