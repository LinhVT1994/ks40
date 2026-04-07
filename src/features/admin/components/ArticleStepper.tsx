"use client";

import React from 'react';
import { Check } from 'lucide-react';

const steps = [
  { number: 1, label: 'Thông tin' },
  { number: 2, label: 'Nội dung' },
  { number: 3, label: 'Chia sẻ' },
];

interface StepperProps {
  currentStep: number;
}

export default function ArticleStepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center gap-0 px-8 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 shrink-0">
      {steps.map((step, i) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-3">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isDone
                  ? 'bg-primary text-white'
                  : isActive
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-2 border-slate-200 dark:border-white/10'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : step.number}
              </div>
              {/* Label */}
              <span className={`text-sm font-bold transition-colors ${
                isActive ? 'text-slate-900 dark:text-white' : isDone ? 'text-primary' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-6 transition-colors max-w-24 ${
                currentStep > step.number ? 'bg-primary/40' : 'bg-slate-200 dark:bg-white/10'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
