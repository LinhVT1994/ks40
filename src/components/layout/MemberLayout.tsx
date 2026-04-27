import * as React from "react";
import MemberHeader from "@/features/member/components/MemberHeader";
import MemberFooter from "@/features/member/components/MemberFooter";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CodeThemeSync from "@/components/shared/CodeThemeSync";
import { getAnnouncementAction } from "@/features/admin/actions/config";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcement = await getAnnouncementAction();

  const session = await auth();
  let codeTheme: string | null = null;
  if (session?.user?.id) {
    const prefs = await db.userOnboarding.findUnique({
      where: { userId: session.user.id },
      select: { codeTheme: true },
    });
    codeTheme = prefs?.codeTheme ?? null;
  }

  return (
    <div className="flex bg-background-light dark:bg-background-dark font-display text-zinc-800 dark:text-slate-100 min-h-screen relative">
      <CodeThemeSync codeTheme={codeTheme} />

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
