import { create } from "zustand";
import authConfigStore from "./authConfigStore";
import {
  getSong as addToHistory,
  getRandomSong,
  likeSong,
  removeFromlikedSong,
} from "../api/songs/queryFunctions";
import { getRandomIndex, setSongMetaData } from "../api/utils";
import {
  getPlaylistSongsSeek,
  getRandomPlaylistSong,
} from "../api/playlists/queryFunctions";

const already_selected_song = JSON.parse(localStorage.getItem("last_song"));
if (already_selected_song) setSongMetaData(already_selected_song);

const playerStore = create((set, get) => ({
  song: already_selected_song || null,
  isLiked: localStorage.getItem("last_song_liked") === "0" ? false : true,
  addingInLiked: false,
  addingInHistory: false,
  playby: null,
  setPlayby: (value) => set({ playby: value }),

  playoption: "playlistonce",
  setPlayoption: (value) => set({ playoption: value }),

  loadingSongFromURI: false,
  setLoadingSongFromURI: (value) => {
    set({ loadingSongFromURI: value });
  },

  setSong: async (song, shouldAddToHistory = true) => {
    const prevSong = get().song;
    set({ song: song });
    setSongMetaData(song);
    if (
      authConfigStore.getState().user &&
      prevSong?.id !== song.id &&
      shouldAddToHistory
    ) {
      localStorage.setItem("last_song", JSON.stringify(song));

      set({ addingInHistory: true });
      const response = await addToHistory({ id: song.id });
      set({ addingInHistory: false });

      set({ isLiked: response.liked });

      localStorage.setItem("last_song_liked", response.liked ? "1" : "0");
    }

    if (!shouldAddToHistory) {
      localStorage.setItem("last_song", JSON.stringify(song));
      set({ isLiked: song?.liked ? true : false });
      localStorage.setItem("last_song_liked", song?.liked ? "1" : "0");
    }

    if (prevSong?.id === song.id) {
      set({ loadingSongFromURI: false });
      const audioEle = document
        .getElementById("audio-player-container")
        ?.getElementsByTagName("audio")?.[0];
      audioEle?.play();
    }
  },

  setNextSong: (playerRef) => {
    const {
      playby,
      getNextFromQueue,
      playoption,
      repeatSong,
      getRandomSongFromAPI,
      getNextFromPlaylist,
    } = get();
    if (playoption === "repeat") repeatSong(playerRef);
    else if (playby === "queue") getNextFromQueue();
    else if (playby === "playlist") getNextFromPlaylist();
    else if (playby === null && playoption === "random") getRandomSongFromAPI();
  },
  setPrevSong: (playerRef) => {
    const {
      playby,
      getPrevFromQueue,
      playoption,
      repeatSong,
      getPrevFromPlaylist,
    } = get();
    if (playoption === "repeat") repeatSong(playerRef);
    else if (playby === "queue") getPrevFromQueue();
    else if (playby === "playlist") getPrevFromPlaylist();
  },
  repeatSong: (playerRef) => {
    const audioElement = playerRef.current?.audio?.current;
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play();
    }
  },
  getRandomSongFromAPI: async () => {
    const { setSong } = get();
    set({ loadingSongFromURI: true });
    const randomSong = await getRandomSong();
    setSong(randomSong, false);
  },

  setLike: async (bool) => {
    const selected_song = get().song;
    const IsAddingInLiked = get().addingInLiked;

    if (!IsAddingInLiked) {
      set({ isLiked: bool, addingInLiked: true });
      if (bool) await likeSong({ id: selected_song.id });
      else removeFromlikedSong({ id: selected_song.id });
      localStorage.setItem("last_song_liked", bool ? "1" : "0");
      set({ addingInLiked: false });
    }
  },

  // player playlist logics
  currentPlaylist: null,
  setSongFromPlaylist: (playlist_song_id, song, playlist) =>
    set((state) => {
      // state.setSong(song);
      return {
        currentPlaylist: {
          playlist,
          playlist_song_id,
        },
        playby: "playlist",
      };
    }),
  getRandomSongFromPlaylist: async () => {
    const { setSong, currentPlaylist } = get();
    set({ loadingSongFromURI: true });
    try {
      const randomPlaylistSong = await getRandomPlaylistSong({
        id: currentPlaylist.playlist.id,
      });
      setSong(randomPlaylistSong.song, false);
      set({
        currentPlaylist: {
          playlist: currentPlaylist.playlist,
          playlist_song_id: randomPlaylistSong.id,
        },
        playoption: "random",
        playby: "playlist",
      });
    } catch (e) {
      set({ loadingSongFromURI: false, playby: null });
    }
  },
  seekFromPlaylist: async (loop, getwhat) => {
    const { setSong, currentPlaylist } = get();
    set({ loadingSongFromURI: true });
    try {
      const playlistSongs = await getPlaylistSongsSeek({
        id: currentPlaylist.playlist.id,
        loop: loop ? "true" : "",
        playlistsong_id: currentPlaylist.playlist_song_id,
      });
      const playlistsong = playlistSongs?.[getwhat];
      if (playlistsong) {
        setSong(playlistsong.song);
        set({
          currentPlaylist: {
            playlist: currentPlaylist.playlist,
            playlist_song_id: playlistsong.id,
          },
        });
      } else set({ loadingSongFromURI: false });
    } catch (e) {
      set({ loadingSongFromURI: false, playby: null });
    }
  },
  getNextFromPlaylist: async () => {
    const { playoption, getRandomSongFromPlaylist, seekFromPlaylist } = get();
    if (playoption === "playlistonce") seekFromPlaylist(false, "next_song");
    if (playoption === "repeatplaylist") seekFromPlaylist(true, "next_song");
    if (playoption === "random") getRandomSongFromPlaylist();
  },
  getPrevFromPlaylist: async () => {
    const { playoption, getRandomSongFromPlaylist, seekFromPlaylist } = get();
    if (playoption === "repeatplaylist")
      seekFromPlaylist(true, "previous_song");
    if (playoption === "playlistonce") seekFromPlaylist(false, "previous_song");
    if (playoption === "random") getRandomSongFromPlaylist();
  },

  // player queue logic
  queue: [],
  currentPlayingIndex: null,
  addSong: (song) =>
    set((state) => ({
      queue: state.queue.some((s) => s.id === song.id)
        ? state.queue
        : [...state.queue, song],
      playby: "queue",
    })),
  removeSong: (index) => {
    set((state) => {
      const updatedQueue = state.queue.filter((_, i) => i !== index);
      const data = {
        queue: updatedQueue,
        currentPlayingIndex:
          updatedQueue.length === 0
            ? null
            : index < state.currentPlayingIndex
            ? state.currentPlayingIndex - 1
            : state.currentPlayingIndex,
        playby: updatedQueue.length ? "queue" : null,
      };
      let qIndex = state.currentPlayingIndex;
      if (updatedQueue.length && index === state.currentPlayingIndex) {
        if (index === updatedQueue.length) {
          qIndex -= 1;
          data["currentPlayingIndex"] = qIndex;
        }
        state.setSong(updatedQueue[qIndex]);
      }
      return data;
    });
  },
  setQueueSongWithIndex: (index) => {
    set((state) => {
      if (index < 0 || state.queue.length === 0) return {};
      const qIndex = index % state.queue.length;
      state.setSong(state.queue[qIndex]);
      return {
        song: state.queue[qIndex],
        currentPlayingIndex: qIndex,
        playby: "queue",
      };
    });
  },
  clearQueue: () => set({ queue: [], currentPlayingIndex: null, playby: null }),

  getNextFromQueue: () => {
    set((state) => {
      let qIndex = 0;
      qIndex =
        state.currentPlayingIndex === null ? 0 : state.currentPlayingIndex + 1;

      let songToBeUpdated = null;
      if (state.playoption === "playlistonce") {
        if (qIndex >= 0 && qIndex < state.queue.length)
          songToBeUpdated = state.queue[qIndex];
      } else if (state.playoption === "repeatplaylist") {
        qIndex = qIndex % state.queue.length;
        songToBeUpdated = state.queue[qIndex];
      } else if (state.playoption === "random") {
        qIndex = getRandomIndex(state.queue.length, qIndex);
        songToBeUpdated = state.queue[qIndex];
      }
      if (songToBeUpdated) state.setSong(state.queue[qIndex]);

      return {
        currentPlayingIndex:
          qIndex >= 0 && qIndex < state.queue.length
            ? qIndex
            : state.currentPlayingIndex,
      };
    });
  },
  getPrevFromQueue: () => {
    set((state) => {
      let qIndex = 0;
      qIndex =
        state.currentPlayingIndex === null ? 0 : state.currentPlayingIndex - 1;

      let songToBeUpdated = null;
      if (state.playoption === "playlistonce") {
        if (qIndex >= 0 && qIndex < state.queue.length)
          songToBeUpdated = state.queue[qIndex];
      } else if (
        state.playoption === "repeatplaylist" ||
        state.playoption === "random"
      ) {
        qIndex = qIndex < 0 ? state.queue.length - 1 : qIndex;
        songToBeUpdated = state.queue[qIndex];
      }
      if (songToBeUpdated) state.setSong(state.queue[qIndex]);

      return {
        currentPlayingIndex:
          qIndex >= 0 && qIndex < state.queue.length
            ? qIndex
            : state.currentPlayingIndex,
      };
    });
  },
}));

export default playerStore;
