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
    <div className={`max-w-[1280px] mx-auto w-full p-4 md:p-8 pb-20 ${className}`}>
      {children}
    </div>
  );
}
