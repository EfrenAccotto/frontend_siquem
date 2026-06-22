import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

class UbicacionService {
  static async getProvincias() {
    try {
      if (!BASE_URL) {
        console.error('VITE_API_BASE_URL no esta configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }

      const response = await axios.get(`${BASE_URL}/provinces/`);
      const data = response.data?.results || response.data || [];
      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('Error fetching provincias:', error);
      console.error('Response data:', error.response?.data);
      return { success: false, data: [], error: error.message, status: error.response?.status || 500 };
    }
  }

  static async getLocalidades(provinciaId) {
    try {
      if (!BASE_URL) {
        console.error('VITE_API_BASE_URL no esta configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }

      const response = await axios.get(`${BASE_URL}/localities/`, {
        params: provinciaId ? { province: provinciaId, page_size: 100 } : { page_size: 100 }
      });
      const data = response.data?.results || response.data || [];
      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('Error fetching localidades:', error);
      console.error('Response data:', error.response?.data);
      return { success: false, data: [], error: error.message, status: error.response?.status || 500 };
    }
  }

  static async getDirecciones(localidadId) {
    try {
      if (!BASE_URL) {
        console.error('VITE_API_BASE_URL no esta configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }

      const response = await axios.get(`${BASE_URL}/addresses/`, {
        params: localidadId ? { locality: localidadId, page_size: 100 } : { page_size: 100 }
      });
      const data = response.data?.results || response.data || [];
      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('Error fetching direcciones:', error);
      console.error('Response data:', error.response?.data);
      return { success: false, data: [], error: error.message, status: error.response?.status || 500 };
    }
  }

  static async getZonas(localidadId) {
    try {
      if (!BASE_URL) {
        console.error('VITE_API_BASE_URL no esta configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }

      const response = await axios.get(`${BASE_URL}/zones/`, {
        params: localidadId ? { locality: localidadId, page_size: 100 } : { page_size: 100 }
      });
      const data = response.data?.results || response.data || [];
      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('Error fetching zonas:', error);
      console.error('Response data:', error.response?.data);
      return { success: false, data: [], error: error.message, status: error.response?.status || 500 };
    }
  }

  static async createAddress(payload) {
    try {
      const response = await axios.post(`${BASE_URL}/addresses/`, payload);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al crear direccion', status: error.response?.status || 500 };
    }
  }

  static async createZoneAddress(payload) {
    try {
      const response = await axios.post(`${BASE_URL}/zone-addresses/`, payload);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al asociar zona', status: error.response?.status || 500 };
    }
  }
}

export default UbicacionService;
