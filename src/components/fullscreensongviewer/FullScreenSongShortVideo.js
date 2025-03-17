import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import diffViewsStore, { DIFF_VIEWS } from "../../zstore/diffViewsStore";
import { BgImage, Options } from "./fullscreensongviewer";
import playerStore from "../../zstore/playerStore";
import { get_short_video_src_uri, get_src_uri } from "../../api/utils";

const Video = ({ song, playerRef }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!playerRef?.current || !videoRef?.current) return;

    const audioElement = playerRef.current.audio.current;
    const videoElement = videoRef.current;

    const handlePlay = () => videoElement.play();
    const handlePause = () => videoElement.pause();

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [playerRef]);

  return (
    <>
      <video
        ref={videoRef}
        className="h-[80%] aspect-video object-cover rounded-xl shadow-xl"
        autoPlay
        loop
        muted
        src={get_short_video_src_uri(song.short_video_url)}
      ></video>
      <h3 className="mt-2">{song.original_name}</h3>
    </>
  );
};

const PlaceholderContain = ({ playerRef }) => {
  const song = playerStore((state) => state.song);

  if (song.short_video_url) return <Video song={song} playerRef={playerRef} />;
  return (
    <img
      alt="imageofsong"
      src={get_src_uri(song.album.thumbnail1200x1200)}
      className="aspect-square h-full object-cover rounded-xl"
    />
  );
};

const FullScreenSongShortVideo = ({ playerRef }) => {
  const view = diffViewsStore((state) => state.view);
  const setView = diffViewsStore((state) => state.setView);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "v") {
        event.preventDefault();
        if (view === DIFF_VIEWS.FULL_MUSIC_WITH_SHORT_VIDEO) setView(null);
        else setView(DIFF_VIEWS.FULL_MUSIC_WITH_SHORT_VIDEO);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view, setView]);

  if (view === DIFF_VIEWS.FULL_MUSIC_WITH_SHORT_VIDEO)
    return ReactDOM.createPortal(
      <div className="bg-[#16151A] absolute top-0 left-0 w-screen h-screen z-50 flex justify-center items-center">
        <BgImage />
        <div className="relative h-full p-5 flex items-center justify-center flex-col">
          <PlaceholderContain playerRef={playerRef} />
          <Options
            playerRef={playerRef}
            className={"absolute bottom-8 left-1/2 -translate-x-1/2"}
          />
        </div>
      </div>,
      document.body
    );
  return null;
};

export default FullScreenSongShortVideo;
