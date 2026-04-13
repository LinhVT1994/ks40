"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Move, X, ImagePlus } from 'lucide-react';

interface Props {
  src: string;
  position: string;       // "50% 50%"
  onChange: (pos: string) => void;
  aspectClass?: string;   // e.g. "aspect-video" or "aspect-[4/3]"
  onClear?: () => void;
  onUpload?: () => void;
}

export default function ImagePositionPicker({
  src, position, onChange, aspectClass = 'aspect-video', onClear, onUpload,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const posToPercent = (pos: string): { x: number; y: number } => {
    const parts = pos.split(' ');
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 };
  };

  const calcPos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    onChange(`${x}% ${y}%`);
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking overlay buttons
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    e.preventDefault();
    setIsDragging(true);
    calcPos(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    calcPos(e.clientX, e.clientY);
  }, [isDragging, calcPos]);

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    setIsDragging(true);
    calcPos(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    calcPos(e.touches[0].clientX, e.touches[0].clientY);
  };

  const { x, y } = posToPercent(position);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectClass} rounded-xl overflow-hidden cursor-crosshair select-none border border-zinc-300 dark:border-white/10`}
      style={{ backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: position }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Focal point crosshair */}
      <div
        className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-white shadow-lg shadow-black/50" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-px bg-white/80" />
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-px bg-white/80" />
      </div>

      {/* Top-right action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5" data-no-drag>
        {onUpload && (
          <button
            type="button"
            onClick={onUpload}
            className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
            title="Đổi ảnh"
          >
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 bg-black/50 hover:bg-rose-500/80 backdrop-blur-sm rounded-lg text-white transition-colors"
            title="Xóa ảnh"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[10px] font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md select-none pointer-events-none">
        <Move className="w-3 h-3" />
        {isDragging ? 'Đang điều chỉnh…' : 'Kéo để chọn vùng hiển thị'}
      </div>
    </div>
  );
}
