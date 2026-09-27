'use client';

import React from 'react';

export default function MemberContainer({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[1320px] 2xl:max-w-[1440px] mx-auto w-full p-4 md:px-8 md:py-6 pb-20 ${className}`}>
      {children}
    </div>
  );
}
