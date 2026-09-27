type BookBuddyProps = {
  mood?: 'wave' | 'search' | 'lost' | 'grow';
  className?: string;
};

/** Excalidraw-inspired sketch. Decorative; nearby text carries the meaning. */
export default function BookBuddy({ mood = 'wave', className = '' }: BookBuddyProps) {
  const ink = 'var(--color-primary)';
  const paper = 'var(--ui-canvas)';
  const cover = 'color-mix(in srgb, var(--color-primary) 12%, var(--ui-canvas))';
  const accent = 'var(--color-primary)';

  return (
    <svg viewBox="0 0 180 160" fill="none" aria-hidden="true" focusable="false"
      className={`ui-book-buddy ${className}`}
      strokeLinecap="round" strokeLinejoin="round">
      {/* Loose double strokes give the sketch its hand-drawn character. */}
      <g stroke={ink} strokeWidth="1.6">
        <path d="M46 145q40-3 87-1" opacity="0.22" />
        <path d="m71 125-4 15-10 1m48-17 6 15 10 1" />
        <path d="M48 82q-19 0-18 18m1-7-5 4m5-2 4 4" />
        {mood === 'wave' || mood === 'grow' ? (
          <g className="ui-book-buddy-wave">
            <path d="M129 81q24-2 20-25m0 0-6-3m6 3 3-6m-3 7 7-2" />
            <path d="M130 83q23-4 21-24" strokeWidth="0.65" opacity="0.4" />
            <path d="m156 42 4-5m-11 3 1-5" strokeWidth="1.3" />
          </g>
        ) : <path d="M129 86q19 1 17 19" />}
      </g>

      <g className="ui-book-buddy-cover">
        {/* Whiteboard-like paper, offset edges, no gradients or textures. */}
        <path d="m52 39 65-9 15 9 8 84-74 11-13-8Z" fill={paper} stroke={ink} strokeWidth="1.8" />
        <path d="m118 33 10 7 9 79-12 6Z" fill={paper} stroke={ink} strokeWidth="1.4" />
        <path d="m123 43 8 70m-4-69 8 69" stroke={ink} strokeWidth="0.85" opacity="0.5" />
        <path d="m62 121 65-9 10 9-69 10q-14 0-6-10Z" fill={paper} stroke={ink} strokeWidth="1.6" />
        <path d="m68 125 61-9m-55 12 56-9" stroke={ink} strokeWidth="0.7" opacity="0.45" />

        <path d="M52 39q33-3 65-10l8 42 6 43-66 12q-12 2-13-8l-9-64q-1-12 9-15Z"
          fill={cover} stroke={ink} strokeWidth="1.9" />
        <path d="M52 41q32-6 64-10m3 2 10 80m-1 3-64 12q-11-1-11-11l-8-62q-2-10 8-13"
          stroke={ink} strokeWidth="0.7" opacity="0.45" />
        <path d="m56 40 10 78m-8-77 9 74" stroke={ink} strokeWidth="1" opacity="0.7" />

        {/* A single muted accent, drawn as rough diagonal hatching. */}
        <g stroke={accent} strokeWidth="1.3" opacity="0.38">
          <path d="m69 105 8-8m-6 14 14-15m-6 16 10-10m-1 9 10-10m-1 9 11-11m-2 10 10-10m-1 9 8-8" />
        </g>
        <path d="m100 32 3 23 5-5 6 3-3-22" fill={paper} stroke={accent} strokeWidth="1.5" />
        <path d="m104 35 2 11m2-12 1 10" stroke={accent} strokeWidth="1" opacity="0.5" />

        <path d="m70 52 16-2m-14 8 11-2" stroke={ink} strokeWidth="1.3" opacity="0.5" />
        <ellipse cx="79" cy="77" rx="2.2" ry="3" fill={ink} transform="rotate(-8 79 77)" />
        <ellipse cx="104" cy="74" rx="2" ry="2.8" fill={ink} />
        <path d={mood === 'lost' ? 'M87 92q5-4 10-1' : 'M86 87q7 9 14-3'} stroke={ink} strokeWidth="1.7" />
        <path d="m72 86 5-1m29-3 5-1" stroke={accent} strokeWidth="2" opacity="0.5" />
      </g>

      <g stroke={accent} strokeWidth="1.3">
        <path d="m27 40 8 1m-4-6-1 11m-5-10 10 10" />
        {mood !== 'grow' && <path d="m148 119 3-7 3 7 7 3-7 2-3 7-3-7-6-2Z" />}
      </g>
      {mood === 'search' && <g stroke={ink} strokeLinecap="round">
        <path d="M119 75c9-5 20 1 22 10 3 10-5 19-15 18-10 0-17-8-15-17 1-5 3-9 8-11Z"
          fill={paper} fillOpacity="0.9" strokeWidth="1.8" />
        <path d="M119 77c8-5 19 1 20 10 1 10-6 15-14 14-10-1-15-10-10-18"
          strokeWidth="0.7" opacity="0.5" />
        <path d="m138 100 16 17-4 4-15-18" fill={paper} strokeWidth="1.7" />
        <path d="m119 88 7-7m-3 12 9-10" stroke={accent} strokeWidth="1" opacity="0.5" />
      </g>}
      {mood === 'lost' && <g stroke={ink} strokeLinecap="round">
        <path d="M140 29c-2-10 13-12 15-4 2 7-8 7-7 16" strokeWidth="1.8" />
        <path d="M142 28c-1-7 11-9 12-2" strokeWidth="0.65" opacity="0.5" />
        <path d="m149 48 .1 1" strokeWidth="2.5" />
      </g>}
      {mood === 'grow' && <g stroke={ink} strokeWidth="1.4">
        <path d="M30 139q10-20 8-41" />
        <path d="M35 125q-18-1-17-17 16 3 17 17Zm3-12q1-18 17-18-2 16-17 18Z" fill={paper} />
        <path d="m22 113 12 11m7-15 9-10" stroke={accent} />
        <path d="M24 141h15" opacity="0.35" />
      </g>}
    </svg>
  );
}
