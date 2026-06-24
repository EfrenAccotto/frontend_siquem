import axios from 'axios';

export const fetchAllPages = async (baseUrl, params = {}, config = {}) => {
  let nextUrl = baseUrl;
  let isFirstRequest = true;
  let items = [];
  let pagination = { count: 0, next: null, previous: null };
  let status = 200;
  const visitedUrls = new Set();

  while (nextUrl) {
    if (visitedUrls.has(nextUrl)) {
      throw new Error('La API devolvio un ciclo de paginacion');
    }
    visitedUrls.add(nextUrl);

    const requestConfig = isFirstRequest ? { ...config, params } : config;
    const response = await axios.get(nextUrl, requestConfig);
    const payload = response.data;
    status = response.status;

    if (Array.isArray(payload)) {
      items = items.concat(payload);
      pagination = {
        count: items.length,
        next: null,
        previous: null
      };
      break;
    }

    const pageItems = Array.isArray(payload?.results) ? payload.results : [];
    items = items.concat(pageItems);
    pagination = {
      count: Number(payload?.count) || items.length,
      next: payload?.next ?? null,
      previous: payload?.previous ?? null
    };

    nextUrl = pagination.next;
    isFirstRequest = false;
  }

  return { data: items, pagination, status };
};
