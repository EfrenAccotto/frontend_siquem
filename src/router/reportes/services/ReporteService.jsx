import axios from 'axios';

// Asegura que no haya doble slash si la env var trae la barra final
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const REPORTES_ENDPOINT = `${BASE_URL}/reportes`;
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
}

export default ReporteService;