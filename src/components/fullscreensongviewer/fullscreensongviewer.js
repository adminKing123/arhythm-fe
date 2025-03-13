import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { formatPlayerTime, get_src_uri } from "../../api/utils";
import playerStore from "../../zstore/playerStore";
import {
  HeartSvg,
  PauseSvg,
  PlayerNextSvg,
  PlayerPrevSvg,
  PlaylistonceSvg,
  PlaySvg,
  RandomSvg,
  RepeatoneSvg,
  RepeatSvg,
} from "../../assets/svg";
import authConfigStore from "../../zstore/authConfigStore";
import diffViewsStore, { DIFF_VIEWS } from "../../zstore/diffViewsStore";

const PlayOptions = () => {
  const playoption = playerStore((state) => state.playoption);
  const setPlayoption = playerStore((state) => state.setPlayoption);

  const Options = {
    playlistonce: (
      <PlaylistonceSvg
        className="w-5 h-5 stroke-white"
        onClick={() => setPlayoption("repeatplaylist")}
      />
    ),
    repeatplaylist: (
      <RepeatSvg
        className="w-4 h-4 fill-[#25a56a]"
        onClick={() => setPlayoption("repeat")}
      />
    ),
    repeat: (
      <RepeatoneSvg
        className="w-4 h-4 fill-[#25a56a]"
        onClick={() => setPlayoption("random")}
      />
    ),
    random: (
      <RandomSvg
        className="w-4 h-4 fill-[#25a56a]"
        onClick={() => setPlayoption("playlistonce")}
      />
    ),
  };

  return (
    <div className="w-6 h-6 flex justify-center items-center cursor-pointer">
      {Options[playoption]}
    </div>
  );
};

const LikeSongButton = () => {
  const user = authConfigStore((state) => state.user);
  const addingInHistory = playerStore((state) => state.addingInHistory);
  const isLiked = playerStore((state) => state.isLiked);
  const setLike = playerStore((state) => state.setLike);
  const addingInLiked = playerStore((state) => state.addingInLiked);

  const handleClick = () => {
    if (!addingInLiked) {
      setLike(!isLiked);
    }
  };

  if (user)
    return (
      <HeartSvg
        onClick={handleClick}
        className={`w-6 h-6 ${
          addingInHistory
            ? "fill-[#c0c0c0]"
            : isLiked
            ? "fill-red-600"
            : "fill-white"
        } cursor-pointer transition-colors duration-300`}
      />
    );
  return;
};

const PlayerControls = ({ playerRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const loadingSongFromURI = playerStore((state) => state.loadingSongFromURI);
  const setNextSong = playerStore((state) => state.setNextSong);
  const setPrevSong = playerStore((state) => state.setPrevSong);

  const handlePlayPause = () => {
    if (playerRef.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
    }
  };

  useEffect(() => {
    const audioEle = playerRef.current?.audio?.current;
    if (audioEle) {
      setIsPlaying(!audioEle.paused);

      const handlePlayPauseEvent = () => setIsPlaying(!audioEle.paused);
      audioEle.addEventListener("play", handlePlayPauseEvent);
      audioEle.addEventListener("pause", handlePlayPauseEvent);
      return () => {
        audioEle.removeEventListener("play", handlePlayPauseEvent);
        audioEle.removeEventListener("pause", handlePlayPauseEvent);
      };
    }
  }, [playerRef]);

  return (
    <div className="cursor-pointer flex justify-center items-center w-full gap-[10px] opacity-5 hover:opacity-100 duration-300 transition-opacity">
      <PlayerPrevSvg
        onClick={() => setPrevSong(playerRef)}
        className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300"
      />
      {loadingSongFromURI ? (
        <span className="w-6 h-6 loader border-[3px] rounded-full"></span>
      ) : (
        <span onClick={handlePlayPause}>
          {isPlaying ? (
            <PauseSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
          ) : (
            <PlaySvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
          )}
        </span>
      )}
      <PlayerNextSvg
        onClick={() => setNextSong(playerRef)}
        className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300"
      />
    </div>
  );
};

export const Options = ({ playerRef, className }) => {
  return (
    <div className={`${className ?? ""}`}>
      <PlayerControls playerRef={playerRef} />
      <div className="flex justify-center items-center gap-2 mt-2 opacity-5 hover:opacity-100 duration-300 transition-opacity">
        <LikeSongButton />
        <PlayOptions />
      </div>
    </div>
  );
};

const CurrentSongImage = ({ song }) => {
  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);

  useEffect(() => {
    const imgEle = imgRef.current;
    const imgContainerEle = imgContainerRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
      imgContainerEle.classList.remove("skeleton");
    };

    if (imgEle && imgContainerRef) {
      imgEle.classList.add("opacity-0");
      imgContainerEle.classList.add("skeleton");

      if (imgEle.complete) handleLoaded();
      else imgEle.addEventListener("load", handleLoaded);

      return () => {
        imgEle.removeEventListener("load", handleLoaded);
      };
    }
  }, [imgRef, imgContainerRef, song]);

  return (
    <div
      ref={imgContainerRef}
      className="w-full aspect-square rounded-xl skeleton shadow-md"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        ref={imgRef}
        className="w-full aspect-square rounded-xl opacity-0 transition-opacity duration-500"
        src={get_src_uri(song.album.thumbnail1200x1200)}
        alt="thumbnail"
      />
    </div>
  );
};

