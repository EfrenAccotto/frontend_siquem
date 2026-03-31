import axios from 'axios';
import { fetchAllPages } from '@/utils/fetchAllPages';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRODUCTOS_ENDPOINT = `${BASE_URL}/product`;

class ProductoService {
  static async getAll(params = {}) {
    const baseUrl = `${PRODUCTOS_ENDPOINT}/`;
    const query = { ordering: '-id', ...params };

    try {
      const { data, pagination, status } = await fetchAllPages(baseUrl, query);
      return { success: true, data, pagination, status };
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
