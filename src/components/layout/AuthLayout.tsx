import React from "react";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Background glow effects — hidden on mobile for performance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none z-0 hidden md:block">
        <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] mix-blend-screen"></div>
        <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-accent-purple/20 rounded-full blur-[80px] mix-blend-screen"></div>
      </div>
      
      <AuthHeader />
      
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full">
        {children}
      </main>
      
      <AuthFooter />
    </>
  );
}
