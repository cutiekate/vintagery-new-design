import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { VinylRecord } from "./VinylRecord";

/** Header control that puts the record on (or takes it off) from any page. */
export function RecordToggle({ variant }: { variant: "text" | "icon" }) {
  const playing = usePlayerStore((s) => s.playing);
  const toggle = usePlayerStore((s) => s.toggle);
  const label = playing ? "Зняти платівку" : "Поставити платівку";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={label}
        aria-pressed={playing}
        className="inline-flex h-10 w-10 items-center justify-center"
      >
        <VinylRecord className={cn("h-6 w-6", playing && "vinyl-turn")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={playing}
      className="eyebrow inline-flex items-center gap-2 transition-colors hover:text-primary"
    >
      <VinylRecord className={cn("h-4 w-4", playing && "vinyl-turn")} />
      {label}
    </button>
  );
}
