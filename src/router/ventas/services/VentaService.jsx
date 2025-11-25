import axios from 'axios';

// Configuración específica para ventas
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const VENTAS_ENDPOINT = `${BASE_URL}/sale/`;
const VENTA_DETAILS_ENDPOINT = `${BASE_URL}/sale-detail/`;

/**
 * Servicio para operaciones CRUD de Ventas
 */
class VentaService {
  /**
   * Obtener todas las ventas
   * @param {Object} params - Parámetros de consulta (filtros, paginación, etc.)
   * @returns {Promise} Lista de ventas
   */
  static async getAll(params = {}) {
    try {
      const response = await axios.get(VENTAS_ENDPOINT, { params });
      console.log(response);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener ventas',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener una venta por ID
   * @param {number|string} id - ID de la venta
   * @returns {Promise} Datos de la venta
   */
  static async getById(id) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}${id}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener venta con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Crear una nueva venta
   * @param {Object} ventaData - Datos de la venta a crear
   * @returns {Promise} Venta creada
   */
  static async create(ventaData) {
    try {
      const response = await axios.post(`${VENTAS_ENDPOINT}`, ventaData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Venta creada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear venta',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualizar una venta existente
   * @param {number|string} id - ID de la venta
   * @param {Object} ventaData - Datos actualizados de la venta
   * @returns {Promise} Venta actualizada
   */
  static async update(id, ventaData) {
    try {
      const response = await axios.put(`${VENTAS_ENDPOINT}${id}/`, ventaData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Venta actualizada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar venta con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualización parcial de una venta
   * @param {number|string} id - ID de la venta
   * @param {Object} ventaData - Datos parciales a actualizar
   * @returns {Promise} Venta actualizada
   */
  static async partialUpdate(id, ventaData) {
    try {
      const response = await axios.patch(`${VENTAS_ENDPOINT}${id}/`, ventaData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Venta actualizada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar venta con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Eliminar una venta
   * @param {number|string} id - ID de la venta a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  static async delete(id) {
    try {
      const response = await axios.delete(`${VENTAS_ENDPOINT}${id}/`);
      return {
        success: true,
        status: response.status,
        message: 'Venta eliminada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al eliminar venta con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Buscar ventas por criterios específicos
   * @param {Object} searchParams - Parámetros de búsqueda
   * @returns {Promise} Lista de ventas filtradas
   */
  static async search(searchParams) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}search/`, { 
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
        error: error.response?.data?.message || 'Error en la búsqueda de ventas',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener ventas por rango de fechas
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise} Lista de ventas en el rango de fechas
   */
  static async getByDateRange(startDate, endDate) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}`, { 
        params: { 
          date_from: startDate,
          date_to: endDate 
        } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener ventas por rango de fechas',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener detalle completo de una venta (con productos)
   * @param {number|string} id - ID de la venta
   * @returns {Promise} Detalle completo de la venta
   */
  static async getDetailWithProducts(id) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}${id}/detail/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener detalle de la venta con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener resumen de ventas diarias
   * @param {string} date - Fecha (YYYY-MM-DD), opcional, por defecto hoy
   * @returns {Promise} Resumen de ventas del día
   */
  static async getDailySummary(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await axios.get(`${VENTAS_ENDPOINT}daily-summary/`, { params });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener resumen diario de ventas',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener resumen de ventas mensuales
   * @param {number} year - Año
   * @param {number} month - Mes (1-12)
   * @returns {Promise} Resumen de ventas del mes
   */
  static async getMonthlySummary(year, month) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}monthly-summary/`, { 
        params: { year, month } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener resumen mensual de ventas',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener estadísticas de ventas
   * @param {Object} params - Parámetros para las estadísticas
   * @returns {Promise} Estadísticas de ventas
   */
  static async getStats(params = {}) {
    try {
      const response = await axios.get(`${VENTAS_ENDPOINT}stats/`, { params });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estadísticas de ventas',
        status: error.response?.status || 500
      };
    }
  }

  // ============================================================================
  // MÉTODOS PARA DETALLES DE VENTA
  // ============================================================================

  /**
   * Obtener todos los detalles de venta
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Lista de detalles de venta
   */
  static async getAllDetails(params = {}) {
    try {
      const response = await axios.get(VENTA_DETAILS_ENDPOINT, { params });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalles de venta',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener detalles de una venta específica
   * @param {number|string} saleId - ID de la venta
   * @returns {Promise} Lista de detalles de la venta
   */
  static async getDetailsBySaleId(saleId) {
    try {
      const response = await axios.get(`${VENTA_DETAILS_ENDPOINT}`, { 
        params: { sale: saleId } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener detalles de la venta con ID: ${saleId}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Crear un detalle de venta
   * @param {Object} detailData - Datos del detalle de venta
   * @returns {Promise} Detalle de venta creado
   */
  static async createDetail(detailData) {
    try {
      const response = await axios.post(`${VENTA_DETAILS_ENDPOINT}`, detailData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Detalle de venta creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear detalle de venta',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }
}

export default VentaService;
