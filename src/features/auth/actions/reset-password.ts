'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResult> {
  const token    = (formData.get('token') as string)?.trim();
  const password = (formData.get('password') as string);
  const confirm  = (formData.get('confirm') as string);

  if (!token) return { success: false, error: 'Token không hợp lệ.' };
  if (!password || password.length < 8)
    return { success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  if (password !== confirm)
    return { success: false, error: 'Mật khẩu xác nhận không khớp.' };

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record) return { success: false, error: 'Link đặt lại mật khẩu không hợp lệ.' };
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { token } });
    return { success: false, error: 'Link đã hết hạn. Vui lòng yêu cầu lại.' };
  }

  const hashed = await hashPassword(password);
  await db.user.update({ where: { email: record.email }, data: { password: hashed } });
  await db.passwordResetToken.delete({ where: { token } });

  return { success: true };
}
