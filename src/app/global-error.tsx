'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 font-sans antialiased">
        <div className="text-center max-w-md">
          <p className="text-[120px] font-bold leading-none text-zinc-100 select-none">
            500
          </p>

          <div className="-mt-6 space-y-3">
            <h1 className="text-2xl font-bold text-zinc-800">
              Lỗi nghiêm trọng
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Ứng dụng gặp sự cố không thể khôi phục. Vui lòng thử tải lại trang.
            </p>
            {error.digest && (
              <p className="text-[11px] text-zinc-500 font-mono">
                Mã lỗi: {error.digest}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Tải lại
            </button>
            <a
              href="/"
              className="px-6 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold text-zinc-600 hover:border-blue-500/50 hover:text-blue-500 transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
