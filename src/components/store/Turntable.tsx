import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { getRecordPlayer } from "@/lib/record-player";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";

const RPM_DEG_PER_SEC = (100 / 3 / 60) * 360; // 33⅓ rpm

/*
 * Layout is drawn in a 400 × 300 frame (the plinth's 4:3 box); HTML parts are placed with
 * percentages of it and the tonearm SVG uses the same viewBox, so they line up.
 *   platter: centre (140, 150), radius 118 — the record fills 91.6% of it (radius ≈ 108)
 *   tonearm pivot: (330, 62); stylus at rest (316, 214), off the record
 *   playing angle 38° puts the stylus ≈ 88 from the centre: on the outer grooves
 */
const ARM_PLAY_DEG = 38;

const WOOD =
  "linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent 30%, rgb(0 0 0 / 0.28)), " +
  "repeating-linear-gradient(88deg, #6e4124 0 5px, #5c341c 5px 8px, #7a4a2b 8px 14px, #4e2a15 14px 16px, #66401f 16px 23px)";
const BRUSHED_ALUMINIUM =
  "linear-gradient(160deg, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0) 35%, rgb(0 0 0 / 0.08) 70%, rgb(255 255 255 / 0.3)), " +
  "repeating-linear-gradient(0deg, #d8d3c9 0 1px, #cbc6bb 1px 2px)";
// Strobe dots on the platter rim: on a real deck they "stand still" under mains light at speed.
const STROBE_RIM = "repeating-conic-gradient(#3b3532 0 1.5deg, #dcd7ce 1.5deg 3.6deg)";
const GROOVES =
  // Silent bands between tracks catch the light as thin rings.
  "radial-gradient(circle closest-side, transparent 0 52%, rgb(255 255 255 / 0.09) 52% 52.8%, transparent 53% 68%, rgb(255 255 255 / 0.09) 68% 68.8%, transparent 69% 84%, rgb(255 255 255 / 0.09) 84% 84.8%, transparent 85% 96%, #0b0807 96%), " +
  "repeating-radial-gradient(circle, #151110 0 1px, #241c19 1px 2.2px)";
// Light glancing off the vinyl — it stays put while the record turns underneath.
const SHEEN =
  "conic-gradient(from 25deg, transparent 0deg, rgb(255 255 255 / 0.2) 22deg, transparent 50deg, transparent 180deg, rgb(255 255 255 / 0.12) 202deg, transparent 232deg)";

/**
 * A 70s-style turntable: walnut plinth, brushed-aluminium deck, strobe-dotted platter,
 * S-shaped tonearm with counterweight, start/stop knob and a pilot light. The record can be
 * played and grabbed; a requestAnimationFrame loop drives the platter so it spins up, coasts
 * down and follows the hand.
 */
