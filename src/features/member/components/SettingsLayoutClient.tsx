'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { User } from 'next-auth';
import { UserCircle, SlidersHorizontal, Shield, Bell } from 'lucide-react';
import SettingsProfile from './SettingsProfile';
import SettingsPreferences from './SettingsPreferences';
import SettingsSecurity from './SettingsSecurity';
import SettingsNotifications from './SettingsNotifications';
import { ArticleCategory, Occupation } from '@prisma/client';

function SettingsLayoutContent({ 
  user, 
  initialOccupation, 
  initialCategories,
  initialCodeTheme
}: { 
  user: User; 
  initialOccupation: Occupation | null; 
  initialCategories: ArticleCategory[]; 
  initialCodeTheme: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const validTabs = ['profile', 'preferences', 'security', 'notifications'];
  const activeTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'profile';

  const handleTabChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const TABS = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, disabled: false },
    { id: 'preferences', label: 'Sở thích & Nội dung', icon: SlidersHorizontal, disabled: false },
    { id: 'security', label: 'Bảo mật', icon: Shield, disabled: false },
    { id: 'notifications', label: 'Thông báo', icon: Bell, disabled: false },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 w-full mt-10">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-[100px]">
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id as any)}
              disabled={tab.disabled}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap min-w-fit md:min-w-0 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed hidden md:flex' : ''}`}
            >
              <tab.icon className={`w-[18px] h-[18px] transition-transform ${activeTab === tab.id ? 'text-primary scale-110' : 'text-slate-400'}`} />
              {tab.label}
              {tab.disabled && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-slate-500">Coming</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Form Content */}
      <div className="flex-1 w-full min-w-0">
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm lg:shadow-xl lg:shadow-slate-200/20 dark:lg:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Hồ sơ cá nhân</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">Quản lý cách mà hồ sơ của bạn hiển thị trên nền tảng KS4.0. Thông tin này sẽ công khai tới cộng đồng khi bạn đăng bài viết hoặc bình luận.</p>
            </div>
            <SettingsProfile user={user} />
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm lg:shadow-xl lg:shadow-slate-200/20 dark:lg:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Sở thích & Thuật toán</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">Bạn cung cấp càng chi tiết, thuật toán của chúng tôi càng dễ dàng đề xuất các bài báo học thuật tốt nhất dành riêng cho cá nhân bạn.</p>
            </div>
            <SettingsPreferences 
              initialOccupation={initialOccupation}
              initialCategories={initialCategories}
              initialCodeTheme={initialCodeTheme}
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm lg:shadow-xl lg:shadow-slate-200/20 dark:lg:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Bảo mật tài khoản</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">Quản lý mật khẩu, xác thực hai lớp (2FA) và theo dõi các thiết bị đang đăng nhập vào nền tảng.</p>
            </div>
            <SettingsSecurity />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm lg:shadow-xl lg:shadow-slate-200/20 dark:lg:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Tùy chọn Thông báo</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">Kiểm soát hộp thư và thông báo đẩy (Push) từ hệ thống để bạn luôn tập trung vào việc học.</p>
            </div>
            <SettingsNotifications />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsLayoutClient(props: any) {
  return (
    <Suspense fallback={<div className="w-full h-[600px] animate-pulse rounded-3xl bg-white/5 border border-white/10" />}>
      <SettingsLayoutContent {...props} />
    </Suspense>
  );
}