export const BgImage = () => {
  const imgRef = useRef(null);
  const song = playerStore((state) => state.song);

  useEffect(() => {
    const imgEle = imgRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
      imgEle.classList.add("opacity-75");
    };

    if (imgEle) {
      imgEle.classList.remove("opacity-75");
      imgEle.classList.add("opacity-0");

      if (imgEle.complete) handleLoaded();
      else imgEle.addEventListener("load", handleLoaded);

      return () => {
        imgEle.removeEventListener("load", handleLoaded);
      };
    }
  }, [imgRef, song]);

  return (
    <img
      ref={imgRef}
      className="shadow-inner absolute top-0 left-0 object-cover object-center blur-xl w-screen h-screen rounded-xl opacity-0 transition-opacity duration-500"
      src={get_src_uri(song.album.thumbnail1200x1200)}
      alt="thumbnail"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

const Duration = ({ playerRef }) => {
  const [remainingTime, setRemainingTime] = useState("00:00");

  useEffect(() => {
    const audioEle = playerRef.current?.audio?.current;
    if (audioEle) {
      const handleTimeUpdate = () => {
        setRemainingTime(formatPlayerTime(audioEle.currentTime || 0, ""));
      };

      audioEle.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        audioEle.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [playerRef]);

  return <p className="text-sm text-center mt-2">{remainingTime}</p>;
};

export const CurrentSong = ({ playerRef, className }) => {
  const song = playerStore((state) => state.song);
  if (song === null) return null;
  return (
    <div className={`mx-10 max-w-[420px] w-full ${className ?? ""}`}>
      <CurrentSongImage song={song} />
      <p className="truncate mt-2 text-lg text-white text-center">
        {song.original_name} -<span> {song.album.title}</span>
      </p>

      <Duration playerRef={playerRef} />
    </div>
  );
};

const FullScreenSongViewer = ({ playerRef }) => {
  const view = diffViewsStore((state) => state.view);
  const setView = diffViewsStore((state) => state.setView);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault();
        if (view === DIFF_VIEWS.FULL_MUSIC_PLAYER) setView(null);
        else setView(DIFF_VIEWS.FULL_MUSIC_PLAYER);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view, setView]);

  if (view === DIFF_VIEWS.FULL_MUSIC_PLAYER)
    return ReactDOM.createPortal(
      <div className="bg-[#16151A] absolute top-0 left-0 w-screen h-screen z-50 flex justify-center items-center">
        <BgImage />
        <CurrentSong playerRef={playerRef} className={"relative"} />
        <Options playerRef={playerRef} className={"absolute bottom-4"} />
      </div>,
      document.body
    );
  return null;
};

export default FullScreenSongViewer;
