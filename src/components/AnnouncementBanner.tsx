'use client';

import { useEffect, useState } from 'react';
import { X, Wrench, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SiteAnnouncement } from '@/features/admin/actions/config';

const TYPE_CFG = {
  maintenance: {
    icon: Wrench,
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'Bảo trì hệ thống',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-orange-500',
    text: 'text-white',
    label: 'Cảnh báo',
  },
  info: {
    icon: Info,
    bg: 'bg-primary',
    text: 'text-white',
    label: 'Thông báo',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500',
    text: 'text-white',
    label: 'Thông báo',
  },
};

const DISMISS_KEY = 'announcement_dismissed';

export default function AnnouncementBanner({ announcement }: { announcement: SiteAnnouncement }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Kiểm tra xem user đã dismiss thông báo này chưa (dùng message làm key)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed !== announcement.message) {
      setVisible(true);
    }
  }, [announcement.message]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, announcement.message);
    setVisible(false);
  };

  if (!visible) return null;

  const cfg = TYPE_CFG[announcement.type] ?? TYPE_CFG.info;
  const Icon = cfg.icon;

  return (
    <div className={`w-full ${cfg.bg} ${cfg.text} relative z-50`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0 opacity-90" />
        <p className="flex-1 text-sm font-medium text-center">
          <span className="font-bold">{cfg.label}:</span> {announcement.message}
          {announcement.expiresAt && (
            <span className="opacity-75 ml-2 text-xs">
              (đến {new Date(announcement.expiresAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })})
            </span>
          )}
        </p>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
