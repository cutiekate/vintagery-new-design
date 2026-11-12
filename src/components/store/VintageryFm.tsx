import { Pause, Play, SkipForward } from "lucide-react";
import { TRACKS } from "@/lib/record-player";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { Turntable } from "./Turntable";

const EQ_DELAYS = [0, -0.35, -0.6, -0.15, -0.45];

/** Dark "radio" band on the homepage with the playable turntable. */
export function VintageryFm() {
  const playing = usePlayerStore((s) => s.playing);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const track = usePlayerStore((s) => s.track);

  return (
    <section id="fm" className="relative overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:grid-cols-[1fr_1.15fr] md:px-10 md:py-28">
        <div>
          <p className="eyebrow inline-block rounded-full bg-mustard px-4 py-2 text-mustard-foreground">
            Vintagery FM
          </p>
          <h2 className="mt-3 text-4xl leading-[1.05] text-paper md:text-5xl">
            Поставте <em className="text-mustard">платівку</em>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-paper/75">
            Добірка гітарного року в дусі 60-х і 70-х, поки гортаєте каталог. Платівку можна взяти
            рукою й покрутити — спробуйте поскретчити.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <button
              type="button"
              onClick={() => void toggle()}
              className="eyebrow inline-flex h-14 items-center gap-3 rounded-full bg-mustard px-8 text-ink shadow-[6px_6px_0_0_var(--primary)] transition-all hover:-translate-y-0.5 hover:bg-sunset"
            >
              {playing ? (
                <>
                  <Pause className="h-4 w-4" /> Пауза
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Грати
                </>
              )}
            </button>
            <div className="flex h-9 items-end gap-1.5" aria-hidden>
              {EQ_DELAYS.map((delay, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-full w-1.5 rounded-full bg-sunset transition-transform",
                    playing ? "eq-bar" : "scale-y-[0.2]",
                  )}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <p className="min-w-0 text-sm text-paper/70" aria-live="polite">
              {track ? (
                <>
                  <span className="eyebrow mr-2 text-[0.6rem] text-mustard">Зараз грає</span>
                  {track.title} — {track.artist}
                </>
              ) : (
                <span className="text-paper/50">{TRACKS.length} платівки в добірці</span>
              )}
            </p>
            <button
              type="button"
              onClick={next}
              disabled={!playing}
              aria-label="Наступний трек"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-paper/30 text-paper transition-colors hover:border-mustard hover:text-mustard disabled:opacity-30"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Turntable />
      </div>
    </section>
  );
}
