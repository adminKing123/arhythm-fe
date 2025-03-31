import { ALink, ArtistsLinks } from "../../components/links/links";
import { formatPlayerTime, get_src_uri, numeral } from "../../api/utils";
import {
  AddSvg,
  AddToQueueSvg,
  CheckMarkSvg,
  HeadphoneSvg,
  PlaylistsSvg,
  PlaySvg,
  RemoveSvg,
} from "../../assets/svg";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import playerStore from "../../zstore/playerStore";
import authConfigStore from "../../zstore/authConfigStore";
import contextMenuStore from "../../zstore/contextMenuStore";
import ROUTES from "../../router/routes";

const SongCard = ({
  song,
  renderedOn = "songs",
  extraContextData = {},
  setCallback,
}) => {
  const setSong = playerStore((state) => state.setSong);
  const setContextMenuData = contextMenuStore((state) => state.setData);

  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuData({
      type: "song",
      song,
      x: e.clientX,
      y: e.clientY,
      renderedOn,
      extraContextData,
    });
  };

  useEffect(() => {
    const imgEle = imgRef.current;
    const imgContainerEle = imgContainerRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
      imgContainerEle.classList.remove("skeleton");
      imgContainerEle.classList.add("group-hover:opacity-[0.6]");
    };

    if (imgEle && imgContainerRef) {
      if (imgEle.complete) handleLoaded();
      else imgEle.addEventListener("load", handleLoaded);

      return () => {
        imgEle.removeEventListener("load", handleLoaded);
      };
    }
  }, [imgRef, imgContainerRef]);

  return (
    <div>
      <div
        ref={imgContainerRef}
        onContextMenu={handleContextMenu}
        className="skeleton relative flex flex-col items-center justify-center w-full aspect-square rounded-xl overflow-hidden bg-[#000] group"
      >
        <img
          ref={imgRef}
          loading="lazy"
          className="opacity-0 absolute top-0 left-0 w-full aspect-square group-hover:scale-[1.08] transition-all duration-500"
          alt={song.album.id}
          src={get_src_uri(song.album.thumbnail300x300)}
        />
        <span
          onClick={() => {
            setSong(song);
            setCallback?.(song);
          }}
          className="cursor-pointer flex justify-center items-center w-10 h-10 rounded-lg sm:w-14 sm:h-14 sm:rounded-xl bg-[#222227] relative scale-[0.8] opacity-0 group-hover:scale-[1] group-hover:opacity-100 transition-all duration-500"
        >
          <PlaySvg className="w-5 h-5 fill-white sm:w-6 sm:h-6" />
        </span>
        <span className="absolute flex items-center justify-center w-full bottom-1 sm:bottom-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <Link className="text-white fill-white text-[13px] mr-[15px] flex items-center gap-1">
            <PlaylistsSvg className="w-[13px] h-[13px]" />
            {numeral(song?.playlists_count || 0)}
          </Link>
          <Link className="text-white fill-white text-[13px] mr-[15px] flex items-center gap-1">
            <HeadphoneSvg className="w-[13px] h-[13px]" />
            {numeral(song.count)}
          </Link>
        </span>
      </div>
      <p className="mt-2 text-white truncate">
        <ALink href={ROUTES.GET_SONG_URI(song.id)}>{song.original_name}</ALink>
      </p>
      <p className="text-sm truncate">
        <ArtistsLinks artists={song.artists} />
      </p>
    </div>
  );
};

export const SongCardLoading = () => {
  return (
    <div>
      <div className="w-full aspect-square rounded-xl skeleton"></div>
      <div className="w-1/2 rounded h-[16px] mt-2 skeleton"></div>
      <div className="w-3/4 rounded skeleton h-[10px]"></div>
    </div>
  );
};

export const SongCard2 = ({ song, setCallback }) => {
  const setSong = playerStore((state) => state.setSong);
  const addToQueue = playerStore((state) => state.addSong);
  const user = authConfigStore((state) => state.user);
  const setContextMenuData = contextMenuStore((state) => state.setData);

  const [addedToQueue, setAddedToQueue] = useState(false);

  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);

  const handleSelect = () => {
    setSong(song);
    setCallback?.(song);
  };

  const handleAddedToQueue = () => {
    if (addedToQueue) return;
    addToQueue(song);
    setAddedToQueue(true);
  };

  const handleAddToPlaylist = () => {
    setContextMenuData({
      type: "addtoplaylist",
      song: song,
    });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuData({
      type: "song",
      song,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    const imgEle = imgRef.current;
    const imgContainerEle = imgContainerRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
      imgContainerEle.classList.remove("skeleton");
      imgContainerEle.classList.add("group-hover:opacity-[0.6]");
    };

    if (imgEle && imgContainerRef) {
      if (imgEle.complete) handleLoaded();
      else imgEle.addEventListener("load", handleLoaded);

      return () => {
        imgEle.removeEventListener("load", handleLoaded);
      };
    }
  }, [imgRef, imgContainerRef]);

  return (
    <div className="flex justify-between items-center rounded-lg bg-[#1c1c1c] py-2 px-4">
      <div className="flex items-center truncate">
        <div
          ref={imgContainerRef}
          onContextMenu={handleContextMenu}
          className="skeleton overflow-hidden w-12 h-12 flex-shrink-0 rounded-lg relative flex flex-col items-center justify-center group"
        >
          <img
            loading="lazy"
            ref={imgRef}
            className="w-12 h-12 opacity-0 transition-opacity duration-500 absolute top-0 left-0"
            src={get_src_uri(song.album.thumbnail300x300)}
            alt={song.album.id}
          />
          <span
            onClick={handleSelect}
            className="cursor-pointer bg-[#000000af] flex justify-center items-center w-12 h-12 rounded-lg sm:w-14 sm:h-14 sm:rounded-xl relative opacity-0 group-hover:opacity-100 transition-all duration-500"
          >
            <PlaySvg className="w-5 h-5 fill-[#25a56a] sm:w-6 sm:h-6" />
          </span>
        </div>
        <div className="ml-[15px] truncate">
          <ALink
            href={ROUTES.GET_SONG_URI(song.id)}
            className="block text-base text-white truncate"
          >
            {song.original_name}
          </ALink>
          <ArtistsLinks className="text-sm truncate" artists={song.artists} />
        </div>
      </div>
      <div className="flex items-center gap-[15px]">
        {user ? (
          <>
            <button
              onClick={handleAddToPlaylist}
              className="w-8 h-8 bg-[#25a56a26] flex justify-center items-center rounded-lg"
            >
              <AddSvg className="w-[18px] h-[18px] fill-[#25a56a]" />
            </button>
            <button
              onClick={handleAddedToQueue}
              className="w-8 h-8 bg-[#8051d426] flex justify-center items-center rounded-lg"
            >
              {addedToQueue ? (
                <CheckMarkSvg className="w-[18px] h-[18px] fill-[#8051d4]" />
              ) : (
                <AddToQueueSvg className="w-[18px] h-[18px] fill-[#8051d4]" />
              )}
            </button>
          </>
        ) : null}
        <span className="text-sm w-10">
          {formatPlayerTime(song.duration, "")}
        </span>
      </div>
    </div>
  );
};

