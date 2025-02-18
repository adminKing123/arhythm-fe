import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import {
  addSongsInPlaylist,
  createPlaylist,
  deleteSongsFromPlaylist,
  getPlaylists,
  getPlaylistSongs,
} from "./queryFunctions";
import QUERY_KEYS from "../querykeys";

export const useCreatePlaylistMutation = (config = {}) =>
  useMutation({
    mutationFn: (payload) => createPlaylist(payload),
    mutationKey: [QUERY_KEYS.CREATE_PLAYLIST],
    ...config,
  });

export const usePlaylists = (song_id, limit = 24, offset = 0, config = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.GET_PLAYLISTS, song_id, limit, offset],
    queryFn: () => getPlaylists({ song_id, limit, offset }),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...config,
  });

export const useAddSongsInPlaylistMutation = (config = {}) =>
  useMutation({
    mutationFn: (payload) => addSongsInPlaylist(payload),
    mutationKey: [QUERY_KEYS.ADD_SONGS_IN_PLAYLIST],
    ...config,
  });

export const useDeleteSongsFromPlaylistMutation = (id, config = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => deleteSongsFromPlaylist(payload),
    mutationKey: [QUERY_KEYS.DELETE_SONGS_IN_PLAYLIST, id],
    onMutate: async (data) => {
      await queryClient.cancelQueries([QUERY_KEYS.GET_PLAYLIST_SONGS, id]);
      const previousData = queryClient.getQueryData([
        QUERY_KEYS.GET_PLAYLIST_SONGS,
        id,
      ]);

      if (!previousData) return previousData;

      const newData = {
        ...previousData,
        pages: previousData.pages.map((page) => ({
          ...page,
          results: page.results.filter(
            (item) => !data.songs_id.includes(item.song.id)
          ),
        })),
      };

      queryClient.setQueryData([QUERY_KEYS.GET_PLAYLIST_SONGS, id], newData);

      if (
        newData.pages.reduce((total, page) => total + page.results.length, 0) <
        18
      )
        queryClient.fetchInfiniteQuery([QUERY_KEYS.GET_PLAYLIST_SONGS, id]);
    },
    ...config,
  });
};

export const usePlaylistSongsInfinite = (id, limit = 24, config = {}) =>
  useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_PLAYLIST_SONGS, id],
    queryFn: ({ pageParam = 0 }) =>
      getPlaylistSongs({ id, limit, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.reduce(
        (total, page) => total + page.results.length,
        0
      );
      console.log(nextOffset);
      return lastPage?.next ? nextOffset : undefined;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...config,
  });
