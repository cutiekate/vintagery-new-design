/**
 * Lava-lamp backdrop: warm, pearly blobs drift up and down and melt into each other.
 * The "goo" SVG filter blurs the blobs and then sharpens their alpha, so touching blobs
 * fuse like wax instead of overlapping. Purely decorative; place it inside a relative parent.
 */
const BLOBS = [
  // left %, size (vmax), colour, duration s, delay s
  { left: 4, size: 18, color: "var(--mustard)", dur: 26, delay: -4 },
  { left: 18, size: 11, color: "var(--sunset)", dur: 19, delay: -12 },
  { left: 30, size: 15, color: "var(--primary)", dur: 31, delay: -20 },
  { left: 46, size: 9, color: "var(--mustard)", dur: 17, delay: -7 },
  { left: 60, size: 14, color: "var(--sunset)", dur: 28, delay: -15 },
  { left: 76, size: 20, color: "var(--mustard)", dur: 34, delay: -25 },
  { left: 88, size: 10, color: "var(--primary)", dur: 22, delay: -2 },
];

/** Offsets a blob's pearly shimmer (read by the `lava-pearl` utility). */
const pearlDelay = (seconds: number) => ({ "--pearl-delay": `${seconds}s` }) as React.CSSProperties;

export function LavaLamp({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <svg width="0" height="0" className="absolute">
        <filter id="lava-goo">
          {/* Blur, then sharpen the alpha so touching blobs fuse; draw the crisp blobs back on
              top so the pearly sheen and glints stay sharp inside the fused shape. */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="blur" />
          <feColorMatrix
            in="blur"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      <div className="lava-goo absolute inset-0">
        {/* Wax pools at the bottom and top of the "lamp" that rising blobs merge into */}
        <div className="absolute -bottom-[14vmax] left-[-10%] h-[22vmax] w-[120%] rounded-[50%] bg-primary">
          <div className="lava-pearl" />
        </div>
        <div className="absolute -top-[18vmax] left-[10%] h-[22vmax] w-[80%] rounded-[50%] bg-mustard">
          <div className="lava-pearl" style={pearlDelay(-8)} />
        </div>
        {BLOBS.map((b, i) => (
          <div
            key={i}
            className="lava-blob absolute rounded-full"
            style={{
              left: `${b.left}%`,
              bottom: 0,
              width: `${b.size}vmax`,
              height: `${b.size}vmax`,
              background: b.color,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          >
            {/* Each blob's sheen starts at a different angle so they don't shimmer in step */}
            <div className="lava-pearl" style={pearlDelay(-i * 2.3)} />
          </div>
        ))}
        <div className="lava-grain absolute inset-0" />
      </div>
    </div>
  );
}
