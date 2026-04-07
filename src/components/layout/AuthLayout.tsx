import React from "react";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent-purple/20 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      <AuthHeader />
      
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full">
        {children}
      </main>
      
      <AuthFooter />
    </>
  );
}
