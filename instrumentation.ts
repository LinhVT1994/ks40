export async function register() {
  // Chỉ chạy trên Node.js runtime (không chạy trên Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('@/lib/logger');
    logger.info({ runtime: process.env.NEXT_RUNTIME, nodeEnv: process.env.NODE_ENV }, 'Server khởi động');

    const { registerEventListeners } = await import('@/lib/events/listeners');
    registerEventListeners();
  }
}
