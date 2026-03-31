import axios from 'axios';

export const fetchAllPages = async (baseUrl, params = {}) => {
  let url = baseUrl;
  let first = true;
  let items = [];
  let pagination = {};
  let status = 200;

  while (url) {
    const response = await axios.get(url, { params: first ? params : undefined });
    status = response.status;
    const data = response.data;

    if (Array.isArray(data)) {
      return {
        data,
        pagination: {
          count: data.length,
          next: null,
          previous: null
        },
        status
      };
    }

    const pageItems = Array.isArray(data?.results) ? data.results : [];
    items = items.concat(pageItems);
    pagination = {
      count: data?.count ?? items.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null
    };

    if (!data?.next) {
      break;
    }

    url = data.next;
    first = false;
  }

  return {
    data: items,
    pagination,
    status
  };
};
