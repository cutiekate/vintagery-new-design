/** A tiny record icon: black disc, grooves, a rust label with a spindle hole. */
export function VinylRecord({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" className="fill-ink" />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />
      <circle cx="12" cy="12" r="4.2" className="fill-primary" />
      {/* Off-centre highlight so the spin reads at icon size */}
      <path
        d="M12 2.5a9.5 9.5 0 0 1 8.2 4.7"
        fill="none"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1" className="fill-mustard" />
    </svg>
  );
}
