import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { get_src_uri, numeral, scrollTo } from "../../api/utils";
import SongCard, { SongCardLoading } from "../../components/songcards/songcard";
import { useArtistSongsInfinite } from "../../api/artists/queryHooks";
import Button from "../../components/buttons/buttons";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";

const ArtistHeader = ({ artist, count }) => {
  return (
    <section className="p-5 flex items-end gap-6 relative bg-black">
      <img
        alt="thumbnail"
        src={get_src_uri(artist.thumbnail300x300)}
        className="object-cover w-full h-full absolute top-0 left-0 blur-3xl"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="w-64 aspect-square rounded overflow-hidden relative">
        <img
          alt="thumbnail"
          src={get_src_uri(artist.thumbnail300x300)}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="relative mb-2">
        <h3 className="text-3xl font-bold text-white">{artist.name}</h3>
        <p className="text-white text-sm">
          {numeral(count)} songs • 0 followers
        </p>
        <div className="relative mt-3">
          <Button>Follow</Button>
        </div>
      </div>
    </section>
  );
};

const SongsList = ({ data, isFetchingNextPage, hasNextPage }) => {
  return (
    <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 px-5">
      {data.map((page, index) => (
        <React.Fragment key={index}>
          {page.results.map((artist_song) => (
            <SongCard key={artist_song.id} song={artist_song.song} />
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
  } = useArtistSongsInfinite(id, 24, {
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

  document.title = data.pages[0].artist.name;
  return (
    <>
      <ArtistHeader artist={data.pages[0].artist} count={data.pages[0].count} />
      <section>
        <SongsList
          data={data.pages}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
        />
      </section>
    </>
  );
};

const Artist = () => {
  const id = useParams().id;
  document.title = "Artist";

  useEffect(() => {
    scrollTo("main-content", { top: 0, behavior: "instant" });
  }, [id]);

  return (
    <BlurAnimationPageChange>
      <Listing />;
    </BlurAnimationPageChange>
  );
};

export default Artist;
