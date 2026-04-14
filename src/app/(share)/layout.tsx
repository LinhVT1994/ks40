import Link from 'next/link';
import { auth } from '@/auth';
import BrandLogo from '@/components/shared/BrandLogo';
import MemberHeader from '@/features/member/components/MemberHeader';
import MemberFooter from '@/features/member/components/MemberFooter';

export default async function ShareLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark font-display text-zinc-800 dark:text-slate-100 min-h-screen relative">
      {/* Background glow effects — hidden on mobile for performance */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none z-0 hidden md:block">
        <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] mix-blend-screen" />
        <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-accent-purple/20 rounded-full blur-[80px] mix-blend-screen" />
      </div>

      <MemberHeader />

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 py-32 md:py-56">
        {children}
      </main>

      <MemberFooter />
    </div>
  );
}
