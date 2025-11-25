import axios from 'axios';

// Configuración específica para pedidos
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const PEDIDOS_ENDPOINT = `${BASE_URL}/order/`;

/**
 * Servicio para operaciones CRUD de Pedidos
 */
class PedidoService {
  /**
   * Obtener todos los pedidos
   * @param {Object} params - Parámetros de consulta (filtros, paginación, etc.)
   * @returns {Promise} Lista de pedidos
   */
  static async getAll(params = {}) {
    try {
      const response = await axios.get(PEDIDOS_ENDPOINT, { params });
      console.log(response);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener pedidos',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener un pedido por ID
   * @param {number|string} id - ID del pedido
   * @returns {Promise} Datos del pedido
   */
  static async getById(id) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}${id}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener pedido con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Crear un nuevo pedido
   * @param {Object} pedidoData - Datos del pedido a crear
   * @returns {Promise} Pedido creado
   */
  static async create(pedidoData) {
    try {
      const response = await axios.post(`${PEDIDOS_ENDPOINT}`, pedidoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Pedido creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear pedido',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualizar un pedido existente
   * @param {number|string} id - ID del pedido
   * @param {Object} pedidoData - Datos actualizados del pedido
   * @returns {Promise} Pedido actualizado
   */
  static async update(id, pedidoData) {
    try {
      const response = await axios.put(`${PEDIDOS_ENDPOINT}${id}/`, pedidoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Pedido actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar pedido con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualización parcial de un pedido
   * @param {number|string} id - ID del pedido
   * @param {Object} pedidoData - Datos parciales a actualizar
   * @returns {Promise} Pedido actualizado
   */
  static async partialUpdate(id, pedidoData) {
    try {
      const response = await axios.patch(`${PEDIDOS_ENDPOINT}${id}/`, pedidoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Pedido actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar pedido con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Eliminar un pedido
   * @param {number|string} id - ID del pedido a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  static async delete(id) {
    try {
      const response = await axios.delete(`${PEDIDOS_ENDPOINT}${id}/`);
      return {
        success: true,
        status: response.status,
        message: 'Pedido eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al eliminar pedido con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Buscar pedidos por criterios específicos
   * @param {Object} searchParams - Parámetros de búsqueda
   * @returns {Promise} Lista de pedidos filtrados
   */
  static async search(searchParams) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}search/`, { 
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
        error: error.response?.data?.message || 'Error en la búsqueda de pedidos',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener pedidos por cliente
   * @param {number|string} clientId - ID del cliente
   * @returns {Promise} Lista de pedidos del cliente
   */
  static async getByClient(clientId) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}`, { 
        params: { client: clientId } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener pedidos del cliente: ${clientId}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener pedidos por estado
   * @param {string} status - Estado del pedido
   * @returns {Promise} Lista de pedidos por estado
   */
  static async getByStatus(status) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}`, { 
        params: { status: status } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener pedidos con estado: ${status}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Cambiar estado de un pedido
   * @param {number|string} id - ID del pedido
   * @param {string} newStatus - Nuevo estado del pedido
   * @returns {Promise} Pedido con estado actualizado
   */
  static async updateStatus(id, newStatus) {
    try {
      const response = await axios.patch(`${PEDIDOS_ENDPOINT}${id}/status/`, {
        status: newStatus
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Estado del pedido actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar estado del pedido con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener detalle completo de un pedido (con productos)
   * @param {number|string} id - ID del pedido
   * @returns {Promise} Detalle completo del pedido
   */
  static async getDetailWithProducts(id) {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}${id}/detail/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener detalle del pedido con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener pedidos pendientes
   * @returns {Promise} Lista de pedidos pendientes
   */
  static async getPending() {
    try {
      const response = await axios.get(`${PEDIDOS_ENDPOINT}pending/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener pedidos pendientes',
        status: error.response?.status || 500
      };
    }
  }
}

export default PedidoService;
