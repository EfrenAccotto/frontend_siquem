import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Servicio simplificado para ubicaciones (provincias, localidades, direcciones, zonas).
 * Si la API no responde, devuelve arreglos vacíos para no romper la UI.
 */
class UbicacionService {
  static async getProvincias() {
    try {
      const response = await axios.get(`${BASE_URL}/province/`);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: true, data: [], status: error.response?.status || 500 };
    }
  }

  static async getLocalidades(provinciaId) {
    try {
      const response = await axios.get(`${BASE_URL}/locality/`, { params: { province: provinciaId } });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: true, data: [], status: error.response?.status || 500 };
    }
  }

  static async getDirecciones(localidadId) {
    try {
      const response = await axios.get(`${BASE_URL}/address/`, { params: { locality: localidadId } });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: true, data: [], status: error.response?.status || 500 };
    }
  }

  static async getZonas(localidadId) {
    try {
      const response = await axios.get(`${BASE_URL}/zone/`, { params: { locality: localidadId } });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: true, data: [], status: error.response?.status || 500 };
    }
  }
}

export default UbicacionService;
