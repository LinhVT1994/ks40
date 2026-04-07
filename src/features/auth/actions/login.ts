'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

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

  try {
    await signIn('credentials', { email, password, remember: String(remember), redirect: false });
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
        default:
          return { success: false, error: 'Tài khoản bị khoá hoặc có lỗi xảy ra.' };
      }
    }
    throw err;
  }
}
