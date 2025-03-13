import { useEffect } from "react";
import ReactDOM from "react-dom";
import diffViewsStore, { DIFF_VIEWS } from "../../zstore/diffViewsStore";

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
      <div className="bg-[#16151A] absolute top-0 left-0 w-screen h-screen z-50">
        Perfect
      </div>,
      document.body
    );
  return null;
};

export default FullScreenSongShortVideo;
