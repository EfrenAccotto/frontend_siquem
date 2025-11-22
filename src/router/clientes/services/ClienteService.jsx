import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const CLIENTES_ENDPOINT = `${BASE_URL}/clientes`;

class ClienteService {
    static async getAll() {
        try {
            const response = await axios.get(CLIENTES_ENDPOINT);
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
            return {
                success: false,
                error: error.response?.data?.message || 'Error al crear cliente',
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

    static async search(query) {
        try {
            const response = await axios.get(`${CLIENTES_ENDPOINT}/search/`, {
                params: { q: query }
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
}

export default ClienteService;
