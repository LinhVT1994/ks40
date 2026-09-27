'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { createHash } from 'node:crypto';
import { allowAuthAttempt } from '@/lib/rate-limit';

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResult> {
  const token    = (formData.get('token') as string)?.trim();
  const password = (formData.get('password') as string);
  const confirm  = (formData.get('confirm') as string);

  if (!token || !/^[a-f0-9]{64}$/.test(token)) return { success: false, error: 'Token không hợp lệ.' };
  if (!password || password.length < 8 || Buffer.byteLength(password) > 72)
    return { success: false, error: 'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.' };
  if (password !== confirm)
    return { success: false, error: 'Mật khẩu xác nhận không khớp.' };

  if (!await allowAuthAttempt('reset', token)) return { success: false, error: 'Vui lòng thử lại sau 15 phút.' };
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await db.passwordResetToken.findUnique({ where: { token: tokenHash } });

  if (!record) return { success: false, error: 'Link đặt lại mật khẩu không hợp lệ.' };
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.deleteMany({ where: { token: tokenHash } });
    return { success: false, error: 'Link đã hết hạn. Vui lòng yêu cầu lại.' };
  }

  const hashed = await hashPassword(password);
  const consumed = await db.$transaction(async tx => {
    const result = await tx.passwordResetToken.deleteMany({ where: { token: tokenHash, expiresAt: { gt: new Date() } } });
    if (result.count !== 1) return false;
    await tx.user.update({ where: { email: record.email }, data: { password: hashed } });
    await tx.passwordResetToken.deleteMany({ where: { email: record.email } });
    return true;
  });
  if (!consumed) return { success: false, error: 'Link đã hết hạn hoặc đã được sử dụng.' };

  return { success: true };
}