export const SongCard2Loading = () => {
  return (
    <div className="flex justify-between items-center rounded-lg bg-[#1c1c1c] py-2 px-4">
      <div className="flex items-center">
        <div className="skeleton overflow-hidden w-12 h-12 flex-shrink-0 rounded-lg"></div>
        <div className="ml-[15px] flex flex-col">
          <div className="w-32 rounded h-[16px] skeleton"></div>
          <div className="w-24 rounded h-[12px] skeleton mt-2"></div>
        </div>
      </div>
      <div className="flex items-center gap-[15px]">
        <div className="w-8 h-8 skeleton rounded-lg"></div>
        <div className="w-8 h-8 skeleton rounded-lg"></div>
        <div className="w-12 h-[12px] skeleton"></div>
      </div>
    </div>
  );
};

export const SongCard3 = ({ index, song, setCallback, onClickRemove }) => {
  const setQueueSongWithIndex = playerStore(
    (state) => state.setQueueSongWithIndex
  );
  const currentSong = playerStore((state) => state.song);
  const user = authConfigStore((state) => state.user);

  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);

  const handleSelect = () => {
    setQueueSongWithIndex(index);
    setCallback?.(song);
  };

  useEffect(() => {
    const imgEle = imgRef.current;
    const imgContainerEle = imgContainerRef.current;

    const handleLoaded = () => {
      imgEle.classList.remove("opacity-0");
      imgContainerEle.classList.remove("skeleton");
      imgContainerEle.classList.add("group-hover:opacity-[0.6]");
    };

    if (imgEle && imgContainerRef) {
      if (imgEle.complete) handleLoaded();
      else imgEle.addEventListener("load", handleLoaded);

      return () => {
        imgEle.removeEventListener("load", handleLoaded);
      };
    }
  }, [imgRef, imgContainerRef]);

  return (
    <div className="flex justify-between items-center rounded-lg bg-[#1c1c1c] py-2 px-4">
      <div className="flex items-center truncate">
        <div
          ref={imgContainerRef}
          className="skeleton overflow-hidden w-12 h-12 flex-shrink-0 rounded-lg relative flex flex-col items-center justify-center group"
        >
          <img
            loading="lazy"
            ref={imgRef}
            className="w-12 h-12 opacity-0 transition-opacity duration-500 absolute top-0 left-0"
            src={get_src_uri(song.album.thumbnail300x300)}
            alt={song.album.id}
            onContextMenu={(e) => e.preventDefault()}
          />
          <span
            onClick={handleSelect}
            className={`cursor-pointer bg-[#000000af] flex justify-center items-center w-12 h-12 rounded-lg sm:w-14 sm:h-14 sm:rounded-xl relative ${
              currentSong?.id === song.id
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-all duration-500`}
          >
            <PlaySvg className="w-5 h-5 fill-[#25a56a] sm:w-6 sm:h-6" />
          </span>
        </div>
        <div className="ml-[15px] truncate">
          <ALink
            href={ROUTES.GET_SONG_URI(song.id)}
            className="block text-base text-white truncate"
          >
            {song.original_name}
          </ALink>
          <ArtistsLinks className="text-sm truncate" artists={song.artists} />
        </div>
      </div>
      <div className="flex items-center gap-[15px]">
        {user ? (
          <>
            <button
              onClick={onClickRemove}
              className="w-8 h-8 bg-[#a5252526] flex justify-center items-center rounded-lg opacity-50 hover:opacity-100 transition-opacity duration-300"
            >
              <RemoveSvg className="w-[18px] h-[18px] fill-[#a52525]" />
            </button>
          </>
        ) : null}
        <span className="text-sm w-10">
          {formatPlayerTime(song.duration, "")}
        </span>
      </div>
    </div>
  );
};

export default SongCard;
