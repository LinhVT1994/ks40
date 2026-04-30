import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="hidden sm:flex w-full py-8 px-10 relative z-10 items-center justify-between">
      <Link 
        href="/" 
        className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-all duration-300 text-sm font-medium"
      >
        <div className="w-8 h-8 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
          Quay lại Trang chủ
        </span>
      </Link>
    </header>
  );
}
