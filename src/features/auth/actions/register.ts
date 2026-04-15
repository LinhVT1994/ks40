'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { signIn } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { eventBus, EVENTS } from '@/lib/events/bus';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'auth/register' });

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerAction(formData: FormData): Promise<RegisterResult> {
  const email    = (formData.get('email')    as string)?.trim().toLowerCase();
  const name     = (formData.get('name')     as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string);
  const confirm  = (formData.get('confirm')  as string);

  log.info({ email, username }, 'Đăng ký tài khoản');

  if (!email || !name || !username || !password) {
    return { success: false, error: 'Vui lòng điền đầy đủ thông tin.' };
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return { success: false, error: 'Username chỉ được chứa chữ cái, số, dấu gạch dưới và dấu chấm.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
  }
  if (password !== confirm) {
    return { success: false, error: 'Mật khẩu xác nhận không khớp.' };
  }

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    log.warn({ email }, 'Đăng ký thất bại: email đã tồn tại');
    return { success: false, error: 'Email này đã được sử dụng.' };
  }

  const existingUsername = await db.user.findUnique({ where: { username } });
  if (existingUsername) {
    log.warn({ username }, 'Đăng ký thất bại: username đã tồn tại');
    return { success: false, error: 'Username này đã được sử dụng.' };
  }

  const hashed = await hashPassword(password);
  const user = await db.user.create({ data: { email, name, username, password: hashed } });
  await db.userOnboarding.create({ data: { userId: user.id } });

  log.info({ userId: user.id, email }, 'Đăng ký thành công');

  // Phát tín hiệu Event
  eventBus.emit(EVENTS.USER_REGISTERED, { userId: user.id, name: user.name });

  try {
    await signIn('credentials', { email, password, redirect: false });
  } catch (err) {
    if (!isRedirectError(err)) throw err;
  }
  return { success: true };
}
