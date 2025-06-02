import api from "..";
import API_ENDPOINTS from "../endpoints";

export const getHistorySongs = async (data) => {
  const response = await api({
    method: "GET",
    url: API_ENDPOINTS.GET_HISTORY_SONGS,
    params: {
      limit: data?.limit || 12,
      offset: data?.offset || 0,
    },
  });

  return response.data;
};
