export async function register() {
  // Chỉ chạy trên Node.js runtime (không chạy trên Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerEventListeners } = await import('@/lib/events/listeners');
    registerEventListeners();
  }
}
