import axios from 'axios';

const resolveNextUrl = (nextUrl, baseUrl) => {
  if (!nextUrl) return null;
  try {
    const isAbsoluteBaseUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(baseUrl);
    const fallbackOrigin = globalThis.location?.origin || 'http://localhost';
    const configuredBaseUrl = new URL(baseUrl, fallbackOrigin);
    const resolvedUrl = new URL(nextUrl, configuredBaseUrl);

    // DRF can build `next` with an internal host. Keep the configured API origin.
    resolvedUrl.protocol = configuredBaseUrl.protocol;
    resolvedUrl.hostname = configuredBaseUrl.hostname;
    resolvedUrl.port = configuredBaseUrl.port;

    if (isAbsoluteBaseUrl) return resolvedUrl.toString();
    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return nextUrl;
  }
};

export const fetchAllPages = async (baseUrl, params = {}, config = {}, callbacks = {}) => {
  const { onPage } = callbacks;
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
  const visitedUrls = new Set();

  while (nextUrl) {
    if (visitedUrls.has(nextUrl)) {
      throw new Error('La API devolvio un ciclo de paginacion');
    }
    visitedUrls.add(nextUrl);

    const response = await axios.get(
      nextUrl,
      isFirstRequest ? { ...config, params } : config
    );
    status = response.status;
    const payload = response.data;

    if (Array.isArray(payload)) {
      const result = {
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
      onPage?.({ ...result, pageData: payload, isComplete: true });
      return result;
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

    onPage?.({
      data: [...items],
      pageData: pageItems,
      pagination: { ...pagination },
      status,
      isComplete: !payload?.next
    });

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
