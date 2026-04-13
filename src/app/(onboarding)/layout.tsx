import BrandLogo from "@/components/shared/BrandLogo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4 py-20">
      <div className="mb-14 flex flex-col items-center gap-4 text-center">
        <BrandLogo size={48} />
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-zinc-800 dark:text-white">Lenote</span>
          <span className="text-2xl font-bold text-primary">.dev</span>
        </div>
      </div>
      {children}
    </div>
  );
}
