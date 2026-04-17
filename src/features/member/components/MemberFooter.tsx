'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Facebook, Github, Youtube, Mail, MapPin, Phone, ExternalLink, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';

export default function MemberFooter() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [currentYear, setCurrentYear] = useState(2026);
  useEffect(() => { setCurrentYear(new Date().getFullYear()); }, []);

  // Pages where we HIDE the footer to maintain a distraction-free "app" feel
  const hideOn = ['/settings', '/bookmarks', '/history', '/notifications', '/search'];
  const isWritePage = pathname.startsWith('/write');
  const isMyProfile = session?.user?.id && pathname === `/profile/${session.user.id}`;

  if (hideOn.includes(pathname) || isWritePage || isMyProfile) {
    return null;
  }

  return (
    <footer className="w-full relative z-10 bg-transparent pt-32 pb-1">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Column 1: Brand & About */}
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer inline-flex">
              <div className="transition-transform group-hover:scale-110">
                <BrandLogo size={40} />
              </div>
              <span className="text-lg tracking-[0.08em] flex items-center uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                <span className="font-medium text-zinc-500 dark:text-slate-400">Le</span>
                <span className="font-black bg-gradient-to-r from-primary via-accent-purple to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shimmer">
                  note
                </span>
              </span>
            </Link>
            <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              Nền tảng chia sẻ tri thức và kinh nghiệm đa góc nhìn. Từ những bài học chuyên môn sâu sắc đến những câu chuyện đời sống, cùng nhau lưu giữ và lan tỏa giá trị mỗi ngày.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://facebook.com/lenote.dev" icon={<Facebook className="w-5 h-5" />} label="Facebook" />
              <SocialLink href="https://github.com/lenote.dev" icon={<Github className="w-5 h-5" />} label="Github" />
              <SocialLink href="https://youtube.com/@lenote.dev" icon={<Youtube className="w-5 h-5" />} label="Youtube" />
              <SocialLink href="mailto:admin@lenote.dev" icon={<Mail className="w-5 h-5" />} label="Email" />
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="font-bold text-zinc-800 dark:text-white text-[11px] uppercase tracking-[0.2em]">Sản phẩm</h4>
            <ul className="space-y-4">
              <FooterLink href="/" label="Bài viết mới" />
              <FooterLink href="/search" label="Tìm kiếm bài viết" />
              <FooterLink href="#" label="Sách & Tài liệu" isComingSoon />
              <FooterLink href="#" label="Khóa học chuyên sâu" isComingSoon />
            </ul>
          </div>

          {/* Column 3: Newsletter & Support */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="font-bold text-zinc-800 dark:text-white text-[11px] uppercase tracking-[0.2em]">Đăng ký nhận tin</h4>
            <p className="text-zinc-500 dark:text-slate-400 text-sm">
              Cập nhật kiến thức và tài liệu mới nhất mỗi tuần.
            </p>
            <form className="relative group max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email của bạn..."
                className="w-full bg-zinc-100/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all text-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                disabled
                className="absolute right-1 top-1 bottom-1 px-4 bg-primary/50 text-white/50 text-[11px] font-bold rounded-lg cursor-not-allowed"
              >
                Gửi ngay
              </button>
            </form>
            <div className="pt-2 flex flex-col gap-2.5 text-xs text-zinc-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary/40" />
                <span>Hà Nội, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary/40" />
                <span>admin@lenote.dev</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-[11px] font-medium">
            © {currentYear} Lenote<span className="text-primary">.dev</span>
          </p>
          <div className="flex items-center gap-8">
            <Link href="/terms" className="text-zinc-500/80 hover:text-primary text-[11px] transition-colors">Điều khoản</Link>
            <Link href="/privacy" className="text-zinc-500/80 hover:text-primary text-[11px] transition-colors">Bảo mật</Link>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
              <Sparkles className="w-3 h-3 text-amber-500/50" />
              Built for Engineers
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label, isComingSoon = false }: { href: string; label: string; isComingSoon?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="text-zinc-500 dark:text-slate-400 hover:text-primary dark:hover:text-white text-sm transition-all hover:translate-x-1 inline-flex items-center gap-1.5 group"
      >
        <span>{label}</span>
        {isComingSoon && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 font-bold uppercase tracking-widest">Sớm có</span>
        )}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary/30 transition-all hover:-translate-y-1 shadow-sm"
    >
      {icon}
    </Link>
  );
}
