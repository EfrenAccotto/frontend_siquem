import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios from 'axios';
import { fetchAllPages } from './fetchAllPages';

jest.mock('axios');

describe('fetchAllPages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recorre todas las paginas DRF siguiendo next', async () => {
    axios.get
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 5,
          next: 'http://api.test/customer/?page=2',
          previous: null,
          results: [{ id: 5 }, { id: 4 }]
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 5,
          next: 'http://api.test/customer/?page=3',
          previous: 'http://api.test/customer/?page=1',
          results: [{ id: 3 }, { id: 2 }]
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 5,
          next: null,
          previous: 'http://api.test/customer/?page=2',
          results: [{ id: 1 }]
        }
      });

    const result = await fetchAllPages(
      'http://api.test/customer/',
      { ordering: '-id', page_size: 60 }
    );

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenNthCalledWith(1, 'http://api.test/customer/', {
      params: { ordering: '-id', page_size: 60 }
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, 'http://api.test/customer/?page=2', {});
    expect(result.data.map((item) => item.id)).toEqual([5, 4, 3, 2, 1]);
    expect(result.pagination).toMatchObject({ count: 5, next: null });
  });

  it('notifica el acumulado despues de cada pagina', async () => {
    const onPage = jest.fn();
    axios.get
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 3,
          next: '?page=2',
          previous: null,
          results: [{ id: 3 }, { id: 2 }]
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 3,
          next: null,
          previous: '?page=1',
          results: [{ id: 1 }]
        }
      });

    await fetchAllPages('/api/v1/customer/', {}, {}, { onPage });

    expect(onPage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: [{ id: 3 }, { id: 2 }],
      pageData: [{ id: 3 }, { id: 2 }],
      isComplete: false
    }));
    expect(onPage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: [{ id: 3 }, { id: 2 }, { id: 1 }],
      pageData: [{ id: 1 }],
      isComplete: true
    }));
  });

  it('mantiene compatibilidad con endpoints no paginados', async () => {
    axios.get.mockResolvedValue({ status: 200, data: [{ id: 2 }, { id: 1 }] });

    const result = await fetchAllPages('http://api.test/customer/');

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([{ id: 2 }, { id: 1 }]);
    expect(result.pagination.count).toBe(2);
  });

  it('detiene ciclos de paginacion invalidos', async () => {
    axios.get.mockResolvedValue({
      status: 200,
      data: {
        count: 2,
        next: 'http://api.test/customer/',
        previous: null,
        results: [{ id: 1 }]
      }
    });

    await expect(fetchAllPages('http://api.test/customer/')).rejects.toThrow(
      'La API devolvio un ciclo de paginacion'
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('resuelve enlaces relativos cuando la API usa una ruta local', async () => {
    axios.get
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 2,
          next: '?page=2',
          previous: null,
          results: [{ id: 2 }]
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 2,
          next: null,
          previous: '?page=1',
          results: [{ id: 1 }]
        }
      });

    const result = await fetchAllPages('/api/v1/customer/');

    expect(axios.get).toHaveBeenNthCalledWith(2, '/api/v1/customer/?page=2', {});
    expect(result.data).toEqual([{ id: 2 }, { id: 1 }]);
  });

  it('mantiene el origen configurado si next usa un host interno', async () => {
    axios.get
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 2,
          next: 'http://backend:8000/api/v1/customer/?page=2',
          previous: null,
          results: [{ id: 2 }]
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          count: 2,
          next: null,
          previous: null,
          results: [{ id: 1 }]
        }
      });

    await fetchAllPages('https://api.example.com/api/v1/customer/');

    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/v1/customer/?page=2',
      {}
    );
  });
});
