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

// Global audio analyzer to prevent multiple source creation
let globalAudioContext = null;
let globalAnalyser = null;
let globalDataArray = null;
let globalSource = null;

export const BgImage = ({ playerRef }) => {
  const imgRef = useRef(null);
  const song = playerStore((state) => state.song);
  const [opacity, setOpacity] = useState(0);
  const animationIdRef = useRef(null);

  // Audio analysis setup
  useEffect(() => {
    const audioEle = playerRef?.current?.audio?.current;
    if (!audioEle) return;

    const setupAudioAnalysis = () => {
      try {
        // Use global audio context and analyzer to prevent multiple source creation
        if (!globalAudioContext) {
          globalAudioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          globalAnalyser = globalAudioContext.createAnalyser();

          // Configure analyzer
          globalAnalyser.fftSize = 512;
          globalAnalyser.smoothingTimeConstant = 0.8;
          const bufferLength = globalAnalyser.frequencyBinCount;
          globalDataArray = new Uint8Array(bufferLength);

          // Create media source from audio element only once globally
          try {
            globalSource =
              globalAudioContext.createMediaElementSource(audioEle);
            globalSource.connect(globalAnalyser);
            globalAnalyser.connect(globalAudioContext.destination);
            console.log("Global audio analysis setup completed");
          } catch (error) {
            console.error("Failed to create media source:", error);
            return;
          }
        }

        // Start analysis loop if not already running
        if (!animationIdRef.current) {
          const analyze = () => {
            if (globalAnalyser && globalDataArray) {
              try {
                // Get frequency data
                globalAnalyser.getByteFrequencyData(globalDataArray);

                const bufferLength = globalDataArray.length;
                const sampleRate = globalAudioContext.sampleRate; // VERY IMPORTANT

                // --- ACCURATE: Frequency -> Index mapping ---
                function freqToIndex(freq) {
                  const nyquist = sampleRate / 2;
                  return Math.min(
                    bufferLength - 1,
                    Math.max(0, Math.round((freq / nyquist) * bufferLength))
                  );
                }

                // --- REAL WORLD AUDIO RANGES ---
                const LOW_START = 20;
                const LOW_END = 250;

                const MID_START = 250;
                const MID_END = 4000;

                const HIGH_START = 4000;
                const HIGH_END = 20000;

                // Convert to indexes
                const lowStartIndex = freqToIndex(LOW_START);
                const lowEndIndex = freqToIndex(LOW_END);

                const midStartIndex = freqToIndex(MID_START);
                const midEndIndex = freqToIndex(MID_END);

                const highStartIndex = freqToIndex(HIGH_START);
                const highEndIndex = freqToIndex(HIGH_END);

                // --- ENERGY CALCULATIONS ---
                function getEnergy(start, end) {
                  let sum = 0;
                  let count = 0;
                  for (let i = start; i < end; i++) {
                    sum += globalDataArray[i];
                    count++;
                  }
                  return count > 0 ? sum / count / 255 : 0; // normalized 0-1
                }

                const lowEnergy = getEnergy(lowStartIndex, lowEndIndex);
                const midEnergy = getEnergy(midStartIndex, midEndIndex);
                const highEnergy = getEnergy(highStartIndex, highEndIndex);

                // --- YOUR OPACITY FORMULA (unchanged) ---
                const newOpacity = Math.min(
                  1,
                  (lowEnergy * 0.4 + midEnergy * 0.35 + highEnergy * 0.25) ** 1.2
                );


                setOpacity(newOpacity);
              } catch (error) {
                console.error("Error in analysis loop:", error);
              }
            }
            animationIdRef.current = requestAnimationFrame(analyze);
          };

          analyze();
          console.log("Analysis loop started");
        }
      } catch (error) {
        console.error("Error setting up audio analysis:", error);
        setOpacity(0.75); // Fallback opacity
      }
    };

    // Setup when audio starts playing
    const handlePlay = () => {
      if (globalAudioContext?.state === "suspended") {
        globalAudioContext.resume();
      }
      if (!globalAnalyser) {
        setupAudioAnalysis();
      }
    };

    const handlePause = () => {
      setOpacity(0.1); // Set to minimum when paused
    };

    // Check if audio is already playing
    if (!audioEle.paused) {
      setupAudioAnalysis();
    }

    audioEle.addEventListener("play", handlePlay);
    audioEle.addEventListener("pause", handlePause);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      // Don't close the global audio context as it's shared
      audioEle.removeEventListener("play", handlePlay);
      audioEle.removeEventListener("pause", handlePause);
    };
  }, [playerRef]); // Removed 'song' dependency to prevent re-setup on song changes

  useEffect(() => {
    const imgEle = imgRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
    };

    if (imgEle) {
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
      className="shadow-inner absolute top-0 left-0 object-cover object-center blur-[2px] w-screen h-screen rounded-xl"
      style={{ opacity: opacity }}
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

const FullScreenSongViewerA1 = ({ playerRef }) => {
  const view = diffViewsStore((state) => state.view);
  const setView = diffViewsStore((state) => state.setView);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "b") {
        event.preventDefault();
        if (view === DIFF_VIEWS.FULL_SONG_VISUALIZER_A1) setView(null);
        else setView(DIFF_VIEWS.FULL_SONG_VISUALIZER_A1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view, setView]);

  if (view === DIFF_VIEWS.FULL_SONG_VISUALIZER_A1)
    return ReactDOM.createPortal(
      <div className="bg-[#16151A] absolute top-0 left-0 w-screen h-screen z-50 flex justify-center items-center">
        <BgImage playerRef={playerRef} />
        <CurrentSong playerRef={playerRef} className={"relative"} />
        <Options playerRef={playerRef} className={"absolute bottom-4"} />
      </div>,
      document.body
    );
  return null;
};

export default FullScreenSongViewerA1;
