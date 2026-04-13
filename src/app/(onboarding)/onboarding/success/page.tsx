import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuccessScreen from "@/features/onboarding/components/SuccessScreen";

export default async function OnboardingSuccessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[400px]">
      <SuccessScreen userName={session.user.name ?? undefined} />
    </div>
  );
}
