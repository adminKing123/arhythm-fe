import { Link, useNavigate, useParams } from "react-router-dom";
import {
  formatPlayerTime,
  get_src_uri,
  numeral,
  scrollTo,
} from "../../api/utils";
import { useGetSong, useMoreRelatedSongs } from "../../api/songs/queryHooks";
import { Fragment, useEffect, useRef } from "react";
import { PlaySvg } from "../../assets/svg";
import playerStore from "../../zstore/playerStore";
import SongCard, { SongCardLoading } from "../../components/songcards/songcard";
import ROUTES from "../../router/routes";

const ArtistThumbnail = ({ artist }) => {
  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);
  const navigate = useNavigate();

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
    <div
      ref={imgContainerRef}
      className="w-10 skeleton relative flex flex-col items-center justify-center aspect-square rounded-xl overflow-hidden bg-[#000] group"
      onClick={() => navigate(ROUTES.GET_ARTIST_URI(artist.id))}
    >
      <img
        ref={imgRef}
        loading="lazy"
        className="opacity-0 absolute top-0 left-0 w-full aspect-square group-hover:scale-[1.08] transition-all duration-500"
        alt={artist.name}
        title={artist.name}
        src={get_src_uri(artist.thumbnail300x300)}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

const Thumbnail = ({ song }) => {
  const imgRef = useRef(null);
  const imgContainerRef = useRef(null);
  const setSong = playerStore((state) => state.setSong);

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
    <>
      <img
        alt="thumbnail"
        src={get_src_uri(song.album.thumbnail300x300)}
        className="object-cover w-full h-full absolute top-0 left-0 blur-3xl"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={imgContainerRef}
        className="w-64 skeleton relative flex flex-col items-center justify-center aspect-square rounded-xl overflow-hidden bg-[#000] group"
      >
        <img
          ref={imgRef}
          loading="lazy"
          className="opacity-0 absolute top-0 left-0 w-full aspect-square group-hover:scale-[1.08] transition-all duration-500"
          alt={song.album.id}
          src={get_src_uri(song.album.thumbnail300x300)}
          onContextMenu={(e) => e.preventDefault()}
        />
        <Link
          onClick={() => {
            setSong(song);
          }}
          className="flex justify-center items-center w-10 h-10 rounded-lg sm:w-14 sm:h-14 sm:rounded-xl bg-[#222227] relative scale-[0.8] opacity-0 group-hover:scale-[1] group-hover:opacity-100 transition-all duration-500"
        >
          <PlaySvg className="w-5 h-5 fill-white sm:w-6 sm:h-6" />
        </Link>
      </div>
    </>
  );
};

const MoreRelatedSongs = () => {
  const id = useParams().id;
  const { data: songs, isLoading, isError } = useMoreRelatedSongs(id);

  return (
    <section className="px-5 mt-8">
      <h3 className="text-2xl font-semibold text-white mb-4">
        More Related Songs
      </h3>
      {isLoading || isError ? (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {Array.from({ length: 12 }, (_, index) => (
            <SongCardLoading key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </section>
  );
};

const Details = () => {
  const id = useParams().id;
  const { data: song, isLoading } = useGetSong(id, true);

  if (isLoading)
    return (
      <div className="p-5">
        <div className="w-64 rounded-xl aspect-square skeleton"></div>
      </div>
    );

  document.title = song.original_name;
  return (
    <section className="p-5 flex items-end gap-6 relative">
      <Thumbnail song={song} />
      <div className="relative">
        <h3 className="text-3xl text-white font-semibold">
          {song.original_name}
        </h3>
        <h6 className="text-lg mt-2 text-white">
          {song.album.title} • {song.album.year}
        </h6>
        <p className="text-xs text-white">
          {formatPlayerTime(song.duration, "")} • {numeral(song.count)}{" "}
          listeners • {numeral(song.liked_count)} likes
        </p>
        <p className="text-xs text-white">
          {song.tags.map((tag, index) => (
            <Fragment key={tag.id}>
              <Link className="hover:text-[#25a564] transition-colors duration-300">
                {tag.name}
              </Link>
              {index < song.tags.length - 1 && ", "}
            </Fragment>
          ))}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {song.artists.map((artist) => (
            <ArtistThumbnail key={artist.id} artist={artist} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Song = () => {
  document.title = "Song";
  const id = useParams().id;

  useEffect(() => {
    scrollTo("main-content", { top: 0, behavior: "instant" });
  }, [id]);

  return (
    <>
      <Details />
      <MoreRelatedSongs />
    </>
  );
};

export default Song;
