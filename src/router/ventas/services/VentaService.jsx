import axios from 'axios';

const BASE_URL = import.meta.env.API_BASE_URL;
const VENTAS_ENDPOINT = `${BASE_URL}/sale`;
const VENTA_DETAILS_ENDPOINT = `${BASE_URL}/sale-detail`;

class VentaService {
  static async getAll(params = {}) {
    const baseUrl = `${VENTAS_ENDPOINT}/`;
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
      return { success: false, error: error.response?.data || 'Error al obtener ventas', status: error.response?.status || 500 };
    }
  }

  static async create(ventaData) {
    try {
      const response = await axios.post(`${VENTAS_ENDPOINT}/`, ventaData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message || 'Error al crear venta', status: error.response?.status || 500 };
    }
  }

  static async update(id, ventaData) {
    try {
      const response = await axios.put(`${VENTAS_ENDPOINT}/${id}/`, ventaData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al actualizar venta ${id}`, status: error.response?.status || 500 };
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}/${id}/`);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al obtener venta ${id}`, status: error.response?.status || 500 };
    }
  }

  static async delete(id) {
    try {
      const response = await axios.delete(`${VENTAS_ENDPOINT}/${id}/`);
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al eliminar venta ${id}`, status: error.response?.status || 500 };
    }
  }

  static async createDetail(detailData) {
    try {
      const response = await axios.post(`${VENTA_DETAILS_ENDPOINT}/`, detailData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al crear detalle de venta', status: error.response?.status || 500 };
    }
  }

  static async getDetailsBySaleId(saleId) {
    try {
      const response = await axios.get(`${VENTA_DETAILS_ENDPOINT}/`, { params: { sale: saleId } });
      const data = response.data;
      const results = data?.results || data;
      return { success: true, data: results, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al obtener detalles de la venta ${saleId}`, status: error.response?.status || 500 };
    }
  }

  static async deleteDetail(detailId) {
    try {
      const response = await axios.delete(`${VENTA_DETAILS_ENDPOINT}/${detailId}/`);
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al eliminar detalle ${detailId}`, status: error.response?.status || 500 };
    }
  }

  static async updateDetail(detailId, detailData) {
    try {
      const response = await axios.put(`${VENTA_DETAILS_ENDPOINT}/${detailId}/`, detailData);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || `Error al actualizar detalle ${detailId}`, status: error.response?.status || 500 };
    }
  }
}

export default VentaService;
