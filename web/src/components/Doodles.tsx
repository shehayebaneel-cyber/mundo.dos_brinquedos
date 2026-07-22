// Playful decorative SVGs inspired by the Zoop catalogue: squiggles, stars,
// waves and blobs with cute faces. All purely decorative (aria-hidden).
type P = { className?: string; color?: string };

export function Squiggle({ className = "", color = "currentColor" }: P) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden>
      <path d="M2 12c8-12 18-12 26 0s18 12 26 0 18-12 26 0 18 12 26 0" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function DashLoop({ className = "", color = "currentColor" }: P) {
  return (
    <svg viewBox="0 0 100 70" className={className} fill="none" aria-hidden>
      <path d="M4 10c30-14 66 2 60 30-4 20-40 22-46 6-4-12 12-20 24-14" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 9" />
    </svg>
  );
}

export function Star({ className = "", color = "currentColor" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.9 5.9 20.8l1.3-6.7-5-4.6 6.8-.8z" fill={color} />
    </svg>
  );
}

export function Wave({ className = "", color = "currentColor" }: P) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 60c180-70 360-70 540 0s360 70 540 0 260-55 360-30v90H0z" fill={color} />
    </svg>
  );
}

// A rounded blob with a cheerful face — the signature Zoop mark.
export function BlobFace({ className = "", color = "currentColor" }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M50 4c22 0 42 16 42 42 0 30-20 48-42 48S8 76 8 46 28 4 50 4z" fill={color} />
      <ellipse cx="38" cy="44" rx="6" ry="8" fill="#241f3b" />
      <ellipse cx="62" cy="44" rx="6" ry="8" fill="#241f3b" />
      <circle cx="40" cy="41" r="2" fill="#fff" />
      <circle cx="64" cy="41" r="2" fill="#fff" />
      <path d="M38 60c4 6 20 6 24 0" stroke="#241f3b" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
