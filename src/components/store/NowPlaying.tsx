import { usePlayerStore } from "@/stores/playerStore";
import { VinylRecord } from "./VinylRecord";

/** Floating pill shown while a record plays, so it can be stopped from any page. */
export function NowPlaying() {
  const playing = usePlayerStore((s) => s.playing);
  const stop = usePlayerStore((s) => s.stop);
  const track = usePlayerStore((s) => s.track);
  if (!playing) return null;
  return (
    <button
      type="button"
      onClick={stop}
      className="fixed bottom-4 left-4 z-40 flex animate-rise items-center gap-3 rounded-full border-2 border-ink bg-paper py-2 pl-2 pr-5 shadow-card transition-transform hover:-translate-y-0.5"
      aria-label="Зупинити музику"
    >
      <VinylRecord className="vinyl-turn h-9 w-9" />
      <span className="text-left leading-tight">
        <span className="eyebrow block max-w-48 truncate text-[0.55rem] text-muted-foreground">
          {track ? track.title : "Vintagery FM"}
        </span>
        <span className="text-sm font-semibold">Зупинити музику</span>
      </span>
    </button>
  );
}
