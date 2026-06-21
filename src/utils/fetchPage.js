import axios from 'axios';

export const fetchPage = async (url, params = {}, config = {}) => {
  const response = await axios.get(url, { ...config, params });
  const payload = response.data;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      pagination: {
        count: payload.length,
        next: null,
        previous: null,
        page: 1,
        pageSize: payload.length
      },
      status: response.status
    };
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];
  return {
    data: results,
    pagination: {
      count: Number(payload?.count) || 0,
      next: payload?.next ?? null,
      previous: payload?.previous ?? null,
      page: Number(params.page) || 1,
      pageSize: Number(params.page_size) || results.length
    },
    status: response.status
  };
};
