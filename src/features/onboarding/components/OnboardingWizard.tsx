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
import BrandLogo from "@/components/shared/BrandLogo";
import SuccessScreen from './SuccessScreen';

export type OnboardingData = {
  occupation: string | null;
  interestedTopics: string[];
};

export default function OnboardingWizard({ userName }: { userName?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
        // Run the completion action and a minimum delay in parallel
        await Promise.all([
          completeOnboardingAction({
            occupation: data.occupation ?? 'OTHER',
            interestedTopics: data.interestedTopics,
          }),
          new Promise(resolve => setTimeout(resolve, 2500)) // Min 2.5s delay
        ]);
        
        await update({ onboardingDone: true });
        setStep(3);
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 relative min-h-[600px]">
      {/* Conditional Header - Hidden on Success Step and Mobile */}
      {step < 3 && (
        <div className="hidden sm:flex mb-14 flex-col items-center gap-4 text-center relative z-10">
          <BrandLogo size={48} />
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-zinc-800 dark:text-white">Lenote</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isPending && step < 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-3xl overflow-hidden"
          >
            {/* Animated Glow Background - Full Screen */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <motion.div 
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.15, 0.3, 0.15]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/30 blur-[160px] rounded-full"
              />
            </div>

            <div className="relative flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [0.9, 1, 0.9],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <BrandLogo size={70} />
                </motion.div>
                
                {/* Pulsing Neutral Ring - Visible on Mobile to show life */}
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-6 border-1 border-zinc-200 dark:border-white/30 rounded-full" 
                />
              </div>

              <div className="mt-12 space-y-4 text-center px-6">
                <motion.p 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[12px] font-black uppercase tracking-[0.4em] text-primary"
                >
                  Vui lòng đợi
                </motion.p>
                <div className="flex flex-col items-center gap-3">
                  <h2 className="text-2xl text-zinc-800 dark:text-white tracking-wide font-medium">
                    Đang kiến tạo tri thức...
                  </h2>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left-Aligned Compact Segmented Progress Line - Hidden on Success Step */}
      {step < 3 && (
        <div className="flex gap-1 mb-6 px-2">
          {[1, 2, 3].map((s) => (
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
      )}

      {/* Step Transition Animation - Restored mode="wait" to prevent layout flashing */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={true}>
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepOccupation 
                value={data.occupation}
                onChange={(v) => setData(prev => ({ ...prev, occupation: v }))}
                onNext={() => setStep(2)}
                onSkip={() => setStep(2)}
                isPending={isPending}
                options={occupationOptions}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepCategories 
                value={data.interestedTopics}
                onChange={(v) => setData(prev => ({ ...prev, interestedTopics: v }))}
                onBack={() => setStep(1)}
                onComplete={handleComplete}
                onSkip={handleComplete}
                isPending={isPending}
                topics={topics}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SuccessScreen userName={userName} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
