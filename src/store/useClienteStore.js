// src/modules/clientes/store/useClienteStore.js
import { create } from 'zustand';
import ClienteService from '../router/clientes/services/ClienteService';

const useClienteStore = create((set, get) => ({
  // Estado
  clientes: [],
  clienteActual: null,
  loading: false,
  error: null,

  // Acciones
  fetchClientes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.getAll();
      set({ clientes: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchClienteById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.getById(id);
      set({ clienteActual: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCliente: async (clienteData) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.create(clienteData);
      set((state) => ({
        clientes: [...state.clientes, response.data],
        loading: false
      }));
      return response.data;
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
        clientes: state.clientes.map(c =>
          c.id === id ? response.data : c
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
        clientes: state.clientes.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchClientes: async (query) => {
    set({ loading: true, error: null });
    try {
      const response = await ClienteService.search(query);
      set({ clientes: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
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