import React, { useEffect } from "react";
import { useHistorySongsInfinite } from "../../api/history/queryHooks";
import { formatDateTime, groupByDate, scrollTo } from "../../api/utils";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";
import {
  HistorySongCard,
  HistorySongCardLoading,
} from "../../components/songcards/songcard";
import ROUTES from "../../router/routes";
import authConfigStore from "../../zstore/authConfigStore";
import { SearchSvg } from "../../assets/svg";

const SongsList = ({ data, isFetchingNextPage, hasNextPage }) => {
  const groupedData = groupByDate(data);

  return (
    <div className="flex flex-col gap-[30px]">
      {Object.keys(groupedData).map((date) => (
        <div key={date} className="mt-4">
          <h3 className="text-xl text-white mb-4">{formatDateTime(date)}</h3>
          <div className="flex flex-col gap-4">
            {groupedData[date].map((history_song) => (
              <HistorySongCard key={history_song.id} song={history_song.song} />
            ))}
          </div>
        </div>
      ))}

      {isFetchingNextPage && hasNextPage && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <HistorySongCardLoading key={index} />
          ))}
        </div>
      )}
    </div>
  );
};

const Options = () => {
  return (
    <div className="hidden 2md:block sticky top-0 h-screen p-[30px] rounded-lg pt-32 px-32">
      <div className="flex justify-between items-center gap-3">
        <SearchSvg className="flex-shrink-0 w-6 h-6 fill-white" />
        <input
          className="bg-transparent border-b flex-grow outline-none"
          placeholder="Search History"
        ></input>
      </div>
    </div>
  );
};

const Listing = () => {
  const {
    isError,
    isLoading,
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useHistorySongsInfinite(24, {
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
        <section>
          <div className="flex flex-col gap-[30px] mt-8 p-[30px]">
            {Array.from({ length: 24 }).map((_, index) => (
              <HistorySongCardLoading key={index} />
            ))}
          </div>
        </section>
      </>
    );

  return (
    <section className="p-[30px]">
      <h2 className="text-white text-[30px]">History</h2>
      <SongsList
        data={data.pages}
        playlist={data.pages[0].playlist}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    </section>
  );
};

const History = () => {
  document.title = "History";
  scrollTo("main-content", { top: 0, behavior: "instant" });
  const user = authConfigStore((state) => state.user);

  if (!user) {
    alert("Please Login To Access This Page!");
    window.location = ROUTES.LOGIN;
    return;
  }

  return (
    <BlurAnimationPageChange>
      <div className="grid grid-cols-1 gap-3 2md:grid-cols-2">
        <Listing />
        <Options />
      </div>
    </BlurAnimationPageChange>
  );
};
export default History;
