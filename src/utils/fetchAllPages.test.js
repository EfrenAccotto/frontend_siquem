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

  it('mantiene compatibilidad con endpoints no paginados', async () => {
    axios.get.mockResolvedValue({ status: 200, data: [{ id: 2 }, { id: 1 }] });

    const result = await fetchAllPages('http://api.test/customer/');

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([{ id: 2 }, { id: 1 }]);
    expect(result.pagination.count).toBe(2);
  });
});
