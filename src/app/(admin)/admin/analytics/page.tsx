import React from 'react';
import { Metadata } from 'next';
import AdminHeader from '@/features/admin/components/AdminHeader';
import AnalyticsDashboard from '@/features/admin/components/Analytics/AnalyticsDashboard';
import { 
  getOverallGrowthAction, 
  getEngagementMetricsAction, 
  getTopicPerformanceAction, 
  getDetailedContentStatsAction 
} from '@/features/admin/actions/analytics';
import { SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Phân tích hệ thống | Admin ${SITE_NAME}`,
  description: 'Toàn cảnh dữ liệu tăng trưởng và hiệu quả nội dung.',
};

export default async function AdminAnalyticsPage() {
  // Fetch all analytics data in parallel on the server
  const [growth, metrics, topics, topContent] = await Promise.all([
    getOverallGrowthAction(),
    getEngagementMetricsAction(),
    getTopicPerformanceAction(),
    getDetailedContentStatsAction(),
  ]);

  return (
    <>
      <AdminHeader 
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' }, 
          { label: 'Phân tích' }
        ]} 
      />
      <div className="flex-1 p-4 md:p-6 lg:p-10 bg-zinc-50 dark:bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Page Intro */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter font-display">
              Phân tích Tăng trưởng
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-slate-400 opacity-80">
              Cái nhìn sâu sắc về hiệu suất nội dung và sự phát triển của cộng đồng.
            </p>
          </div>

          <AnalyticsDashboard 
            growth={growth}
            metrics={metrics}
            topics={topics}
            topContent={topContent}
          />
        </div>
      </div>
    </>
  );
}