export function Turntable() {
  const playing = usePlayerStore((s) => s.playing);
  const toggle = usePlayerStore((s) => s.toggle);
  const platterRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const drag = useRef({ active: false, pointerAngle: 0, delta: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = 0;
    let speed = 0; // degrees per second
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const d = drag.current;
      if (d.active) {
        angle += d.delta;
        if (playingRef.current) getRecordPlayer().scratch(d.delta);
        d.delta = 0;
        speed = 0;
      } else {
        const target = playingRef.current && !reduceMotion ? RPM_DEG_PER_SEC : 0;
        // A real platter takes a moment to reach speed and to coast to a stop.
        speed += (target - speed) * Math.min(1, dt * (target > speed ? 1.8 : 1.2));
        angle += speed * dt;
      }
      if (platterRef.current) platterRef.current.style.transform = `rotate(${angle % 360}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const pointerAngle = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, pointerAngle: pointerAngle(e), delta: 0 };
    if (playing) getRecordPlayer().hold(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const a = pointerAngle(e);
    let delta = a - d.pointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.delta += delta;
    d.pointerAngle = a;
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (playing) {
      getRecordPlayer().scratch(0);
      getRecordPlayer().hold(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-lg select-none pb-3">
      {/* Walnut plinth */}
      <div
        className="@container relative aspect-[4/3] w-full rounded-[20px] border-4 border-ink shadow-card"
        style={{ background: WOOD }}
      >
        {/* Printed text is sized in cqw (% of the plinth's width) so it scales with the deck */}
        {/* Brushed-aluminium deck */}
        <div
          className="absolute inset-[3.5%] rounded-[10px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25),inset_0_2px_0_rgb(255_255_255/0.6)]"
          style={{ background: BRUSHED_ALUMINIUM }}
        />

        {/* Platter — strobe rim, rubber mat, record; drag it to spin and scratch */}
        <div
          ref={platterRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="Вінілова платівка Vintagery — її можна крутити"
          className="absolute left-[5.5%] top-[10.67%] aspect-square w-[59%] cursor-grab touch-none rounded-full shadow-[0_4px_8px_rgb(0_0_0/0.35),inset_0_0_0_1px_rgb(0_0_0/0.4)] active:cursor-grabbing"
          style={{ background: STROBE_RIM }}
        >
          <div className="absolute inset-[3%] rounded-full bg-[#1a1614]" />
          <div
            className="absolute inset-[4.2%] rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
            style={{ background: GROOVES }}
          >
            {/* Label: lettering curved around the edge, the shop's rainbow arch above the
                spindle hole — nothing crosses the centre */}
            <div className="absolute inset-[33%] rounded-full">
              <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
                <defs>
                  <path id="tt-label-top" d="M 17.1 62 A 35 35 0 1 1 82.9 62" />
                  <path id="tt-label-bottom" d="M 9 50 A 41 41 0 0 0 91 50" />
                </defs>
                <circle cx="50" cy="50" r="50" className="fill-mustard" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="0.8"
                />
                <text
                  className="fill-ink font-sans"
                  fontSize="8.5"
                  fontWeight="700"
                  letterSpacing="1.6"
                >
                  <textPath href="#tt-label-top" startOffset="50%" textAnchor="middle">
                    VINTAGERY RECORDS
                  </textPath>
                </text>
                <text
                  className="fill-ink font-sans"
                  fontSize="6.5"
                  fontWeight="600"
                  letterSpacing="1.4"
                >
                  <textPath href="#tt-label-bottom" startOffset="50%" textAnchor="middle">
                    SIDE A · 33⅓ RPM
                  </textPath>
                </text>
                {/* Mini rainbow arch, as in the logo */}
                {[
                  [13, "stroke-ink"],
                  [9.5, "stroke-primary"],
                  [6, "stroke-sunset"],
                ].map(([r, cls]) => (
                  <path
                    key={r}
                    d={`M ${50 - Number(r)} 41 A ${r} ${r} 0 0 1 ${50 + Number(r)} 41`}
                    fill="none"
                    className={String(cls)}
                    strokeWidth="2.6"
                  />
                ))}
                <path
                  d="M 24 50 H 42 M 58 50 H 76"
                  className="stroke-ink"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              </svg>
              {/* Spindle */}
              <span className="absolute left-1/2 top-1/2 h-[9%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff,#a9a49b)] shadow-[0_1px_1px_rgb(0_0_0/0.5)]" />
            </div>
          </div>
        </div>
        {/* Sheen stays still over the turning record */}
        <div
          className="pointer-events-none absolute left-[8%] top-[14%] aspect-square w-[54%] rounded-full"
          style={{ background: SHEEN }}
        />

        {/* Tonearm, arm rest and cue lever */}
        <svg
          viewBox="0 0 400 300"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="tt-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f6f4ef" />
              <stop offset="0.5" stopColor="#b5b0a6" />
              <stop offset="1" stopColor="#ebe8e2" />
            </linearGradient>
            <radialGradient id="tt-base" cx="0.35" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#fbfaf7" />
              <stop offset="1" stopColor="#9d988f" />
            </radialGradient>
          </defs>
          {/* Arm rest */}
          <rect x="333" y="186" width="8" height="22" rx="2" fill="#3a3430" />
          <path d="M326 188 h22" stroke="#3a3430" strokeWidth="4" strokeLinecap="round" />
          {/* Cue lever */}
          <rect
            x="356"
            y="104"
            width="10"
            height="34"
            rx="3"
            fill="url(#tt-metal)"
            stroke="#7d786f"
          />
          <circle cx="361" cy="104" r="6" fill="#2b2724" />
          {/* Pivot base */}
          <circle cx="330" cy="62" r="26" fill="url(#tt-base)" stroke="#7d786f" strokeWidth="1.5" />
          <circle cx="330" cy="62" r="14" fill="#2b2724" />
          {/* Swinging arm: counterweight, S-tube, headshell with cartridge */}
          <g
            style={{
              transformOrigin: "330px 62px",
              transform: `rotate(${playing ? ARM_PLAY_DEG : 0}deg)`,
              transition: "transform 1.2s ease-in-out",
            }}
          >
            <rect x="317" y="14" width="26" height="28" rx="5" fill="#2b2724" />
            <path d="M317 22 h26 M317 30 h26" stroke="#4a4440" strokeWidth="1.5" />
            <rect x="327" y="40" width="6" height="16" fill="url(#tt-metal)" />
            <path
              d="M330 62 L330 150 C330 172 336 180 326 198"
              fill="none"
              stroke="url(#tt-metal)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <g transform="rotate(22 320 208)">
              <rect x="311" y="196" width="18" height="24" rx="3" fill="#2b2724" />
              <rect x="314" y="208" width="12" height="9" rx="1.5" className="fill-mustard" />
              <path
                d="M329 199 l9 -3"
                stroke="url(#tt-metal)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <circle cx="330" cy="62" r="6" fill="url(#tt-base)" />
          </g>
        </svg>

        {/* Deck controls: maker's badge, pilot light, start/stop */}
        <div className="pointer-events-none absolute left-[66%] top-[77%] flex w-[14%] flex-col items-center rounded-[3px] border border-[#8f897f] bg-[linear-gradient(180deg,#f3f0ea,#cfcac0)] py-[0.6cqw] text-[#4a443d] shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_1px_rgb(0_0_0/0.25)] [text-shadow:0_1px_0_rgb(255_255_255/0.7)]">
          <span className="font-script text-[2.5cqw] leading-none">Vintagery</span>
          <span className="mt-[0.4cqw] text-[1.1cqw] font-semibold uppercase leading-none tracking-[0.2em]">
            Stereo · 33⅓
          </span>
        </div>
        <span
          className={cn(
            "absolute left-[80.5%] top-[83%] aspect-square w-[2.2%] rounded-full transition-all duration-500",
            playing
              ? "bg-[#ff4b2b] shadow-[0_0_6px_2px_rgb(255_75_43/0.7)]"
              : "bg-[#6b2f25] shadow-[inset_0_1px_1px_rgb(0_0_0/0.5)]",
          )}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? "Зупинити музику" : "Увімкнути музику"}
          className="absolute left-[83%] top-[78%] flex aspect-square w-[10%] min-w-10 items-center justify-center rounded-full border-2 border-[#5d564e] bg-[radial-gradient(circle_at_35%_30%,#fffdf8,#bdb7ad)] text-ink shadow-[0_3px_0_#5d564e] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#5d564e]"
        >
          {playing ? <Pause className="h-1/2 w-1/2" /> : <Play className="ml-[6%] h-1/2 w-1/2" />}
        </button>
      </div>

      {/* Feet */}
      <span className="absolute bottom-0 left-[9%] h-3 w-[13%] rounded-b-lg bg-ink" aria-hidden />
      <span className="absolute bottom-0 right-[9%] h-3 w-[13%] rounded-b-lg bg-ink" aria-hidden />
    </div>
  );
}
