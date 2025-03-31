import { useEffect, useRef, useState } from "react";
import { get_src_uri, scrollTo } from "../../api/utils";
import { BookmarkSvg } from "../../assets/svg";
import Button from "../../components/buttons/buttons";
import { ALink } from "../../components/links/links";
import { SongCard3 } from "../../components/songcards/songcard";
import ROUTES from "../../router/routes";
import authConfigStore from "../../zstore/authConfigStore";
import playerStore from "../../zstore/playerStore";
import contextMenuStore from "../../zstore/contextMenuStore";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";

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
      className="w-full aspect-square rounded-xl skeleton"
    >
      <img
        ref={imgRef}
        className="w-full aspect-square rounded-xl opacity-0 transition-opacity duration-500"
        src={get_src_uri(song.album.thumbnail1200x1200)}
        alt="thumbnail"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

const ShowCurrentPlayingSong = () => {
  const currentPlayingIndex = playerStore((state) => state.currentPlayingIndex);
  const [currentSong, setCurrentSong] = useState(null);
  const setQueueSongWithIndex = playerStore(
    (state) => state.setQueueSongWithIndex
  );

  useEffect(() => {
    const queueSong =
      currentPlayingIndex === null
        ? null
        : playerStore.getState().queue[currentPlayingIndex];

    setCurrentSong(queueSong || playerStore.getState().queue[0]);
  }, [currentPlayingIndex]);

  return (
    <div className="w-full md:max-w-full 2md:max-w-[380px]">
      {currentSong ? (
        <div className="sticky top-24 2lg:top-8">
          <CurrentSongImage song={currentSong} />
          <div>
            <p className="truncate mt-2 text-lg text-white text-center">
              {currentSong.original_name} -
              <span> {currentSong.album.title}</span>
            </p>
          </div>

          {currentPlayingIndex === null ? (
            <div className="mt-2 text-center">
              <Button onClick={() => setQueueSongWithIndex(0)}>
                Play Queue
              </Button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const QueueHeader = ({ onClickSave }) => {
  const clearQueue = playerStore((state) => state.clearQueue);
  return (
    <div className="flex justify-between items-center flex-wrap gap-4 relative">
      <h2 className="text-white text-[30px]">Manage Your Song Queue</h2>
      <div className="flex justify-center items-center gap-5">
        <ALink
          className={
            "flex items-center gap-2 bg-[#222227] px-4 py-2 rounded-lg group"
          }
          onClick={onClickSave}
        >
          <BookmarkSvg className="w-4 h-4 fill-white group-hover:fill-[#25a564] transition-colors duration-300" />
          Save
        </ALink>
        <ALink onClick={clearQueue} className="text-[16px]">
          Clear Queue
        </ALink>
      </div>
    </div>
  );
};

const QueueList = () => {
  const queue = playerStore((state) => state.queue);
  const removeSong = playerStore((state) => state.removeSong);

  const setContextMenuData = contextMenuStore((state) => state.setData);

  const handleSaveQueue = () => {
    setContextMenuData({
      type: "addtoplaylist",
      songs_id: queue.map((song) => song.id),
    });
  };

  return queue.length ? (
    <>
      <QueueHeader onClickSave={handleSaveQueue} />
      <div className="flex justify-between mt-8 gap-8 flex-wrap sm:flex-nowrap min-w-[260px]">
        <ShowCurrentPlayingSong />
        <div className="grid gap-[15px] grid-cols-1 flex-grow h-fit">
          {queue.map((song, index) => (
            <SongCard3
              index={index}
              key={song.id}
              song={song}
              onClickRemove={() => removeSong(index)}
            />
          ))}
        </div>
      </div>
    </>
  ) : (
    <div className="col-span-full flex justify-center items-center p-8 rounded-lg">
      <div className="text-center">
        <h3 className="text-xl text-white mb-1">No Songs Found</h3>
        <p className="text-gray-400 mb-2">
          Looks like you don't have any songs in your queue yet. Add your first
          one!
        </p>
        <Button>Add Songs</Button>
      </div>
    </div>
  );
};

const Queue = () => {
  document.title = "Manage Queue";
  scrollTo("main-content", { top: 0, behavior: "instant" });
  const user = authConfigStore((state) => state.user);

  if (!user) {
    alert("Please Login To Access This Page!");
    window.location = ROUTES.LOGIN;
    return;
  }

  return (
    <BlurAnimationPageChange>
      <section className="p-[30px]">
        <QueueList />
      </section>
    </BlurAnimationPageChange>
  );
};

export default Queue;
