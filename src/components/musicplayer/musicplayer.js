import { useEffect, useRef, useState } from "react";
import {
  AddToQueueSvg,
  HeartSvg,
  InfoSvg,
  MoreOptionsSvg,
  PauseSvg,
  PlayerNextSvg,
  PlayerPrevSvg,
  PlaylistonceSvg,
  PlaylistsSvg,
  PlaySvg,
  RandomSvg,
  ReleasesSvg,
  RepeatoneSvg,
  RepeatSvg,
  VolumeFullSvg,
  VolumeMuteSvg,
} from "../../assets/svg";
import { formatPlayerTime, get_src_uri } from "../../api/utils";
import AudioPlayer from "react-h5-audio-player";
import playerStore from "../../zstore/playerStore";
import styles from "./musicplayer.module.css";
import authConfigStore from "../../zstore/authConfigStore";
import FullScreenSongViewer from "../fullscreensongviewer/fullscreensongviewer";
import FullScreenSongShortVideo from "../fullscreensongviewer/FullScreenSongShortVideo";
import ROUTES from "../../router/routes";
import { useNavigate } from "react-router-dom";

const PlayerControls = ({ playerRef }) => {
  const playNextBtnRef = useRef(null);
  const playPrevBtnRef = useRef(null);
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
      const handleKeyDown = (event) => {
        if (event.ctrlKey && event.key === "ArrowLeft") {
          event.preventDefault();
          playPrevBtnRef?.current?.click();
        } else if (event.ctrlKey && event.key === "ArrowRight") {
          event.preventDefault();
          playNextBtnRef?.current?.click();
        } else if (event.ctrlKey && event.key === "p") {
          event.preventDefault();
          if (audioEle.paused) audioEle.play();
          else audioEle.pause();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      const handlePlayPauseEvent = () => setIsPlaying(!audioEle.paused);
      audioEle.addEventListener("play", handlePlayPauseEvent);
      audioEle.addEventListener("pause", handlePlayPauseEvent);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);

        audioEle.removeEventListener("play", handlePlayPauseEvent);
        audioEle.removeEventListener("pause", handlePlayPauseEvent);
      };
    }
  }, [playerRef, playNextBtnRef, playPrevBtnRef]);

  return (
    <div className="mt-[10px] flex justify-center items-center w-full gap-[10px] cursor-pointer">
      <button ref={playPrevBtnRef} onClick={() => setPrevSong(playerRef)}>
        <PlayerPrevSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
      </button>
      {loadingSongFromURI ? (
        <span className="w-6 h-6 loader border-[3px] rounded-full"></span>
      ) : (
        <button onClick={handlePlayPause}>
          {isPlaying ? (
            <PauseSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
          ) : (
            <PlaySvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
          )}
        </button>
      )}
      <button ref={playNextBtnRef} onClick={() => setNextSong(playerRef)}>
        <PlayerNextSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
      </button>
    </div>
  );
};

