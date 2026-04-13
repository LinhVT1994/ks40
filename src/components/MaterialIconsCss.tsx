'use client';

import { useEffect } from 'react';

/**
 * Lazy-load Material Icons stylesheet sau hydration để KHÔNG block render.
 * Trước đây <link> được đặt trong <head> của RootLayout → render-blocking,
 * gây hỏng LCP (Core Web Vital). Component này load stylesheet sau khi
 * page interactive — icons xuất hiện chậm hơn vài chục ms nhưng các trang
 * dùng (forgot password, privacy, terms) đều không phải hot path.
 */
export default function MaterialIconsCss() {
  useEffect(() => {
    const ID = 'material-icons-css';
    if (document.getElementById(ID)) return;
    const link = document.createElement('link');
    link.id   = ID;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }, []);
  return null;
}
