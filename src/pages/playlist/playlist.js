import React, { useEffect, useState } from "react";
import { usePlaylistSongsInfinite } from "../../api/playlists/queryHooks";
import { useParams } from "react-router-dom";
import { get_src_uri, numeral, scrollTo } from "../../api/utils";
import SongCard, { SongCardLoading } from "../../components/songcards/songcard";
import { PauseSvg, PlaySvg, RandomSvg } from "../../assets/svg";
import playerStore from "../../zstore/playerStore";

const ShuffleToPlayPlaylist = ({ playlist }) => {
  const getRandomSongFromPlaylist = playerStore(
    (state) => state.getRandomSongFromPlaylist
  );

  const loadingSongFromURI = playerStore((state) => state.loadingSongFromURI);

  const handleClick = () => {
    playerStore.setState({ currentPlaylist: { playlist } });
    getRandomSongFromPlaylist();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loadingSongFromURI}
      className="bg-transparent border h-11 px-3 flex items-center justify-center rounded-full"
    >
      <span className="text-white mr-2">Shuffle</span>
      <RandomSvg className="fill-white w-3 h-3" />
    </button>
  );
};

const PlaylistPlayButton = ({ playlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playby = playerStore((state) => state.playby);
  const getNextFromPlaylist = playerStore((state) => state.getNextFromPlaylist);
  const currentPlaylist = playerStore((state) => state.currentPlaylist);
  const loadingSongFromURI = playerStore((state) => state.loadingSongFromURI);

  const handleAudioPlay = () => {
    const audioEle = document
      .getElementById("audio-player-container")
      ?.getElementsByTagName("audio")?.[0];

    if (currentPlaylist?.playlist?.id === playlist?.id) {
      if (audioEle?.paused) {
        audioEle?.play();
      } else {
        audioEle?.pause();
      }
    } else {
      playerStore.setState({
        currentPlaylist: { playlist },
        playoption: "playlistonce",
        playby: "playlist",
      });
      getNextFromPlaylist();
    }
  };

  useEffect(() => {
    const audioEle = document
      .getElementById("audio-player-container")
      ?.getElementsByTagName("audio")?.[0];

    const handlePlayPauseEvent = () => {
      setIsPlaying(audioEle.paused ? false : true);
    };

    if (audioEle) {
      audioEle.addEventListener("play", handlePlayPauseEvent);
      audioEle.addEventListener("pause", handlePlayPauseEvent);
      return () => {
        audioEle.removeEventListener("play", handlePlayPauseEvent);
        audioEle.removeEventListener("pause", handlePlayPauseEvent);
      };
    }
  }, []);

  if (
    isPlaying &&
    playby === "playlist" &&
    currentPlaylist?.playlist?.id === playlist?.id
  )
    return (
      <button
        onClick={handleAudioPlay}
        disabled={loadingSongFromURI}
        className="bg-[#3be477] w-11 h-11 flex items-center justify-center rounded-full"
      >
        <PauseSvg className="fill-white ml-0.5 w-6 h-6" />
      </button>
    );
  return (
    <button
      onClick={handleAudioPlay}
      disabled={loadingSongFromURI}
      className="bg-[#3be477] w-11 h-11 flex items-center justify-center rounded-full"
    >
      <PlaySvg className="fill-white ml-0.5 w-5 h-5" />
    </button>
  );
};

const PlaylistHeader = ({ playlist }) => {
  const [thumbnail, setThumbnail] = useState(playlist.thumbnail);
  const playby = playerStore((state) => state.playby);
  const song = playerStore((state) => state.song);
  const currentPlaylist = playerStore((state) => state.currentPlaylist);

  useEffect(() => {
    if (
      currentPlaylist?.playlist?.id === playlist?.id &&
      playby === "playlist" &&
      song
    ) {
      setThumbnail(song.album.thumbnail300x300);
    }
  }, [playby, currentPlaylist, song, playlist?.id]);

  return (
    <section className="p-5 flex items-end gap-6 relative bg-black">
      <img
        alt="thumbnail"
        src={get_src_uri(thumbnail)}
        className="object-cover w-full h-full absolute top-0 left-0 blur-3xl"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="w-64 aspect-square rounded overflow-hidden relative">
        <img
          alt="thumbnail"
          src={get_src_uri(thumbnail)}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="relative mb-2">
        <p className="text-white text-xs ml-1">
          Playlist • <span className="text-white">{playlist.privacy_type}</span>
        </p>
        <h3 className="text-6xl font-bold text-white">{playlist.name}</h3>
        <p className="text-white text-sm">
          <span className="text-white">@{playlist.author.username}</span> •{" "}
          {numeral(playlist.songs_count)} songs
        </p>
        <div className="mt-3 relative flex items-center gap-3">
          <PlaylistPlayButton playlist={playlist} />
          <ShuffleToPlayPlaylist playlist={playlist} />
        </div>
      </div>
    </section>
  );
};

const SongsList = ({ data, playlist, isFetchingNextPage, hasNextPage }) => {
  const setSongFromPlaylist = playerStore((state) => state.setSongFromPlaylist);
  return (
    <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 px-5">
      {data.map((page, index) => (
        <React.Fragment key={index}>
          {page.results.map((playlist_song) => (
            <SongCard
              key={playlist_song.id}
              song={playlist_song.song}
              setCallback={() =>
                setSongFromPlaylist(
                  playlist_song.id,
                  playlist_song.song,
                  playlist
                )
              }
              renderedOn="playlistsong"
              extraContextData={{ playlist }}
            />
          ))}
        </React.Fragment>
      ))}
      {isFetchingNextPage && hasNextPage
        ? Array.from({ length: 6 }).map((_, index) => (
            <SongCardLoading key={index} />
          ))
        : null}
    </div>
  );
};

const Listing = () => {
  const id = parseInt(useParams().id);
  const {
    isError,
    isLoading,
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = usePlaylistSongsInfinite(id, 24, {
    cacheTime: 0,
  });

  useEffect(() => {
    const handleScroll = (e) => {
      const bottom =
        e.target.scrollTop + e.target.clientHeight > e.target.scrollHeight - 10;
      if (bottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError)
    return <div className="text-center text-xl mt-4">No Result Found</div>;
  if (isLoading)
    return (
      <>
        <div className="h-[290px] w-full skeleton mb-5"></div>
        <section>
          <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 px-5">
            {Array.from({ length: 24 }).map((_, index) => (
              <SongCardLoading key={index} />
            ))}
          </div>
        </section>
      </>
    );

  document.title = data.pages[0].playlist.name;
  return (
    <>
      <PlaylistHeader playlist={data.pages[0].playlist} />
      <section>
        <SongsList
          data={data.pages}
          playlist={data.pages[0].playlist}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
        />
      </section>
    </>
  );
};

const Playlist = () => {
  document.title = "Playlist";
  scrollTo("main-content", { top: 0, behavior: "instant" });
  return <Listing />;
};

export default Playlist;
