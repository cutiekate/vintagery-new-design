import { create } from "zustand";
import { getRecordPlayer, type Track } from "@/lib/record-player";

interface PlayerStore {
  playing: boolean;
  /** The record on the platter; null until the player is first used. */
  track: Track | null;
  /** Must be called from a click or tap: browsers only allow audio after a user gesture. */
  toggle: () => Promise<void>;
  stop: () => void;
  next: () => void;
}

/** Create the player on first use and mirror its track changes into the store. */
function player(set: (state: Partial<PlayerStore>) => void) {
  const p = getRecordPlayer();
  if (!p.onTrackChange) {
    p.onTrackChange = (track) => set({ track });
    set({ track: p.track });
  }
  return p;
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  playing: false,
  track: null,
  toggle: async () => {
    if (get().playing) {
      get().stop();
      return;
    }
    set({ playing: true });
    try {
      await player(set).start();
    } catch (error) {
      console.error("Could not start the record:", error);
      set({ playing: false });
    }
  },
  stop: () => {
    if (!get().playing) return;
    player(set).stop();
    set({ playing: false });
  },
  next: () => player(set).next(),
}));
