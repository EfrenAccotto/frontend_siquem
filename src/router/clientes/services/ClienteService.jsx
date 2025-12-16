import axios from 'axios';

// Asegura que no haya doble slash si la env var trae la barra final
const BASE_URL = import.meta.env.API_BASE_URL;
const CLIENTES_ENDPOINT = `${BASE_URL}/customer`;

class ClienteService {
  static async getAll(params = {}) {
    // Paginación defensiva: recorre todas las páginas hasta que no haya "next"
    const baseUrl = `${CLIENTES_ENDPOINT}/`;
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
        pagination = {
          count: data?.count,
          next: data?.next,
          previous: data?.previous
        };
        url = data?.next;
        first = false;
      }
      // Si la API no trae paginación (array directo)
      if (!all.length) {
        const resp = await axios.get(baseUrl, { params: query });
        const data = resp.data;
        all = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        pagination = {
          count: data?.count,
          next: data?.next,
          previous: data?.previous
        };
      }
      return { success: true, data: all, pagination, status: 200 };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener clientes',
        status: error.response?.status || 500
      };
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${CLIENTES_ENDPOINT}/${id}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener cliente con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  static async create(clienteData) {
    try {
      const response = await axios.post(`${CLIENTES_ENDPOINT}/`, clienteData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Cliente creado exitosamente'
      };
    } catch (error) {
      console.error('ClienteService.create error', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || 'Error al crear cliente',
        errors: error.response?.data || {},
        status: error.response?.status || 500
      };
    }
  }

  static async update(id, clienteData) {
    try {
      const response = await axios.put(`${CLIENTES_ENDPOINT}/${id}/`, clienteData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Cliente actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar cliente con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  static async partialUpdate(id, clienteData) {
    try {
      const response = await axios.patch(`${CLIENTES_ENDPOINT}/${id}/`, clienteData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Cliente actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar cliente con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  static async delete(id) {
    try {
      const response = await axios.delete(`${CLIENTES_ENDPOINT}/${id}/`);
      return {
        success: true,
        status: response.status,
        message: 'Cliente eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al eliminar cliente con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }
}

export default ClienteService;
