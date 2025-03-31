import { useEffect, useState } from "react";
import { SearchInput } from "../../components/Inputs/inputs";
import DropDown from "../../components/selectors/dropdown";
import SortOptions from "../../components/selectors/sortoptions";
import { useSearchParams } from "react-router-dom";
import pageItemsStore from "../../zstore/pageItemsStore";
import { useFilteredSongs } from "../../api/songs/queryHooks";
import {
  SongCard2,
  SongCard2Loading,
} from "../../components/songcards/songcard";
import { getParamFromUrl, scrollTo } from "../../api/utils";
import AskToAddRequestToAddSong from "../../components/addRequestToAddSong/AskToAddRequestToAddSong";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";

const FilterSongsContainer = ({ songs }) => {
  return (
    <div className="grid gap-[15px] mt-8 grid-cols-1 md:grid-cols-2">
      {songs.map((song) => (
        <SongCard2 key={song.id} song={song} />
      ))}
    </div>
  );
};

const SearchFilter = () => {
  const dropdownOptions = [
    { id: 1, name: "All Songs", index: 0 },
    { id: 2, name: "Legacy Artists", index: 1 },
    { id: 3, name: "Albums", index: 2 },
    { id: 4, name: "Genres", index: 3 },
    { id: 5, name: "Release Year", index: 4 },
  ];
  const sortOptions = [
    {
      id: 1,
      name: "Featured",
      index: 0,
    },
    {
      id: 2,
      name: "Popular",
      index: 1,
    },
    {
      id: 3,
      name: "Newest",
      index: 2,
    },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const index = parseInt(searchParams.get("index")) || 0;
  const sortByIndexP = parseInt(searchParams.get("sortby")) || 0;
  const limit = 24;
  const offsetP = parseInt(searchParams.get("offset")) || 0;

  const [value, setValue] = useState(q);
  const [searchBy, setSearchBy] = useState(dropdownOptions[index]);
  const [sortBy, setSortBy] = useState(sortOptions[sortByIndexP]);
  const [offset, setOffset] = useState(offsetP);

  const setShowGlobalSearch = pageItemsStore(
    (state) => state.setShowGlobalSearch
  );

  const [enteredQ, setEnteredQ] = useState(value);

  const { data, isLoading, isFetching, isError } = useFilteredSongs(
    enteredQ,
    searchBy.id,
    sortBy.id,
    limit,
    offset
  );

  const handlePageChange = (url) => {
    const gotoffset = parseInt(getParamFromUrl(url, "offset")) || 0;
    setOffset(gotoffset);
    setSearchParams({
      q: value,
      index: searchBy.index,
      offset: gotoffset,
      sortby: sortBy.index,
    });
    scrollTo("main-content", {
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    setShowGlobalSearch(false);
    return () => setShowGlobalSearch(true);
  }, [setShowGlobalSearch]);

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
                    index: searchBy.index,
                    offset: 0,
                    sortby: sortBy.index,
                  });
                  setEnteredQ(e.target.value);
                }
              }}
            />
          </div>
          <div>
            <DropDown
              value={searchBy}
              setValue={setSearchBy}
              options={dropdownOptions}
              onChange={(selected) => {
                setEnteredQ(value);
                setOffset(0);
                setSearchParams({
                  q: value,
                  index: selected.index,
                  offset: 0,
                  sortby: sortBy.index,
                });
              }}
            />
          </div>
        </div>
        <SortOptions
          defaultIndex={sortByIndexP}
          value={sortBy}
          setValue={setSortBy}
          options={sortOptions}
          onChange={(item) => {
            setOffset(0);
            setEnteredQ(value);
            setSearchParams({
              q: value,
              index: searchBy.index,
              offset: 0,
              sortby: item.index,
            });
          }}
        />
      </div>
      {isLoading || isFetching ? (
        <div className="grid gap-[15px] mt-8 grid-cols-1 md:grid-cols-2">
          {Array.from({ length: 24 }, (_, index) => (
            <SongCard2Loading key={index} />
          ))}
        </div>
      ) : isError || data.results.length === 0 ? (
        <AskToAddRequestToAddSong />
      ) : (
        <FilterSongsContainer songs={data.results} />
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

const Search = () => {
  document.title = "Search";
  scrollTo("main-content", { top: 0, behavior: "instant" });

  return (
    <BlurAnimationPageChange>
      <section className="p-[30px]">
        <div className="flex justify-between items-center flex-wrap">
          <h2 className="text-white text-[30px]">Search</h2>
        </div>
      </section>
      <section className="p-[30px] border-t border-b border-[#2a2a2a]">
        <SearchFilter />
      </section>
    </BlurAnimationPageChange>
  );
};

export default Search;
