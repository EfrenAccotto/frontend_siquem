import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRODUCTOS_ENDPOINT = `${BASE_URL}/product`;

class ProductoService {
  static async getAll(params = {}) {
    const baseUrl = `${PRODUCTOS_ENDPOINT}/`;
    const query = { ordering: '-id', ...params };
    try {
      let url = baseUrl;
      let first = true;
      let all = [];
      let pagination = {};
      while (url) {
        const resp = await axios.get(url, { params: first ? query : undefined });
        const data = resp.data;
        const chunk = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        all = all.concat(chunk);
        pagination = { count: data?.count, next: data?.next, previous: data?.previous };
        url = data?.next;
        first = false;
      }
      if (!all.length) {
        const resp = await axios.get(baseUrl, { params: query });
        const data = resp.data;
        all = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        pagination = { count: data?.count, next: data?.next, previous: data?.previous };
      }
      return { success: true, data: all, pagination, status: 200 };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al obtener productos', status: error.response?.status || 500 };
    }
  }

  static async create(productoData) {
    try {
      const response = await axios.post(`${PRODUCTOS_ENDPOINT}/`, productoData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al crear producto', status: error.response?.status || 500 };
    }
  }

  static async update(id, productoData) {
    try {
      const response = await axios.put(`${PRODUCTOS_ENDPOINT}/${id}/`, productoData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al actualizar producto ${id}`, status: error.response?.status || 500 };
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/${id}/`);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al obtener producto ${id}`, status: error.response?.status || 500 };
    }
  }

  static async delete(id) {
    try {
      const response = await axios.delete(`${PRODUCTOS_ENDPOINT}/${id}/`);
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al eliminar producto ${id}`, status: error.response?.status || 500 };
    }
  }
}

export default ProductoService;
