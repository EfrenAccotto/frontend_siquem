import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PEDIDOS_ENDPOINT = `${BASE_URL}/order`;

class PedidoService {
  static async getAll(params = {}) {
    const baseUrl = `${PEDIDOS_ENDPOINT}/`;
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
      return {
        success: false,
        error: error.response?.data || 'Error al obtener pedidos',
        status: error.response?.status || 500
      };
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}/${id}/`);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || `Error al obtener pedido ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  static async create(pedidoData) {
    console.log('Creating pedido with data:', pedidoData);
    try {
      const response = await axios.post(`${PEDIDOS_ENDPOINT}/`, pedidoData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Error al crear pedido',
        status: error.response?.status || 500
      };
    }
  }

  static async update(id, pedidoData) {
    try {
      const response = await axios.put(`${PEDIDOS_ENDPOINT}/${id}/`, pedidoData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || `Error al actualizar pedido ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  static async delete(id) {
    try {
      const response = await axios.delete(`${PEDIDOS_ENDPOINT}/${id}/`);
      return { success: true, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || `Error al eliminar pedido ${id}`,
        status: error.response?.status || 500
      };
    }
  }
}

export default PedidoService;
