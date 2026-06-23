import axios from 'axios';

const resolveNextUrl = (nextUrl, baseUrl) => {
  if (!nextUrl) return null;
  try {
    return new URL(nextUrl, baseUrl).toString();
  } catch {
    return nextUrl;
  }
};

export const fetchAllPages = async (baseUrl, params = {}, config = {}) => {
  let nextUrl = baseUrl;
  let isFirstRequest = true;
  let items = [];
  let pagination = {
    count: 0,
    next: null,
    previous: null,
    page: Number(params?.page) || 1,
    pageSize: Number(params?.page_size) || 0
  };
  let status = 200;

  while (nextUrl) {
    const response = await axios.get(
      nextUrl,
      isFirstRequest ? { ...config, params } : config
    );
    status = response.status;
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
        status
      };
    }

    const pageItems = Array.isArray(payload?.results) ? payload.results : [];
    items = items.concat(pageItems);
    pagination = {
      count: Number(payload?.count) || items.length,
      next: payload?.next ?? null,
      previous: payload?.previous ?? null,
      page: Number(params?.page) || 1,
      pageSize: Number(params?.page_size) || items.length
    };

    if (!payload?.next) break;

    nextUrl = resolveNextUrl(payload.next, baseUrl);
    isFirstRequest = false;
  }

  return {
    data: items,
    pagination,
    status
  };
};
