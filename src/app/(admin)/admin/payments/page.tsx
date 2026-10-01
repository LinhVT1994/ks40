import AdminHeader from '@/features/admin/components/AdminHeader';
import PaymentsClient from '@/features/consultations/components/admin/PaymentsClient';
import { getAdminPaymentsAction, getPaymentAccountAdminAction, type PaymentQueue } from '@/features/consultations/actions/payment-admin';

const QUEUES: PaymentQueue[] = ['awaiting', 'refund', 'all'];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ queue?: string; q?: string }> }) {
  const params = await searchParams;
  const queue = QUEUES.includes(params.queue as PaymentQueue) ? (params.queue as PaymentQueue) : 'awaiting';
  const [account, data] = await Promise.all([getPaymentAccountAdminAction(), getAdminPaymentsAction({ queue, q: params.q })]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Thanh toán' }]} />
      <PaymentsClient account={account} queue={queue} q={params.q ?? ''} rows={data.rows} counts={data.counts} />
    </>
  );
}
