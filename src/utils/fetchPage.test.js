import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios from 'axios';
import { fetchPage } from './fetchPage';

jest.mock('axios');

describe('fetchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('realiza una sola solicitud y conserva los metadatos de paginacion DRF', async () => {
    axios.get.mockResolvedValue({
      status: 200,
      data: {
        count: 125,
        next: 'http://api.test/product/?page=3&page_size=25',
        previous: 'http://api.test/product/?page=1&page_size=25',
        results: Array.from({ length: 25 }, (_, index) => ({ id: index + 26 }))
      }
    });

    const result = await fetchPage(
      'http://api.test/product/',
      { page: 2, page_size: 25, search: 'leche' }
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('http://api.test/product/', {
      params: { page: 2, page_size: 25, search: 'leche' }
    });
    expect(result.data).toHaveLength(25);
    expect(result.pagination).toMatchObject({ count: 125, page: 2, pageSize: 25 });
  });

  it('mantiene compatibilidad con endpoints no paginados', async () => {
    axios.get.mockResolvedValue({ status: 200, data: [{ id: 1 }, { id: 2 }] });

    const result = await fetchPage('http://api.test/provinces/');

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(2);
    expect(result.pagination.count).toBe(2);
  });
});
