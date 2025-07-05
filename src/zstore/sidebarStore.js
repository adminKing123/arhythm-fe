import { create } from "zustand";

const sidebarStore = create((set) => ({
  open: window.innerWidth > 1200,
  setOpen: (value) => {
    set({ open: value });
  },
}));

export default sidebarStore;
