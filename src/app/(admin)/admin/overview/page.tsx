import React from 'react';
import AdminHeader from '@/features/admin/components/AdminHeader';
import StatsCards from '@/features/admin/components/StatsCards';
import ActivityFeed from '@/features/admin/components/ActivityFeed';
import TopArticles from '@/features/admin/components/TopArticles';
import TopAuthors from '@/features/admin/components/TopAuthors';
import { getAdminStatsAction, getTopArticlesAction, getTopAuthorsAction } from '@/features/admin/actions/stats';
import { getRecentActivityAction } from '@/features/admin/actions/activity';

export default async function AdminDashboardPage() {
  const [stats, activities, topArticles, topAuthors] = await Promise.all([
    getAdminStatsAction(),
    getRecentActivityAction({ limit: 5 }),
    getTopArticlesAction(5),
    getTopAuthorsAction(5),
  ]);

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Dashboard' }]} />
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-1">Chào buổi sáng, Admin! Đây là cập nhật mới nhất.</p>
        </div>

        {/* Stats */}
        <StatsCards
          totalArticles={stats.totalArticles}
          totalUsers={stats.totalUsers}
          totalViews={stats.totalViews}
          newCommentsToday={stats.newCommentsToday}
        />

        {/* Content Grid: Left (2/3) + Right (1/3) */}
        <div className="grid xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <TopArticles articles={topArticles as any} />
          </div>
          <div className="xl:col-span-1 space-y-8">
            <ActivityFeed activities={activities} />
            <TopAuthors authors={topAuthors as any} />
          </div>
        </div>

      </div>
    </>
  );
}
