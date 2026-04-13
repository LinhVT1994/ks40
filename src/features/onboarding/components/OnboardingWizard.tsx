'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Occupation } from '@prisma/client';
import { completeOnboardingAction, skipOnboardingAction } from '@/features/onboarding/actions/onboarding';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';
import StepOccupation from './StepOccupation';
import StepCategories from './StepCategories';

export type OnboardingData = {
  occupation: Occupation | null;
  interestedTopics: string[];
};

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [data, setData] = useState<OnboardingData>({
    occupation: null,
    interestedTopics: [],
  });

  useEffect(() => { getEnabledTopicsAction().then(setTopics); }, []);

  const handleSkip = () => {
    startTransition(async () => {
      try {
        await skipOnboardingAction();
        await update({ onboardingDone: true });
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to skip onboarding:', error);
      }
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeOnboardingAction({
          occupation: data.occupation ?? Occupation.OTHER,
          interestedTopics: data.interestedTopics,
        });
        await update({ onboardingDone: true });
        router.push('/onboarding/success');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 relative">
      {isPending && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background-light/60 dark:bg-background-dark/60 backdrop-blur-sm rounded-3xl animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-zinc-800 dark:text-white animate-pulse">
            Đang lưu cấu hình của bạn...
          </p>
        </div>
      )}

      {/* Progress */}
      <div className={`flex items-center gap-3 mb-10 transition-opacity duration-300 ${isPending ? 'opacity-20' : 'opacity-100'}`}>
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              step > s  ? 'bg-primary text-white' :
              step === s ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-zinc-100 dark:bg-white/10 text-zinc-500'
            }`}>
              {step > s ? '✓' : s}
            </div>
            {s < 2 && (
              <div className="flex-1 h-0.5 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
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
          value={data.interestedTopics}
          onChange={v => setData(d => ({ ...d, interestedTopics: v }))}
          onBack={() => setStep(1)}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isPending={isPending}
          topics={topics.filter(t => !t.parentId)}
        />
      )}
    </div>
  );
}
