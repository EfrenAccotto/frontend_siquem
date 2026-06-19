import axios from 'axios';

export const fetchAllPages = async (baseUrl, params = {}) => {
  const response = await axios.get(baseUrl, { params });
  const status = response.status;
  const data = response.data;

  if (Array.isArray(data)) {
    return {
      data,
      pagination: {
        count: data.length,
        next: null,
        previous: null,
        page: 1,
        pageSize: data.length
      },
      status
    };
  }

  return {
    data: Array.isArray(data?.results) ? data.results : [],
    pagination: {
      count: data?.count ?? 0,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      page: Number(params?.page) || 1,
      pageSize: Number(params?.page_size) || (Array.isArray(data?.results) ? data.results.length : 0)
    },
    status
  };
};
