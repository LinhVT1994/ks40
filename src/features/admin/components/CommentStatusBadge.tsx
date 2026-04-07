import React from 'react';
import { COMMENT_STATUS_CONFIG, CommentStatus } from '@/features/admin/data/comments';

interface Props {
  status: CommentStatus;
}

export default function CommentStatusBadge({ status }: Props) {
  const config = COMMENT_STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
