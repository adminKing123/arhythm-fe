import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { get_src_uri } from "../../api/utils";
import playerStore from "../../zstore/playerStore";
import diffViewsStore, { DIFF_VIEWS } from "../../zstore/diffViewsStore";
import { CurrentSong, Options } from "./FullSongVisualizerA1";

const DEFAULT_BULB = { scale: 0.85, opacity: 0.25, blur: 50 };

const DEFAULT_COLORS = {
  blue: { r: 59, g: 130, b: 246 },
  red: { r: 239, g: 68, b: 68 },
  green: { r: 34, g: 197, b: 94 },
};

const COLOR_TRANSITION_MS = 1000;

const getBulbStyle = (energy) => ({
  scale: 0.85 + energy * 1.8,
  opacity: 0.25 + energy * 0.75,
  blur: 50 + energy * 60,
});

const lerpColor = (from, to, t) => ({
  r: Math.round(from.r + (to.r - from.r) * t),
  g: Math.round(from.g + (to.g - from.g) * t),
  b: Math.round(from.b + (to.b - from.b) * t),
});

const buildBulbGradient = (color) => {
  const dark = {
    r: Math.max(0, Math.round(color.r * 0.85)),
    g: Math.max(0, Math.round(color.g * 0.85)),
    b: Math.max(0, Math.round(color.b * 0.85)),
  };

  return `radial-gradient(circle, rgba(${color.r}, ${color.g}, ${color.b}, 1) 0%, rgba(${dark.r}, ${dark.g}, ${dark.b}, 0.5) 45%, rgba(0,0,0,0) 75%)`;
};

const getRegionAverageColor = (data, width, height, startX, endX) => {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const sample = (includeAll) => {
    r = 0;
    g = 0;
    b = 0;
    count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = Math.floor(startX); x < Math.floor(endX); x++) {
        const i = (y * width + x) * 4;
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        const pa = data[i + 3];

        if (pa < 128) continue;

        const brightness = (pr + pg + pb) / 3;
        if (!includeAll && (brightness < 20 || brightness > 240)) continue;

        r += pr;
        g += pg;
        b += pb;
        count++;
      }
    }
  };

  sample(false);
  if (count === 0) sample(true);
  if (count === 0) return null;

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
};

const extractColorsFromImage = (imageUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 60;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context for color extraction"));
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const third = size / 3;

        const blue = getRegionAverageColor(data, size, size, 0, third);
        const red = getRegionAverageColor(data, size, size, third, third * 2);
        const green = getRegionAverageColor(data, size, size, third * 2, size);

        if (!blue || !red || !green) {
          reject(new Error("Could not extract colors from image regions"));
          return;
        }

        resolve({ blue, red, green });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image for color extraction: ${imageUrl}`));
    };

    img.src = imageUrl;
  });

let globalAudioMotion = null;

export const GradientBackground = ({ playerRef }) => {
  const song = playerStore((state) => state.song);
  const [bulbs, setBulbs] = useState({
    red: DEFAULT_BULB,
    blue: DEFAULT_BULB,
    green: DEFAULT_BULB,
  });
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const animationIdRef = useRef(null);
  const colorTransitionRef = useRef(null);
  const colorsRef = useRef(DEFAULT_COLORS);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!song) return;

    setColors(DEFAULT_COLORS);
    colorsRef.current = DEFAULT_COLORS;

    let cancelled = false;
    const imageUrl = get_src_uri(song.album.thumbnail1200x1200);

    extractColorsFromImage(imageUrl)
      .then((extractedColors) => {
        if (cancelled) return;

        const startColors = { ...colorsRef.current };
        const startTime = performance.now();

        const animateColors = (now) => {
          const progress = Math.min(1, (now - startTime) / COLOR_TRANSITION_MS);
          const eased = progress * (2 - progress);
          const nextColors = {
            blue: lerpColor(startColors.blue, extractedColors.blue, eased),
            red: lerpColor(startColors.red, extractedColors.red, eased),
            green: lerpColor(startColors.green, extractedColors.green, eased),
          };

          colorsRef.current = nextColors;
          setColors(nextColors);

          if (progress < 1) {
            colorTransitionRef.current = requestAnimationFrame(animateColors);
          }
        };

        if (colorTransitionRef.current) {
          cancelAnimationFrame(colorTransitionRef.current);
        }
        colorTransitionRef.current = requestAnimationFrame(animateColors);
      })
      .catch((error) => {
        console.log(error);
      });

    return () => {
      cancelled = true;
      if (colorTransitionRef.current) {
        cancelAnimationFrame(colorTransitionRef.current);
        colorTransitionRef.current = null;
      }
    };
  }, [song]);

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
          className="absolute bottom-[-20%] left-[16.666%] rounded-full pointer-events-none mix-blend-screen w-[50vw] h-[50vw] min-w-[350px] min-h-[350px] will-change-[transform,opacity,filter]"
          style={{
            background: buildBulbGradient(colors.blue),
            transform: `translateX(-50%) scale(${bulbs.blue.scale})`,
            opacity: bulbs.blue.opacity,
            filter: `blur(${bulbs.blue.blur}px)`,
          }}
        />
        <div
          className="absolute bottom-[-20%] left-1/2 rounded-full pointer-events-none mix-blend-screen w-[50vw] h-[50vw] min-w-[350px] min-h-[350px] will-change-[transform,opacity,filter]"
          style={{
            background: buildBulbGradient(colors.red),
            transform: `translateX(-50%) scale(${bulbs.red.scale})`,
            opacity: bulbs.red.opacity,
            filter: `blur(${bulbs.red.blur}px)`,
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[83.333%] rounded-full pointer-events-none mix-blend-screen w-[50vw] h-[50vw] min-w-[350px] min-h-[350px] will-change-[transform,opacity,filter]"
          style={{
            background: buildBulbGradient(colors.green),
            transform: `translateX(-50%) scale(${bulbs.green.scale})`,
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
