import * as React from "react";
import MemberHeader from "@/features/member/components/MemberHeader";
import MemberFooter from "@/features/member/components/MemberFooter";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getAnnouncementAction } from "@/features/admin/actions/config";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = await getAnnouncementAction();

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 min-h-screen relative">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent-purple/20 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <main className="flex-1 flex flex-col relative z-10 w-full">
        {announcement && <AnnouncementBanner announcement={announcement} />}
        <MemberHeader />
        
        {/* Main Content Dashboard */}
        <div data-focus-container className="w-full flex-1">
          {children}
        </div>

        <MemberFooter />
      </main>
    </div>
  );
}
