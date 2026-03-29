import axios from 'axios';
import { fetchAllPages } from '@/utils/fetchAllPages';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PEDIDOS_ENDPOINT = `${BASE_URL}/order`;

class PedidoService {
  static async getAll(params = {}) {
    const baseUrl = `${PEDIDOS_ENDPOINT}/`;
    const query = { ordering: '-id', ...params };

    try {
      const { data, pagination, status } = await fetchAllPages(baseUrl, query);
      return { success: true, data, pagination, status };
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

  static async generateShareLink(payload) {
    try {
      const response = await axios.post(`${PEDIDOS_ENDPOINT}/export/share/`, payload);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Error al generar link de pesaje',
        status: error.response?.status || 500
      };
    }
  }

  static async getSharedOrders(shareId) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}/shared/orders/${shareId}/`);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Error al obtener pedidos compartidos',
        status: error.response?.status || 500
      };
    }
  }

  static async updateSharedOrders(shareId, payload) {
    try {
      const response = await axios.put(`${PEDIDOS_ENDPOINT}/shared/orders/${shareId}/`, payload);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Error al guardar cambios de pesaje',
        status: error.response?.status || 500
      };
    }
  }
}

export default PedidoService;
