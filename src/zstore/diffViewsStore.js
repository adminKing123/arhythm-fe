import { create } from "zustand";

export const DIFF_VIEWS = {
  FULL_MUSIC_PLAYER: "FULL_MUSIC_PLAYER",
  FULL_MUSIC_WITH_SHORT_VIDEO: "FULL_MUSIC_WITH_SHORT_VIDEO",
};

const diffViewsStore = create((set) => ({
  view: null,
  setView: (value, callback) => {
    set({ view: value });
    callback?.();
  },
}));

export default diffViewsStore;
