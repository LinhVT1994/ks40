'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  completeOnboardingAction,
  skipOnboardingAction,
  getOccupationOptionsAction,
} from '@/features/onboarding/actions/onboarding';
import type { OccupationOption } from '@/features/onboarding/actions/onboarding';
import { getEnabledTopicsAction } from '@/features/admin/actions/topic';
import type { TopicItem } from '@/features/admin/actions/topic';
import StepOccupation from './StepOccupation';
import StepCategories from './StepCategories';

export type OnboardingData = {
  occupation: string | null;
  interestedTopics: string[];
};

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [occupationOptions, setOccupationOptions] = useState<OccupationOption[]>([]);
  const [data, setData] = useState<OnboardingData>({
    occupation: null,
    interestedTopics: [],
  });

  useEffect(() => {
    getEnabledTopicsAction().then(setTopics);
    getOccupationOptionsAction().then(setOccupationOptions);
  }, []);

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
          occupation: data.occupation ?? 'OTHER',
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
    <div className="w-full max-w-xl mx-auto px-4 relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-primary/5"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
            </div>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-white"
            >
              Đang kiến tạo tri thức...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left-Aligned Compact Segmented Progress Line */}
      <div className="flex gap-1 mb-6 px-2">
        {[1, 2].map((s) => (
          <div 
            key={s} 
            className="w-8 h-[2px] bg-zinc-100 dark:bg-white/5 overflow-hidden rounded-full"
          >
            <motion.div 
              initial={false}
              animate={{ width: step >= s ? '100%' : '0%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-zinc-900 dark:bg-white"
            />
          </div>
        ))}
      </div>

      {/* Step Transition Animation */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <StepOccupation
                value={data.occupation}
                onChange={v => setData(d => ({ ...d, occupation: v }))}
                onNext={() => setStep(2)}
                onSkip={handleSkip}
                isPending={isPending}
                options={occupationOptions}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <StepCategories
                value={data.interestedTopics}
                onChange={v => setData(d => ({ ...d, interestedTopics: v }))}
                onBack={() => setStep(1)}
                onComplete={handleComplete}
                onSkip={handleSkip}
                isPending={isPending}
                topics={topics}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
