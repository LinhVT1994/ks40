'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ArticleCategory, Occupation } from '@prisma/client';
import { completeOnboardingAction, skipOnboardingAction } from '@/features/onboarding/actions/onboarding';
import StepOccupation from './StepOccupation';
import StepCategories from './StepCategories';

export type OnboardingData = {
  occupation: Occupation | null;
  interestedCategories: ArticleCategory[];
};

function DoneScreen({ userName }: { userName?: string }) {
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = '/'; }, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in duration-600">
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float-up {
          0%   { transform: translateY(0px) scale(1); opacity: 1; }
          100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
        }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50%       { transform: scale(1.5); opacity: 0; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .done-icon   { animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .ring-1      { animation: ring-pulse 2s 0.8s ease-out infinite; }
        .ring-2      { animation: ring-pulse 2s 1.2s ease-out infinite; }
        .float-e1    { animation: float-up 1.8s 0.3s ease-out both; }
        .float-e2    { animation: float-up 2.0s 0.5s ease-out both; }
        .float-e3    { animation: float-up 1.6s 0.7s ease-out both; }
        .float-e4    { animation: float-up 1.9s 0.4s ease-out both; }
        .progress-fill { animation: progress-fill 3.0s 0.6s linear both; }
        .fade-up-1 { animation: fade-in 0.5s 0.4s both, slide-in-from-bottom 0.5s 0.4s both; }
        .fade-up-2 { animation: fade-in 0.5s 0.6s both, slide-in-from-bottom 0.5s 0.6s both; }
      `}</style>

      {/* Icon with pulse rings */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="ring-1 absolute w-36 h-36 rounded-full bg-primary" />
        <div className="ring-2 absolute w-36 h-36 rounded-full bg-primary" />
        <div className="done-icon relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-2xl shadow-primary/30">
          <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-3 mb-12">
        <h1 className="fade-up-1 text-2xl font-bold text-slate-900 dark:text-white">
          Tất cả đã sẵn sàng{userName ? `, ${userName.split(' ').at(-1)}` : ''}! 🚀
        </h1>
        <p className="fade-up-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Feed của bạn đã được cá nhân hóa.<br />Đang chuyển hướng...
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-52 h-0.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div className="progress-fill h-full rounded-full bg-gradient-to-r from-primary to-accent-purple" />
      </div>
    </div>
  );
}

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [data, setData] = useState<OnboardingData>({
    occupation: null,
    interestedCategories: [],
  });

  const handleSkip = () => {
    startTransition(async () => {
      await skipOnboardingAction();
      await update({ onboardingDone: true });
      window.location.href = '/';
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      await completeOnboardingAction({
        occupation: data.occupation ?? Occupation.OTHER,
        interestedCategories: data.interestedCategories,
      });
      await update({ onboardingDone: true });
      setStep('done');
    });
  };

  if (step === 'done') {
    return <DoneScreen userName={userName} />;
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-10">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              step > s  ? 'bg-primary text-white' :
              step === s ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-slate-100 dark:bg-white/10 text-slate-400'
            }`}>
              {step > s ? '✓' : s}
            </div>
            {s < 2 && (
              <div className="flex-1 h-0.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className={`h-full bg-primary transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <StepOccupation
          value={data.occupation}
          onChange={v => setData(d => ({ ...d, occupation: v }))}
          onNext={() => setStep(2)}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}

      {step === 2 && (
        <StepCategories
          value={data.interestedCategories}
          onChange={v => setData(d => ({ ...d, interestedCategories: v }))}
          onBack={() => setStep(1)}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}
    </div>
  );
}
