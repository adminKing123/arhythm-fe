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

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
};

const hslToRgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360;
  h /= 360;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hueToRgb = (p, q, t) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
};

const colorDistance = (a, b) =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

const sampleVibrantPixels = (data, width, height, relaxed = false) => {
  const pixels = [];
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue;

      const { s, l } = rgbToHsl(r, g, b);
      if (l < 0.06 || l > 0.94) continue;
      if (!relaxed && s < 0.14) continue;

      pixels.push({
        r,
        g,
        b,
        weight: relaxed ? 1 : s * (1 - Math.abs(l - 0.5) * 0.8),
      });
    }
  }

  return pixels;
};

const pickInitialCentroids = (pixels) => {
  if (!pixels.length) return null;

  const sorted = [...pixels].sort((a, b) => b.weight - a.weight);
  const centroids = [{ r: sorted[0].r, g: sorted[0].g, b: sorted[0].b }];

  while (centroids.length < 3) {
    let bestPixel = null;
    let bestDistance = -1;

    for (const pixel of sorted) {
      const nearestDistance = Math.min(
        ...centroids.map((centroid) => colorDistance(pixel, centroid))
      );

      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance;
        bestPixel = pixel;
      }
    }

    if (!bestPixel || bestDistance < 35) break;

    centroids.push({ r: bestPixel.r, g: bestPixel.g, b: bestPixel.b });
  }

  while (centroids.length < 3) {
    const last = centroids[centroids.length - 1];
    const { h, s, l } = rgbToHsl(last.r, last.g, last.b);
    centroids.push(hslToRgb(h + centroids.length * 95, Math.max(s, 0.55), l));
  }

  return centroids;
};

const kMeansColors = (pixels, k = 3, iterations = 16) => {
  let centroids = pickInitialCentroids(pixels);
  if (!centroids) return null;

  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    for (const pixel of pixels) {
      let bestIndex = 0;
      let bestDistance = Infinity;

      for (let i = 0; i < k; i++) {
        const distance = colorDistance(pixel, centroids[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }

      const weight = pixel.weight || 1;
      clusters[bestIndex].r += pixel.r * weight;
      clusters[bestIndex].g += pixel.g * weight;
      clusters[bestIndex].b += pixel.b * weight;
      clusters[bestIndex].weight += weight;
    }

    centroids = clusters.map((cluster, index) => {
      if (cluster.weight === 0) return centroids[index];
      return {
        r: Math.round(cluster.r / cluster.weight),
        g: Math.round(cluster.g / cluster.weight),
        b: Math.round(cluster.b / cluster.weight),
      };
    });
  }

  return centroids;
};

const enhanceColor = (color) => {
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b);

  if (s < 0.08) {
    return {
      r: Math.min(255, Math.round(color.r * 1.15 + 10)),
      g: Math.min(255, Math.round(color.g * 1.15 + 10)),
      b: Math.min(255, Math.round(color.b * 1.15 + 10)),
    };
  }

  return hslToRgb(h, Math.min(1, s * 1.4 + 0.1), Math.min(0.62, Math.max(0.36, l)));
};

const ensureDistinctColors = (colors) => {
  const distinct = colors.map((color) => ({ ...color }));

  for (let i = 1; i < distinct.length; i++) {
    for (let j = 0; j < i; j++) {
      if (colorDistance(distinct[i], distinct[j]) >= 55) continue;

      const base = rgbToHsl(distinct[j].r, distinct[j].g, distinct[j].b);
      distinct[i] = hslToRgb(
        base.h + (i - j) * 72,
        Math.max(base.s, 0.55),
        Math.min(0.6, Math.max(0.38, base.l))
      );
    }
  }

  return distinct;
};

const assignColorsToBulbs = (colors) => {
  const sorted = ensureDistinctColors(colors.map(enhanceColor)).sort(
    (a, b) => rgbToHsl(a.r, a.g, a.b).h - rgbToHsl(b.r, b.g, b.b).h
  );

  return {
    blue: sorted[0],
    red: sorted[1],
    green: sorted[2],
  };
};

const extractDistinctColors = (data, width, height) => {
  let pixels = sampleVibrantPixels(data, width, height);
  if (pixels.length < 18) {
    pixels = sampleVibrantPixels(data, width, height, true);
  }
  if (!pixels.length) return null;

  const clusters = kMeansColors(pixels);
  if (!clusters) return null;

  return assignColorsToBulbs(clusters);
};

const extractColorsFromImage = (imageUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context for color extraction"));
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const colors = extractDistinctColors(data, size, size);

        if (!colors) {
          reject(new Error("Could not extract distinct colors from image"));
          return;
        }

        resolve(colors);
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
