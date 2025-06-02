import { useState } from "react";
import { SearchInput } from "../../components/Inputs/inputs";
import { useSearchParams } from "react-router-dom";
import { useFilteredAlbums } from "../../api/songs/queryHooks";
import { getParamFromUrl, scrollTo } from "../../api/utils";
import AlbumCard, {
  AlbumCardLoading,
} from "../../components/songcards/albumcard";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";

const FilterAlbumsContainer = ({ albums }) => {
  return (
    <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};

const SearchFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const limit = 24;
  const offsetP = parseInt(searchParams.get("offset")) || 0;

  const [value, setValue] = useState(q);
  const [offset, setOffset] = useState(offsetP);

  const [enteredQ, setEnteredQ] = useState(value);

  const { data, isLoading, isFetching, isError } = useFilteredAlbums(
    enteredQ,
    limit,
    offset
  );

  const handlePageChange = (url) => {
    const gotoffset = parseInt(getParamFromUrl(url, "offset")) || 0;
    setOffset(gotoffset);
    setSearchParams({
      q: value,
      offset: gotoffset,
    });
    scrollTo("main-content", {
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-5 flex-wrap">
        <div className="flex items-center flex-wrap gap-[30px]">
          <div className="w-[220px]">
            <SearchInput
              title="Press Enter To Search"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setOffset(0);
                  setSearchParams({
                    q: e.target.value,
                    offset: 0,
                  });
                  setEnteredQ(e.target.value);
                }
              }}
            />
          </div>
        </div>
      </div>
      {isLoading || isFetching ? (
        <div className="grid gap-[30px] mt-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
          {Array.from({ length: 24 }, (_, index) => (
            <AlbumCardLoading key={index} />
          ))}
        </div>
      ) : isError || data.results.length === 0 ? (
        <div className="py-8 text-center text-xl">No result Found</div>
      ) : (
        <FilterAlbumsContainer albums={data.results} />
      )}
      {!isError &&
      !isLoading &&
      !isFetching &&
      (data?.next || data?.previous) ? (
        <div className="flex justify-center items-center gap-5 mt-8">
          <button
            className="px-3 py-1 rounded-lg hover:bg-[#1e1e1e] disabled:opacity-50"
            disabled={data.previous === null}
            onClick={() => handlePageChange(data.previous)}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 rounded-lg hover:bg-[#1e1e1e] disabled:opacity-50"
            disabled={data.next === null}
            onClick={() => handlePageChange(data.next)}
          >
            Next
          </button>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

const Albums = () => {
  document.title = "Albums";
  scrollTo("main-content", { top: 0, behavior: "instant" });

  return (
    <BlurAnimationPageChange>
      <section className="p-[30px]">
        <div className="flex justify-between items-center flex-wrap">
          <h2 className="text-white text-[30px]">Albums</h2>
        </div>
      </section>
      <section className="p-[30px] border-t border-b border-[#2a2a2a]">
        <SearchFilter />
      </section>
    </BlurAnimationPageChange>
  );
};

export default Albums;