const Duration = ({ playerRef }) => {
  const [remainingTime, setRemainingTime] = useState("-00:00");

  useEffect(() => {
    const audioEle = playerRef.current?.audio?.current;
    if (audioEle) {
      const handleTimeUpdate = () => {
        const remaining = audioEle.duration - audioEle.currentTime;
        setRemainingTime(formatPlayerTime(remaining || 0));
      };

      audioEle.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        audioEle.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [playerRef]);

  return (
    <span className="text-sm ml-[10px] w-[45px] flex-shrink-0">
      {remainingTime}
    </span>
  );
};

const VolumeControl = ({ playerRef }) => {
  const sliderRef = useRef(null);
  const speakerRef = useRef(null);
  const prevVolume = useRef(null);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const sliderEl = sliderRef.current;

    if (sliderEl && playerRef?.current?.audio?.current) {
      const audioElement = playerRef.current.audio.current;
      const initialVolume = audioElement.volume * 100;
      setVolume(audioElement.volume);
      sliderEl.value = initialVolume;
      const progress = (initialVolume / sliderEl.max) * 100;
      sliderEl.style.background = `linear-gradient(to right, #25a56a ${progress}%, #363636 ${progress}%)`;

      const handleInput = (event) => {
        const tempSliderValue = event.target.value;
        const progress = (tempSliderValue / sliderEl.max) * 100;
        sliderEl.style.background = `linear-gradient(to right, #25a56a ${progress}%, #363636 ${progress}%)`;
        audioElement.volume = tempSliderValue / 100;
        setVolume(audioElement.volume);

        localStorage.setItem("volume", audioElement.volume);
      };

      const handleKeyDown = (event) => {
        if (event.ctrlKey && event.key === "m") {
          event.preventDefault();
          speakerRef?.current?.click();
        }
      };

      sliderEl.addEventListener("input", handleInput);
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        sliderEl.removeEventListener("input", handleInput);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [playerRef, speakerRef]);

  const toggle = (value) => {
    const audioElement = playerRef?.current?.audio?.current;
    const sliderEl = sliderRef.current;
    if (audioElement && sliderEl) {
      const tempvolume = value
        ? prevVolume.current
          ? prevVolume.current
          : 0.25
        : 0;
      audioElement.volume = tempvolume;
      sliderEl.value = tempvolume * 100;
      const progress = ((tempvolume * 100) / sliderEl.max) * 100;
      sliderEl.style.background = `linear-gradient(to right, #25a56a ${progress}%, #363636 ${progress}%)`;
      prevVolume.current = volume;
      setVolume(tempvolume);
      localStorage.setItem("volume", audioElement.volume);
    }
  };

  return (
    <div className="flex items-center">
      <button ref={speakerRef} onClick={() => toggle(volume ? 0 : 1)}>
        {volume ? (
          <VolumeFullSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
        ) : (
          <VolumeMuteSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] transition-colors duration-300" />
        )}
      </button>
      <input
        ref={sliderRef}
        type="range"
        className={`${styles.seek} w-[100px] 2lg:w-[70px]`}
        min={0}
        max={100}
      />
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

const PlayOptions = () => {
  const playoption = playerStore((state) => state.playoption);
  const setPlayoption = playerStore((state) => state.setPlayoption);
  const buttonRef = useRef(null);

  const Options = {
    playlistonce: <PlaylistonceSvg className="w-5 h-5 stroke-white" />,
    repeatplaylist: <RepeatSvg className="w-4 h-4 fill-[#25a56a]" />,
    repeat: <RepeatoneSvg className="w-4 h-4 fill-[#25a56a]" />,
    random: <RandomSvg className="w-4 h-4 fill-[#25a56a]" />,
  };

  const OptionsMap = {
    playlistonce: "repeatplaylist",
    repeatplaylist: "repeat",
    repeat: "random",
    random: "playlistonce",
  };

  const handleOnClick = () => {
    setPlayoption(OptionsMap[playoption]);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "o") {
        event.preventDefault();
        buttonRef?.current?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [buttonRef]);

  return (
    <button
      ref={buttonRef}
      onClick={handleOnClick}
      className="w-6 h-6 flex justify-center items-center cursor-pointer"
    >
      {Options[playoption]}
    </button>
  );
};

const PlayingByOption = () => {
  const navigate = useNavigate();
  const playby = playerStore((state) => state.playby);

  if (playby === "queue")
    return (
      <AddToQueueSvg
        onClick={() => navigate(ROUTES.QUEUE)}
        title="Open queue"
        className="w-6 h-6 fill-white hover:fill-[#25a56a] relative group-hover:z-10"
      />
    );
  else if (playby === "playlist")
    return (
      <PlaylistsSvg
        title="Open playlist"
        className="w-6 h-6 fill-white hover:fill-[#25a56a] relative group-hover:z-10"
      />
    );
  else
    return (
      <MoreOptionsSvg className="w-6 h-6 fill-white hover:fill-[#25a56a] relative group-hover:z-10" />
    );
};

const CanPlayByQueue = () => {
  const setPlayby = playerStore((state) => state.setPlayby);
  const playby = playerStore((state) => state.playby);
  const queue = playerStore((state) => state.queue);
  if (playby !== "queue" && queue.length)
    return (
      <AddToQueueSvg
        onClick={() => setPlayby("queue")}
        title="Play from queue"
        className="w-6 h-6 fill-white hover:fill-[#25a56a]"
      />
    );
};

const PlayByNullOption = () => {
  const setPlayby = playerStore((state) => state.setPlayby);
  const playby = playerStore((state) => state.playby);
  if (playby)
    return (
      <MoreOptionsSvg
        onClick={() => setPlayby(null)}
        className="w-6 h-6 fill-white hover:fill-[#25a56a]"
      />
    );
};

const DetailOption = () => {
  const navigate = useNavigate();
  const song = playerStore((state) => state.song);
  if (song)
    return (
      <InfoSvg
        title="Song details"
        onClick={() => navigate(ROUTES.GET_SONG_URI(song.id))}
        className="w-6 h-6 fill-white hover:fill-[#25a56a]"
      />
    );
};

const MoreOptions = ({ playerRef }) => {
  return (
    <div className="relative w-6 h-6 group cursor-pointer">
      <div className="group-hover:flex p-1.5 bg-[#16151A] shadow-sm shadow-gray-500 rounded-3xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 invisible group-hover:visible flex-col gap-1 absolute -bottom-1.5 left-1/2 -translate-x-1/2">
        <DetailOption />
        <CanPlayByQueue />
        <PlayByNullOption />
        <div className="w-6 h-6 rounded-full"></div>
      </div>
      <PlayingByOption />
    </div>
  );
};

const ExtraOptions = ({ playerRef }) => {
  return (
    <div className="flex items-center gap-1">
      <LikeSongButton />
      <PlayOptions />
      <MoreOptions playerRef={playerRef} />
    </div>
  );
};

const MusicPlayerThumbnail = () => {
  const song = playerStore((state) => state.song);
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
    <div className="w-full flex justify-center">
      <div
        ref={imgContainerRef}
        className="w-[90px] h-[90px] rounded-xl skeleton"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          ref={imgRef}
          className="w-[90px] h-[90px] rounded-xl opacity-0 transition-opacity duration-500"
          src={get_src_uri(song.album.thumbnail1200x1200)}
          alt="thumbnail"
        />
      </div>
    </div>
  );
};

const MusicPlayer = () => {
  const song = playerStore((state) => state.song);
  const setNextSong = playerStore((state) => state.setNextSong);
  const setLoadingSongFromURI = playerStore(
    (state) => state.setLoadingSongFromURI
  );

  const musicPlayerContainerRef = useRef(null);
  const playerRef = useRef(null);

  const toggle = () => {
    if (musicPlayerContainerRef.current) {
      const bottom = musicPlayerContainerRef.current.style.bottom;
      musicPlayerContainerRef.current.style.bottom =
        bottom === "0px" ? "-290px" : "0px";
    }
  };

  if (song === null) return;

  return (
    <>
      <div
        ref={musicPlayerContainerRef}
        className="border border-[#222227] bg-[#16151a] p-5 w-screen z-20 fixed left-0 bottom-[-290px] h-[290px] sm:h-[260px] 2lg:sticky 2lg:w-[280px]"
      >
        <button
          onClick={toggle}
          className="hidden m2lg:flex fixed -translate-x-1/2 left-1/2 rounded-t-xl bg-[#16151a] h-[40px] w-[90px] bottom-0 items-center justify-center text-sm border border-[#222227]"
        >
          <ReleasesSvg className="w-[18px] h-[18px] fill-[#25a56a] mr-2" />{" "}
          Player
        </button>
        <MusicPlayerThumbnail />
        <div className="w-full flex justify-center mt-[10px]">
          <div className="max-w-64 truncate text-center">
            <span className="text-white font-medium">{song.original_name}</span>
            <span> - {song.album.title}</span>
          </div>
        </div>
        <PlayerControls playerRef={playerRef} />

        <div
          id="audio-player-container"
          className="flex justify-center items-center mt-[10px]"
        >
          <AudioPlayer
            volume={parseFloat(localStorage.getItem("volume")) || 1}
            ref={playerRef}
            autoPlay
            crossOrigin="*"
            src={get_src_uri(song.url)}
            showJumpControls={false}
            showSkipControls={false}
            customVolumeControls={[]}
            customAdditionalControls={[]}
            customControlsSection={["SEEK_BAR"]}
            onLoadStart={() => setLoadingSongFromURI(true)}
            onWaiting={() => setLoadingSongFromURI(true)}
            onCanPlay={() => setLoadingSongFromURI(false)}
            onLoadedData={() => setLoadingSongFromURI(false)}
            onEnded={() => setNextSong(playerRef)}
          />
          <Duration playerRef={playerRef} />
        </div>
        <div className="mt-[10px] flex justify-between items-center">
          <VolumeControl playerRef={playerRef} />
          <ExtraOptions playerRef={playerRef} />
        </div>
      </div>
      <FullScreenSongViewer playerRef={playerRef} />
      <FullScreenSongShortVideo playerRef={playerRef} />
    </>
  );
};

export default MusicPlayer;
