import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

class UbicacionService {
  static async getProvincias() {
    try {
      if (!BASE_URL) {
        console.error('VITE_API_BASE_URL no está configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }
      
      console.log('Fetching provincias from:', `${BASE_URL}/provinces/`);
      const response = await axios.get(`${BASE_URL}/provinces/`);
      const data = response.data?.results || response.data || [];
      console.log('Provincias fetched successfully:', data);
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
        console.error('VITE_API_BASE_URL no está configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }
      
      console.log('Fetching localidades from:', `${BASE_URL}/localities/`);
      const response = await axios.get(`${BASE_URL}/localities/`);
      let data = response.data?.results || response.data || [];
      if (provinciaId) {
        data = data.filter((loc) => {
          const prov = loc.province?.id || loc.province;
          return prov === provinciaId;
        });
      }
      console.log('Localidades fetched successfully:', data);
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
        console.error('VITE_API_BASE_URL no está configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }
      
      console.log('Fetching direcciones from:', `${BASE_URL}/addresses/`);
      const response = await axios.get(`${BASE_URL}/addresses/`);
      let data = response.data?.results || response.data || [];
      if (localidadId) {
        data = data.filter((addr) => {
          const loc = addr.locality?.id || addr.locality;
          return loc === localidadId;
        });
      }
      console.log('Direcciones fetched successfully:', data);
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
        console.error('VITE_API_BASE_URL no está configurada');
        return { success: false, data: [], error: 'URL de API no configurada' };
      }
      
      console.log('Fetching zonas from:', `${BASE_URL}/zones/`);
      const response = await axios.get(`${BASE_URL}/zones/`);
      let data = response.data?.results || response.data || [];
      if (localidadId) {
        data = data.filter((zone) => {
          const loc = zone.locality?.id || zone.locality;
          return loc === localidadId;
        });
      }
      console.log('Zonas fetched successfully:', data);
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
      return { success: false, error: error.response?.data || 'Error al crear dirección', status: error.response?.status || 500 };
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
