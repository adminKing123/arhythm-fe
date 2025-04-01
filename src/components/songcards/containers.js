import {
  useGetLatestPlaylists,
  useGetSongsLatestRelease,
  useGlobalSearch,
} from "../../api/songs/queryHooks";
import ROUTES from "../../router/routes";
import AskToAddRequestToAddSong from "../addRequestToAddSong/AskToAddRequestToAddSong";
import { HeroArtistsCarousal } from "../carousals";
import {
  ShowAlbumGR,
  ShowArtistsGR,
  ShowHistoryGR,
  ShowPlaylistsGR,
  ShowSongsGR,
  ShowTagGR,
} from "../globalsearchcardcontainers";
import { NextLink } from "../links/links";
import PlaylistCardLibrary, {
  PlaylistCardLibraryLoading,
} from "./playlistcard";
import SongCard, { SongCardLoading } from "./songcard";

export const NewRelesese = () => {
  const { isLoading, isError, data } = useGetSongsLatestRelease();

  return (
    <>
      <div className="flex justify-between items-center flex-wrap">
        <h2 className="text-white text-[30px]">New Releases</h2>
        <NextLink className="text-[16px]" href={ROUTES.SEARCH}>
          See All
        </NextLink>
      </div>
      {isLoading || isError ? (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {Array.from({ length: 12 }, (_, index) => (
            <SongCardLoading key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {data.results.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </>
  );
};

export const HeroArtists = () => {
  return (
    <>
      <div className="flex justify-between items-center flex-wrap mb-8">
        <h2 className="text-white text-[30px]">Artists</h2>
        <NextLink className="text-[16px]" href={ROUTES.ARTISTS}>
          See All
        </NextLink>
      </div>
      <HeroArtistsCarousal />
    </>
  );
};

export const LibraryPlaylists = () => {
  const { isLoading, isError, data: playlistsData } = useGetLatestPlaylists();

  return (
    <>
      <div className="flex justify-between items-center flex-wrap">
        <h2 className="text-white text-[30px]">Playlists</h2>
        <NextLink className="text-[16px] text-nowrap">See All</NextLink>
      </div>

      {isLoading || isError ? (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <PlaylistCardLibraryLoading key={index} />
          ))}
        </div>
      ) : playlistsData.length ? (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {playlistsData.map((playlist) => {
            return (
              <PlaylistCardLibrary key={playlist.id} playlist={playlist} />
            );
          })}
        </div>
      ) : (
        <div className="col-span-full flex justify-center items-center p-8 rounded-lg">
          <div className="text-center">
            <h3 className="text-xl text-white mb-1">No Playlists Found</h3>
            <p className="text-gray-400 mb-2">
              Looks like you don't have any playlists yet.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export const GlobalSearchContainer = ({ q, handleClose }) => {
  const { isLoading, isFetching, isError, data } = useGlobalSearch(q);

  return (
    <div className="bg-[#16151A] border border-[#222227] rounded-xl top-2 absolute min-w-[280px] w-full max-w-[740px] pt-[70px] px-6 pb-6">
      <div
        id="global-search-container"
        className="max-h-[80vh] overflow-y-auto pr-8 custom2-scroller"
      >
        <ShowHistoryGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.user_history || []}
        />
        <ShowSongsGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.songs || []}
        />
        <ShowSongsGR
          q={q}
          handleClose={handleClose}
          title="Favorites"
          isLoading={isLoading || isFetching || isError}
          data={data?.user_liked_songs.map((item) => item.song) || []}
        />
        <ShowArtistsGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.artists || []}
        />
        <ShowAlbumGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.albums || []}
        />
        <ShowPlaylistsGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.playlists || []}
        />
        <ShowTagGR
          q={q}
          handleClose={handleClose}
          isLoading={isLoading || isFetching || isError}
          data={data?.tags || []}
        />
        {!isLoading &&
        !isFetching &&
        !isError &&
        data.user_history.length === 0 &&
        data.songs.length === 0 &&
        data.user_liked_songs.length === 0 &&
        data.artists.length === 0 &&
        data.albums.length === 0 &&
        data.tags.length === 0 &&
        data.playlists.length === 0 ? (
          <AskToAddRequestToAddSong />
        ) : null}
      </div>
    </div>
  );
};
