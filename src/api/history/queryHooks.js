import { useInfiniteQuery } from "react-query";
import QUERY_KEYS from "../querykeys";
import { getHistorySongs } from "./queryFunctions";

export const useHistorySongsInfinite = (limit = 24, config = {}) =>
  useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_HISTORY_SONGS],
    queryFn: ({ pageParam = 0 }) =>
      getHistorySongs({ limit, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.reduce(
        (total, page) => total + page.results.length,
        0
      );
      return lastPage?.next ? nextOffset : undefined;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...config,
  });
