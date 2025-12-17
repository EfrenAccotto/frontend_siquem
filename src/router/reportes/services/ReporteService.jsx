import axios from 'axios';

// Asegura que no haya doble slash si la env var trae la barra final
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REPORTES_ENDPOINT = `${BASE_URL}/reports`;
// Cambiado: usar el endpoint remito (remito/<order_id>/)
const REMITO_ENDPOINT = `${BASE_URL}/remito`;

class ReporteService {
  // Obtiene un reporte por id de order
  static async getById(id) {
    try {
      const response = await axios.get(`${REPORTES_ENDPOINT}/${id}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener reporte con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  // Obtener remito por order_id (ruta: /remito/<order_id>/)
  static async getByOrderId(orderId) {
    try {
      const response = await axios.get(`${REMITO_ENDPOINT}/${orderId}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener remito con order_id: ${orderId}`,
        status: error.response?.status || 500
      };
    }
  }

  // Ejemplo: descargar remito como archivo (PDF/CSV), responseType ajustable
  static async downloadByOrderId(orderId, { responseType = 'blob' } = {}) {
    try {
      const response = await axios.get(`${REMITO_ENDPOINT}/${orderId}/`, { responseType });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al descargar remito con order_id: ${orderId}`,
        status: error.response?.status || 500
      };
    }
  }

  // Generar reporte basado en modelo y filtros
  static async getReportByModel(modelo, formato = 'pdf', fechaDesde = null, fechaHasta = null, filtros = {}) {
    try {
      // Formatear fechas en DD/MM/YYYY como espera el backend
      const formatDate = (date) => {
        if (!date) return null;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const payload = {
        modelo,
        formato,
        ...(fechaDesde && { fecha_inicio: formatDate(fechaDesde) }),
        ...(fechaHasta && { fecha_fin: formatDate(fechaHasta) }),
        filtros: Array.isArray(filtros) ? filtros : []
      };
      
      console.log('Enviando payload:', payload);
      
      const response = await axios.post(`${REPORTES_ENDPOINT}/generate/`, payload, {
        responseType: 'blob', // Importante para archivos binarios
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*' // Permitir cualquier tipo de respuesta
        }
      });
      
      return {
        success: true,
        data: response.data, // Blob data
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      console.error('Error en ReporteService.getReportByModel:', error);
      
      // Si hay error de response, intentar leer el mensaje de error del blob
      let errorMessage = `Error al generar reporte para el modelo: ${modelo}`;
      if (error.response?.data && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('No se pudo parsear el error del blob:', parseError);
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Descargar PDF de pedidos agrupados por zona
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.dateFrom - Fecha de inicio (YYYY-MM-DD)
   * @param {string} params.dateTo - Fecha de fin (YYYY-MM-DD)  
   * @param {string} params.status - Estado del pedido ('pending', 'completed', 'cancelled')
   * @returns {Promise} PDF blob para descarga
   */
  static async downloadOrdersByZonePdf({ dateFrom = null, dateTo = null, status = null } = {}) {
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (status) params.status = status;

      const response = await axios.get(`${REPORTES_ENDPOINT}/orders-by-zone-pdf/`, {
        params,
        responseType: 'blob',
        headers: { 
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      
      // Manejo mejorado de errores
      let errorMessage = 'Error al descargar hoja de ruta por zonas';
      if (error.response?.data && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('No se pudo parsear el error del blob:', parseError);
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500
      };
    }
  }
}
export default ReporteService;
