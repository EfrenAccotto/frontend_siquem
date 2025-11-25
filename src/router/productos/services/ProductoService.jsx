import axios from 'axios';

// Configuración específica para productos
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const PRODUCTOS_ENDPOINT = `${BASE_URL}/product/`;

/**
 * Servicio para operaciones CRUD de Productos
 */
class ProductoService {
  /**
   * Obtener todos los productos
   * @param {Object} params - Parámetros de consulta (filtros, paginación, etc.)
   * @returns {Promise} Lista de productos
   */
  static async getAll(params = {}) {
    try {
      const response = await axios.get(PRODUCTOS_ENDPOINT, { params });
      console.log(response);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener productos',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener un producto por ID
   * @param {number|string} id - ID del producto
   * @returns {Promise} Datos del producto
   */
  static async getById(id) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/${id}/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener producto con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Crear un nuevo producto
   * @param {Object} productoData - Datos del producto a crear
   * @returns {Promise} Producto creado
   */
  static async create(productoData) {
    try {
      const response = await axios.post(`${PRODUCTOS_ENDPOINT}/`, productoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Producto creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear producto',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualizar un producto existente
   * @param {number|string} id - ID del producto
   * @param {Object} productoData - Datos actualizados del producto
   * @returns {Promise} Producto actualizado
   */
  static async update(id, productoData) {
    try {
      const response = await axios.put(`${PRODUCTOS_ENDPOINT}/${id}/`, productoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Producto actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar producto con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualización parcial de un producto
   * @param {number|string} id - ID del producto
   * @param {Object} productoData - Datos parciales a actualizar
   * @returns {Promise} Producto actualizado
   */
  static async partialUpdate(id, productoData) {
    try {
      const response = await axios.patch(`${PRODUCTOS_ENDPOINT}/${id}/`, productoData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Producto actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar producto con ID: ${id}`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Eliminar un producto
   * @param {number|string} id - ID del producto a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  static async delete(id) {
    try {
      const response = await axios.delete(`${PRODUCTOS_ENDPOINT}/${id}/`);
      return {
        success: true,
        status: response.status,
        message: 'Producto eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al eliminar producto con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Buscar productos por criterios específicos
   * @param {Object} searchParams - Parámetros de búsqueda
   * @returns {Promise} Lista de productos filtrados
   */
  static async search(searchParams) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/search/`, { 
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
        error: error.response?.data?.message || 'Error en la búsqueda de productos',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Verificar disponibilidad de stock de un producto
   * @param {number|string} id - ID del producto
   * @returns {Promise} Información de stock
   */
  static async checkStock(id) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/${id}/stock/`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al verificar stock del producto con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Actualizar stock de un producto
   * @param {number|string} id - ID del producto
   * @param {Object} stockData - Datos de stock (quantity, operation: 'add'|'subtract'|'set')
   * @returns {Promise} Stock actualizado
   */
  static async updateStock(id, stockData) {
    try {
      const response = await axios.post(`${PRODUCTOS_ENDPOINT}/${id}/stock/`, stockData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Stock actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al actualizar stock del producto con ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener productos por categoría
   * @param {number|string} categoryId - ID de la categoría
   * @returns {Promise} Lista de productos de la categoría
   */
  static async getByCategory(categoryId) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/`, { 
        params: { category: categoryId } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener productos de la categoría: ${categoryId}`,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Obtener productos con bajo stock
   * @param {number} minStock - Cantidad mínima de stock
   * @returns {Promise} Lista de productos con bajo stock
   */
  static async getLowStock(minStock = 10) {
    try {
      const response = await axios.get(`${PRODUCTOS_ENDPOINT}/low-stock/`, { 
        params: { min_stock: minStock } 
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener productos con bajo stock',
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Subir imagen de producto
   * @param {number|string} id - ID del producto
   * @param {File} imageFile - Archivo de imagen
   * @returns {Promise} URL de la imagen subida
   */
  static async uploadImage(id, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await axios.post(
        `${PRODUCTOS_ENDPOINT}/${id}/upload-image/`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Imagen subida exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al subir imagen',
        status: error.response?.status || 500
      };
    }
  }
}

export default ProductoService;
