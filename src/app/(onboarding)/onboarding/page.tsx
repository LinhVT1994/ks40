import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OnboardingWizard from '@/features/onboarding/components/OnboardingWizard';

export default async function OnboardingPage() {
  const session = await auth();
  const onboardingDone = (session?.user as { onboardingDone?: boolean })?.onboardingDone;

  // if (onboardingDone) redirect('/');

  return (
    <OnboardingWizard userName={session?.user?.name ?? undefined} />
  );
}
