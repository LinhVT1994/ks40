import { BookOpen } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export default function BrandLogo({ className = '', size = 32 }: BrandLogoProps) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand text-white ${className}`}
      style={{ width: size, height: size }}>
      <BookOpen size={Math.round(size * 0.55)} strokeWidth={1.7} />
    </span>
  );
}
