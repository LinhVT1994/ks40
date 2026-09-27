import * as React from "react";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ui-admin flex bg-canvas font-sans text-ink h-screen overflow-hidden">
      <React.Suspense fallback={<div className="w-64 shrink-0 bg-white dark:bg-slate-950 border-r border-zinc-300 dark:border-white/5" />}>
        <AdminSidebar />
      </React.Suspense>
      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-auto w-full relative">
        {children}
      </main>
    </div>
  );
}
