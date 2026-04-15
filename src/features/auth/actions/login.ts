'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'auth/login' });

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;
  const remember = formData.get('remember') === 'on';

  if (!email || !password) {
    return { success: false, error: 'Vui lòng nhập email và mật khẩu.' };
  }

  log.info({ email }, 'Đăng nhập');

  try {
    await signIn('credentials', { email, password, remember: String(remember), redirect: false });
    log.info({ email }, 'Đăng nhập thành công');
    return { success: true };
  } catch (err) {
    // Auth.js v5 server-side signIn throws NEXT_REDIRECT on success — let Next.js handle it
    if (isRedirectError(err)) {
      log.info({ email }, 'Đăng nhập thành công');
      return { success: true };
    }
    if (err instanceof AuthError) {
      switch (err.type) {
        case 'CredentialsSignin':
          log.warn({ email }, 'Đăng nhập thất bại: sai email hoặc mật khẩu');
          return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
        default:
          log.warn({ email, authErrorType: err.type }, 'Đăng nhập thất bại');
          return { success: false, error: 'Tài khoản bị khoá hoặc có lỗi xảy ra.' };
      }
    }
    log.error({ err, email }, 'Lỗi không xác định khi đăng nhập');
    throw err;
  }
}
