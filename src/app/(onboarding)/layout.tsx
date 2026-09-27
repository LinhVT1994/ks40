import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ui-onboarding min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 py-10 sm:py-20 relative overflow-hidden">
      <p className="ui-eyebrow mb-8">Bắt đầu hành trình của bạn</p>
      <div className="relative z-10 w-full flex flex-col items-center">{children}</div>
    </div>
  );
}
