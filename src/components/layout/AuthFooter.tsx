import Link from "next/link";

export default function AuthFooter() {
  return (
    <footer className="w-full py-6 px-8 relative z-10 flex items-center justify-between mt-auto">
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Lenote.dev</span>
        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Điều khoản</Link>
        <span className="text-slate-700 dark:text-slate-600">|</span>
        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Bảo mật</Link>
      </div>
    </footer>
  );
}
