import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getMyConsultationSettingsAction, getMyConsultationsAction } from '@/features/consultations/actions/consultation';
import ConsultationList from '@/features/consultations/components/ConsultationList';
import ConsultationSettingsForm from '@/features/consultations/components/ConsultationSettingsForm';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Lịch tư vấn',
  robots: { index: false, follow: false },
};

type Items = Awaited<ReturnType<typeof getMyConsultationsAction>>;

/** Upcoming requests waiting for this user's answer as host. */
function countAwaitingResponse(items: Items) {
  const now = Date.now();
  return items.filter(c => c.role === 'host' && c.status === 'PENDING' && new Date(c.startAt).getTime() > now).length;
}

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/consultations');

  const [{ tab }, mine, items] = await Promise.all([searchParams, getMyConsultationSettingsAction(), getMyConsultationsAction()]);
  const canHost = !!mine?.canHost;
  const activeTab = tab === 'settings' && canHost ? 'settings' : 'bookings';
  const pendingForMe = countAwaitingResponse(items);

  const tabs = [
    { id: 'bookings', label: 'Lịch hẹn', badge: pendingForMe },
    ...(canHost ? [{ id: 'settings', label: 'Thiết lập nhận tư vấn', badge: 0 }] : []),
  ];

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-8 py-10 w-full animate-in fade-in duration-500">
      <p className="ui-eyebrow mb-4">Trò chuyện 1:1</p>
      <h1 className="text-3xl font-display font-bold text-zinc-800 dark:text-white tracking-tight">Lịch tư vấn</h1>
      <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
        {canHost ? 'Quản lý các buổi trò chuyện bạn đã đặt và những yêu cầu người đọc gửi tới bạn.' : 'Các buổi trò chuyện bạn đã đặt với tác giả.'}
      </p>

      <nav className="mt-8 mb-8 flex gap-1 border-b border-zinc-200 dark:border-white/10">
        {tabs.map(t => (
          <Link key={t.id} href={t.id === 'bookings' ? '/consultations' : `/consultations?tab=${t.id}`} scroll={false}
            className={cn('relative px-4 py-3 text-sm font-semibold transition-colors',
              activeTab === t.id ? 'text-primary after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary after:rounded-full' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white')}>
            {t.label}
            {t.badge > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">{t.badge}</span>}
          </Link>
        ))}
      </nav>

      {activeTab === 'settings' ? (
        <ConsultationSettingsForm initial={mine?.settings ?? null} bookedDates={mine?.bookedDates ?? []} profileHref={`/@${session.user.username || session.user.id}`} />
      ) : (
        <ConsultationList items={items} />
      )}
    </div>
  );
}
