import { useEffect } from "react";
import authConfigStore from "../zstore/authConfigStore";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { baseURL } from ".";

const tokenManager = {
  getToken: () =>
    localStorage.getItem("token") || sessionStorage.getItem("token") || null,
  setToken: (token, rememberMe) => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    if (rememberMe) localStorage.setItem("token", token);
    else sessionStorage.setItem("token", token);
  },
  removeToken: () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("last_song");
    localStorage.removeItem("last_song_liked");
    localStorage.removeItem("volume");
    localStorage.removeItem("gbSearchHistory");
  },
};

export const get_src_uri = (path) => {
  return `${authConfigStore.getState().SRC_URI}${path}`;
};

export const get_short_video_src_uri = (path) => {
  return `${authConfigStore.getState().SHORT_VIDEO_URI}${path}`;
};

export const numeral = (num) => {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(num);
};

export const formatPlayerTime = (timeInSeconds, sign = "-") => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${sign}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const setSongMetaData = async (song) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.original_name,
      artist: song.artists.map((artist) => artist.name).join(", "),
      album: song.album.title,
      artwork: [
        {
          src: get_src_uri(song.album.thumbnail300x300),
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: get_src_uri(song.album.thumbnail300x300),
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: get_src_uri(song.album.thumbnail1200x1200),
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: get_src_uri(song.album.thumbnail1200x1200),
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: get_src_uri(song.album.thumbnail1200x1200),
          sizes: "384x384",
          type: "image/png",
        },
        {
          src: get_src_uri(song.album.thumbnail1200x1200),
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  }
};

export const getParamFromUrl = (url, key) => {
  const urlParams = new URLSearchParams(url);
  const value = urlParams.get(key);
  return value;
};

export const scrollTo = (id, props) => {
  const ele = document.getElementById(id);
  if (ele) {
    ele.scrollTo({ ...props });
  }
};

export const useContextMenuCloseHandler = (ref, handleClose) =>
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handleClose();
      }
    };
    const mainContent = document.getElementById("main-content");
    const globalSearchContainer = document.getElementById(
      "global-search-container"
    );
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleClose);
    mainContent.addEventListener("scroll", handleClose);
    globalSearchContainer?.addEventListener("scroll", handleClose);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleClose);
      mainContent.removeEventListener("scroll", handleClose);
      globalSearchContainer?.removeEventListener("scroll", handleClose);
    };
  }, [handleClose, ref]);

export const useOutsideClick = (ref, handleClose) => {
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleClose, ref]);
};

export const useContextPosition = (ref, contextMenuData, callback) => {
  useEffect(() => {
    if (!ref.current) return;

    const menuElement = ref.current;
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate adjusted position
    const adjustedX =
      contextMenuData.x + menuRect.width > viewportWidth
        ? viewportWidth - menuRect.width - 10
        : contextMenuData.x;

    const adjustedY =
      contextMenuData.y + menuRect.height > viewportHeight
        ? viewportHeight - menuRect.height - 10
        : contextMenuData.y;

    callback(menuElement, adjustedX, adjustedY);
  }, [ref, contextMenuData, callback]);
};

export const getRandomIndex = (maxvalue, prev) => {
  let randomNum = Math.floor(Math.random() * maxvalue);

  if (randomNum === prev) {
    if (randomNum > 0) return randomNum - 1;
    else return maxvalue - 1;
  }
  return randomNum;
};

export const SHARE_APIS = {
  SONG: (id) => `${baseURL}/share/content/songs/${id}`,
  PLAYLIST: (id) => `${baseURL}/share/content/playlists/${id}`,
  ALBUM: (id) => `${baseURL}/share/content/albums/${id}`,
  ARTIST: (id) => `${baseURL}/share/content/artists/${id}`,
};

export function formatDateTime(dateTime) {
  const date = new Date(dateTime);
  const now = new Date();

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const diffDays = differenceInDays(now, date);

  if (diffDays < 7) return format(date, "EEEE"); // Day name (e.g., Monday)
  if (now.getFullYear() === date.getFullYear()) return format(date, "MMM d"); // Month & Day (e.g., Mar 31)

  return format(date, "yyyy, MMM d"); // Year, Month & Day (e.g., 2024, Mar 31)
}

export const groupByDate = (data) => {
  const grouped = {};

  data.forEach((page) => {
    page.results.forEach((history_song) => {
      const date = new Date(history_song.accessed_at)
        .toISOString()
        .split("T")[0];

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(history_song);
    });
  });

  return grouped;
};

export default tokenManager;
