import { create } from 'zustand';
import ClienteService from '../router/clientes/services/ClienteService';

const sortClientesByIdDesc = (list = []) =>
  [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

const useClienteStore = create((set, getState) => ({
  clientes: [],
  clienteActual: null,
  loading: false,
  error: null,
  loaded: false,

  fetchClientes: async ({ force = false } = {}) => {
    const { loaded, loading, clientes } = getState();
    if (!force && (loaded || loading) && Array.isArray(clientes) && clientes.length) {
      return clientes;
    }

    set({ loading: true, error: null });
    try {
      const response = await ClienteService.getAll();
      if (!response?.success) {
        set({ error: response?.error || 'Error al obtener clientes', loading: false });
        return [];
      }

      const list = response?.data?.results || response?.data || [];
      const sorted = Array.isArray(list) ? sortClientesByIdDesc(list) : [];
      set({ clientes: sorted, loading: false, loaded: true });
      return sorted;
    } catch (error) {
      set({ error: error.message, loading: false });
      return [];
    }
  },

  fetchClienteById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.getById(id);
      set({ clienteActual: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createCliente: async (clienteData) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.create(clienteData);
      const nextCliente = response?.data;
      set((state) => ({
        clientes: nextCliente ? sortClientesByIdDesc([nextCliente, ...(state.clientes || [])]) : state.clientes,
        loading: false,
        loaded: true
      }));
      return nextCliente;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCliente: async (id, clienteData) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.update(id, clienteData);
      set((state) => ({
        clientes: sortClientesByIdDesc(
          state.clientes.map((clienteItem) => (clienteItem.id === id ? response.data : clienteItem))
        ),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCliente: async (id) => {
    set({ loading: true, error: null });
    try {
      await ClienteService.delete(id);
      set((state) => ({
        clientes: state.clientes.filter((clienteItem) => clienteItem.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setClienteActual: (cliente) => {
    set({ clienteActual: cliente });
  },

  clearClienteActual: () => {
    set({ clienteActual: null });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useClienteStore;
