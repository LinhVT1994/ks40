type BookBuddyProps = {
  mood?: 'wave' | 'search' | 'lost' | 'grow';
  className?: string;
};

/**
 * "Nốt" — Lenote's mascot: a little walking note with a folded corner and a
 * springy hair strand. Flat, filled shapes. Decorative; nearby text carries the meaning.
 */
export default function BookBuddy({ mood = 'wave', className = '' }: BookBuddyProps) {
  const body = 'var(--color-primary)';
  const bodyShade = 'color-mix(in srgb, var(--color-primary) 78%, #1a1410)';
  const fold = 'color-mix(in srgb, var(--color-primary) 45%, #fff7ee)';
  const face = '#fff8f0';
  const ink = '#2a211c';
  const blush = '#f0a58f';
  const leaf = '#7aa06a';
  const waving = mood === 'wave' || mood === 'grow';

  return (
    <svg viewBox="0 0 180 160" fill="none" aria-hidden="true" focusable="false"
      className={`ui-book-buddy ${className}`}
      strokeLinecap="round" strokeLinejoin="round">
      {/* Ground shadow */}
      <ellipse cx="90" cy="148" rx="34" ry="4.5" fill={body} opacity="0.14" />

      {/* Feet */}
      <ellipse cx="77" cy="141" rx="9" ry="5" fill={bodyShade} />
      <ellipse cx="103" cy="141" rx="9" ry="5" fill={bodyShade} />

      {/* Resting arm (left) */}
      <path d="M58 96q-14 4-14 17" stroke={bodyShade} strokeWidth="7" />

      {/* Free arm (right) */}
      {waving ? (
        <g className="ui-book-buddy-wave">
          <path d="M122 94q16-6 18-24" stroke={bodyShade} strokeWidth="7" />
          <path d="M149 58l5-5m-2 15 7-1" stroke={body} strokeWidth="2.2" opacity="0.55" />
        </g>
      ) : mood === 'search' ? (
        <g>
          <path d="M122 98q12 1 14 12" stroke={bodyShade} strokeWidth="7" />
          <path d="m147 111 11 12" stroke={bodyShade} strokeWidth="5" />
          <circle cx="140" cy="103" r="12" fill={face} fillOpacity="0.9" stroke={bodyShade} strokeWidth="3.2" />
          <path d="M133 99q3-4 8-4" stroke={blush} strokeWidth="2" />
        </g>
      ) : (
        <path d="M122 96q14 4 14 17" stroke={bodyShade} strokeWidth="7" />
      )}

      <g className="ui-book-buddy-cover">
        {/* Body: a soft note with the top-right corner folded down */}
        <path d="M68 38h38l20 20v58q0 18-18 18H70q-18 0-18-18V56q0-18 16-18Z" fill={body} />
        <path d="M106 38v12q0 8 8 8h12Z" fill={fold} />

        {/* Single springy hair strand */}
        {mood !== 'grow' && <path d="M84 39q-3-9 3-15 5-4 9-1" stroke={bodyShade} strokeWidth="3.4" />}

        {/* Face panel */}
        <ellipse cx="88" cy="82" rx="27" ry="23" fill={face} />
        <ellipse cx="79" cy="80" rx="4.2" ry={mood === 'lost' ? 4.2 : 5.2} fill={ink} />
        <ellipse cx="97" cy="80" rx="4.2" ry={mood === 'lost' ? 4.2 : 5.2} fill={ink} />
        <circle cx="80.6" cy="77.8" r="1.5" fill={face} />
        <circle cx="98.6" cy="77.8" r="1.5" fill={face} />
        {/* Worried brows */}
        {mood === 'lost' && <path d="M73 71l8-3m22 3-8-3" stroke={ink} strokeWidth="2.4" />}
        <ellipse cx="70" cy="90" rx="4.5" ry="2.8" fill={blush} opacity="0.7" />
        <ellipse cx="106" cy="90" rx="4.5" ry="2.8" fill={blush} opacity="0.7" />
        {mood === 'lost'
          ? <path d="M84 94q4-3 8 0" stroke={ink} strokeWidth="2.6" />
          : mood === 'search'
            ? <ellipse cx="88" cy="93" rx="2.6" ry="3" fill={ink} />
            : <path d="M82 89q6 7 12 0" fill={ink} />}

        {/* Ruled lines on the belly */}
        <path d="M66 113h44m-40 9h34" stroke={face} strokeWidth="2.4" opacity="0.45" />
      </g>

      {/* Sparkles */}
      <g fill={body} opacity="0.5">
        <path d="M34 46q1.2 5.5 6 6.5-4.8 1-6 6.5-1.2-5.5-6-6.5 4.8-1 6-6.5Z" />
        {mood !== 'grow' && <path d="M150 126q.9 3.6 4 4.3-3.1.7-4 4.3-.9-3.6-4-4.3 3.1-.7 4-4.3Z" />}
      </g>

      {mood === 'lost' && (
        <g>
          <path d="M140 30q0-9 8-9t8 8q0 5-6 8-2 1-2 6" stroke={body} strokeWidth="3.6" />
          <circle cx="148" cy="51" r="2.2" fill={body} />
          <path d="M121 60q-4 6 0 8 4-2 0-8Z" fill="#8cc4e0" />
        </g>
      )}

      {mood === 'grow' && (
        <g>
          <path d="M89 39q0-16 8-25" stroke={leaf} strokeWidth="3" />
          <path d="M97 16q-11-3-12-12 11 0 12 12Z" fill={leaf} />
          <path d="M98 14q8-7 16-3-7 8-16 3Z" fill={leaf} opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
