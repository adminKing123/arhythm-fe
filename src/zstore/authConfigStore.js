import { create } from "zustand";

const authConfigStore = create((set) => ({
  user: null,
  SRC_URI: "",
  setConfig: (config, callback) => {
    set({
      user: config.user,
      SRC_URI: config.SRC_URI,
      SHORT_VIDEO_URI: config.SHORT_VIDEO_URI,
    });
    callback();
  },
}));

export default authConfigStore;
