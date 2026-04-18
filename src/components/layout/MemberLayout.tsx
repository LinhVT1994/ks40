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
    <div className="flex bg-zinc-50 dark:bg-slate-950 font-display text-zinc-800 dark:text-slate-100 min-h-screen relative">

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
