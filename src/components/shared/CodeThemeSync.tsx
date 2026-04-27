'use client';

import { useEffect } from 'react';

export default function CodeThemeSync({ codeTheme }: { codeTheme: string | null }) {
  useEffect(() => {
    if (!codeTheme) return;
    if (localStorage.getItem('ks-code-theme') === codeTheme) return;
    localStorage.setItem('ks-code-theme', codeTheme);
    window.dispatchEvent(new CustomEvent('code-theme-changed', { detail: codeTheme }));
  }, [codeTheme]);

  return null;
}
