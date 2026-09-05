import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import diffViewsStore, { DIFF_VIEWS } from "../../zstore/diffViewsStore";
import { CurrentSong, Options } from "./FullSongVisualizerA1";

const DEFAULT_BULB = { scale: 0.85, opacity: 0.25, blur: 50 };

const getBulbStyle = (energy) => ({
  scale: 0.85 + energy * 1.8,
  opacity: 0.25 + energy * 0.75,
  blur: 50 + energy * 60,
});

let globalAudioMotion = null;

export const GradientBackground = ({ playerRef }) => {
  const [bulbs, setBulbs] = useState({
    red: DEFAULT_BULB,
    blue: DEFAULT_BULB,
    green: DEFAULT_BULB,
  });
  const animationIdRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const audioEle = playerRef?.current?.audio?.current;
    if (!audioEle || !containerRef.current) return;

    const setupAudioMotion = () => {
      try {
        if (!globalAudioMotion) {
          globalAudioMotion = new AudioMotionAnalyzer(containerRef.current, {
            source: audioEle,
            mode: 3,
            fftSize: 8192,
            smoothing: 0.8,
            showScaleX: false,
            showScaleY: false,
            showBgColor: false,
            overlay: true,
            bgAlpha: 0,
            height: 1,
            width: 1,
          });
        }

        if (!animationIdRef.current) {
          const analyze = () => {
            if (globalAudioMotion) {
              try {
                const bassNorm = Math.min(
                  1,
                  globalAudioMotion.getEnergy("bass")
                );
                const midNorm = Math.min(
                  1,
                  globalAudioMotion.getEnergy("midrange")
                );
                const trebleNorm = Math.min(
                  1,
                  globalAudioMotion.getEnergy("treble")
                );

                setBulbs({
                  red: getBulbStyle(bassNorm),
                  blue: getBulbStyle(midNorm),
                  green: getBulbStyle(trebleNorm),
                });
              } catch (error) {
                console.error("Error in gradient analysis loop:", error);
              }
            }
            animationIdRef.current = requestAnimationFrame(analyze);
          };
          analyze();
        }
      } catch (error) {
        console.error("Error setting up AudioMotionAnalyzer:", error);
      }
    };

    const handlePlay = () => {
      if (!globalAudioMotion) {
        setupAudioMotion();
      }
    };

    const handlePause = () => {
      setBulbs({
        red: { scale: 0.85, opacity: 0.1, blur: 50 },
        blue: { scale: 0.85, opacity: 0.1, blur: 50 },
        green: { scale: 0.85, opacity: 0.1, blur: 50 },
      });
    };

    if (!audioEle.paused) {
      setupAudioMotion();
    }

    audioEle.addEventListener("play", handlePlay);
    audioEle.addEventListener("pause", handlePause);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      audioEle.removeEventListener("play", handlePlay);
      audioEle.removeEventListener("pause", handlePause);
    };
  }, [playerRef]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-0 h-0 overflow-hidden"
      />
      <div className="absolute inset-0 overflow-hidden bg-[#020617] pointer-events-none">
        <div
          className="absolute bottom-[-20%] left-[-15%] rounded-full pointer-events-none mix-blend-screen w-[50vw] h-[50vw] min-w-[350px] min-h-[350px] will-change-[transform,opacity,filter]"
          style={{
            background:
              "radial-gradient(circle, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 0.5) 45%, rgba(0,0,0,0) 75%)",
            transform: `scale(${bulbs.red.scale})`,
            opacity: bulbs.red.opacity,
            filter: `blur(${bulbs.red.blur}px)`,
          }}
        />
        <div
          className="absolute bottom-[-20%] left-1/2 rounded-full pointer-events-none mix-blend-screen w-[55vw] h-[55vw] min-w-[400px] min-h-[400px] will-change-[transform,opacity,filter]"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.5) 45%, rgba(0,0,0,0) 75%)",
            transform: `translateX(-50%) scale(${bulbs.blue.scale})`,
            opacity: bulbs.blue.opacity,
            filter: `blur(${bulbs.blue.blur}px)`,
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-15%] rounded-full pointer-events-none mix-blend-screen w-[50vw] h-[50vw] min-w-[350px] min-h-[350px] will-change-[transform,opacity,filter]"
          style={{
            background:
              "radial-gradient(circle, rgba(34, 197, 94, 1) 0%, rgba(16, 185, 129, 0.5) 45%, rgba(0,0,0,0) 75%)",
            transform: `scale(${bulbs.green.scale})`,
            opacity: bulbs.green.opacity,
            filter: `blur(${bulbs.green.blur}px)`,
          }}
        />
      </div>
    </>
  );
};

const FullScreenSongViewerA2 = ({ playerRef }) => {
  const view = diffViewsStore((state) => state.view);
  const setView = diffViewsStore((state) => state.setView);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        if (view === DIFF_VIEWS.FULL_SONG_VISUALIZER_A2) setView(null);
        else setView(DIFF_VIEWS.FULL_SONG_VISUALIZER_A2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view, setView]);

  if (view === DIFF_VIEWS.FULL_SONG_VISUALIZER_A2)
    return ReactDOM.createPortal(
      <div className="bg-[#16151A] absolute top-0 left-0 w-screen h-screen z-50 flex justify-center items-center">
        <GradientBackground playerRef={playerRef} />
        <CurrentSong playerRef={playerRef} className={"relative"} />
        <Options playerRef={playerRef} className={"absolute bottom-4"} />
      </div>,
      document.body
    );
  return null;
};

export default FullScreenSongViewerA2;
