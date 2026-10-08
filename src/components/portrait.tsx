/** Portrait par défaut quand la famille n'a pas encore choisi de photo. */
export function Portrait({ variant = "femme", className = "" }: { variant?: "femme" | "homme"; className?: string }) {
  if (variant === "homme") {
    return (
      <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
        <rect width="200" height="200" fill="#C9D3CF" />
        <path d="M36 200 C42 150 70 136 100 136 C130 136 158 150 164 200Z" fill="#EDE6D6" />
        <path d="M85 118 h30 v22 c-6 6 -24 6 -30 0z" fill="#5A3822" />
        <ellipse cx="100" cy="98" rx="28" ry="33" fill="#6A4128" />
        <ellipse cx="100" cy="70" rx="58" ry="12" fill="#C9A45C" />
        <path d="M70 70 C70 40 130 40 130 70Z" fill="#D8B66E" />
        <path d="M72 64 h56" stroke="#7A3A2A" strokeWidth="5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <rect width="200" height="200" fill="#D9C3A0" />
      <circle cx="160" cy="40" r="60" fill="#E6D3B2" />
      <path d="M34 200 C40 150 68 134 100 134 C132 134 160 150 166 200Z" fill="#2F3E4E" />
      <path d="M84 120 h32 v22 c-6 6 -26 6 -32 0z" fill="#6E4428" />
      <ellipse cx="100" cy="96" rx="29" ry="34" fill="#7A4E2E" />
      <path d="M66 94 C62 58 86 44 102 46 C128 48 142 66 136 94 C126 76 114 70 100 70 C86 70 74 78 66 94Z" fill="#A83A2A" />
      <path d="M70 80 C84 64 118 62 132 78" stroke="#E0A83A" strokeWidth="3" fill="none" />
      <path d="M126 52 c14 -10 26 -2 20 10 c-6 10 -18 4 -20 -10z" fill="#A83A2A" />
      <circle cx="71" cy="106" r="4" fill="#E0A83A" />
      <circle cx="129" cy="106" r="4" fill="#E0A83A" />
    </svg>
  );
}

/** Image de remplacement en attendant les vraies photos de la famille. */
export function PhotoPlaceholder({ label, tone = 0 }: { label: string; tone?: number }) {
  const tones = ["bg-green-soft", "bg-amber-soft", "bg-rule"];
  return (
    <div className={`${tones[tone % tones.length]} flex aspect-square w-full items-end p-2 font-mono text-[10px] tracking-wider text-ink-2 uppercase`}>
      {label}
    </div>
  );
}
