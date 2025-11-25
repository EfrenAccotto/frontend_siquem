import axios from 'axios';

// Configuración específica para clientes
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const CLIENTES_ENDPOINT = `${BASE_URL}/customer/`;

/**
 * Servicio para operaciones CRUD de Clientes
 */
class ClienteService {
  /**
   * Obtener todos los clientes
   * @param {Object} params - Parámetros de consulta (filtros, paginación, etc.)
   * @returns {Promise} Lista de clientes
   */
  static async getAll(params = {}) {
    try {
      const response = await axios.get(CLIENTES_ENDPOINT, { params });
      console.log(response);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener clientes',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener un cliente por ID
   * @param {number|string} id - ID del cliente
   * @returns {Promise} Datos del cliente
   */
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

  /**
   * Crear un nuevo cliente
   * @param {Object} clienteData - Datos del cliente a crear
   * @returns {Promise} Cliente creado
   */
  static async create(clienteData) {
    try {
      const response = await axios.post(`${CLIENTES_ENDPOINT}`, clienteData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Cliente creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear cliente',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualizar un cliente existente
   * @param {number|string} id - ID del cliente
   * @param {Object} clienteData - Datos actualizados del cliente
   * @returns {Promise} Cliente actualizado
   */
  static async update(id, clienteData) {
    try {
      const response = await axios.put(`${CLIENTES_ENDPOINT}${id}/`, clienteData);
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

  /**
   * Actualización parcial de un cliente
   * @param {number|string} id - ID del cliente
   * @param {Object} clienteData - Datos parciales a actualizar
   * @returns {Promise} Cliente actualizado
   */
  static async partialUpdate(id, clienteData) {
    try {
      const response = await axios.patch(`${CLIENTES_ENDPOINT}${id}/`, clienteData);
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

  /**
   * Eliminar un cliente
   * @param {number|string} id - ID del cliente a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  static async delete(id) {
    try {
      const response = await axios.delete(`${CLIENTES_ENDPOINT}${id}/`);
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

  /**
   * Buscar clientes por criterios específicos
   * @param {Object} searchParams - Parámetros de búsqueda
   * @returns {Promise} Lista de clientes filtrados
   */
  static async search(searchParams) {
    try {
      const response = await axios.get(`${CLIENTES_ENDPOINT}search/`, { 
        params: searchParams 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error en la búsqueda de clientes',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener clientes activos
   * @returns {Promise} Lista de clientes activos
   */
  static async getActive() {
    try {
      const response = await axios.get(`${CLIENTES_ENDPOINT}`, { 
        params: { is_active: true } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener clientes activos',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener historial de pedidos de un cliente
   * @param {number|string} id - ID del cliente
   * @returns {Promise} Lista de pedidos del cliente
   */
  static async getOrderHistory(id) {
    try {
      const response = await axios.get(`${CLIENTES_ENDPOINT}${id}/orders/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener historial de pedidos del cliente con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }
}

export default ClienteService;
