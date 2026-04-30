import Link from "next/link";

export default function AuthFooter() {
  return (
    <footer className="w-full py-6 px-8 relative z-10 flex flex-col sm:flex-row items-center justify-center sm:justify-between mt-auto gap-4 sm:gap-0">
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-slate-400 w-full sm:w-auto">
        <span className="font-black text-zinc-800 dark:text-slate-200 tracking-tighter">Lenote</span>
        <Link href="/terms" className="hover:text-zinc-800 dark:hover:text-white transition-colors">Điều khoản</Link>
        <span className="text-zinc-700 dark:text-slate-600">|</span>
        <Link href="/privacy" className="hover:text-zinc-800 dark:hover:text-white transition-colors">Bảo mật</Link>
      </div>
    </footer>
  );
}
