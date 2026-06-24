import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import ClienteService from '../router/clientes/services/ClienteService';

export const CLIENTES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CLIENTES_CACHE_STORAGE_KEY = 'siquem-clientes-cache';

const sortClientesByIdDesc = (list = []) =>
  [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

const getResponseError = (response, fallback) => {
  const error = response?.error;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
};

let fetchClientesPromise = null;

const useClienteStore = create(
  persist(
    (set, getState) => ({
      clientes: [],
      clienteActual: null,
      loading: false,
      error: null,
      loaded: false,
      lastFetchedAt: 0,

      fetchClientes: async ({ force = false } = {}) => {
        const { loaded, clientes, lastFetchedAt } = getState();
        const cacheIsFresh = loaded && Date.now() - lastFetchedAt < CLIENTES_CACHE_TTL_MS;

        if (!force && cacheIsFresh) {
          return clientes;
        }

        if (fetchClientesPromise) {
          return fetchClientesPromise;
        }

        set({ loading: true, error: null });
        fetchClientesPromise = (async () => {
          try {
            const response = await ClienteService.getAllPages();
            if (!response?.success) {
              set({
                error: getResponseError(response, 'Error al obtener clientes'),
                loading: false
              });
              return getState().clientes;
            }

            const list = response?.data || [];
            const sorted = Array.isArray(list) ? sortClientesByIdDesc(list) : [];
            set({
              clientes: sorted,
              loading: false,
              loaded: true,
              lastFetchedAt: Date.now()
            });
            return sorted;
          } catch (error) {
            set({ error: error.message, loading: false });
            return getState().clientes;
          } finally {
            fetchClientesPromise = null;
          }
        })();

        return fetchClientesPromise;
      },

      upsertCliente: (cliente) => {
        if (!cliente?.id) return;

        set((state) => {
          const current = (state.clientes || []).find((item) => item.id === cliente.id);
          const nextCliente = current ? { ...current, ...cliente } : cliente;
          const withoutCurrent = (state.clientes || []).filter((item) => item.id !== cliente.id);

          return {
            clientes: sortClientesByIdDesc([nextCliente, ...withoutCurrent]),
            loaded: state.loaded,
            lastFetchedAt: state.loaded ? Date.now() : state.lastFetchedAt
          };
        });
      },

      removeCliente: (id) => {
        set((state) => ({
          clientes: (state.clientes || []).filter((clienteItem) => clienteItem.id !== id),
          loaded: state.loaded,
          lastFetchedAt: state.loaded ? Date.now() : state.lastFetchedAt
        }));
      },

      invalidateClientes: () => {
        set({ lastFetchedAt: 0 });
      },

      fetchClienteById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await ClienteService.getById(id);
          if (!response?.success) {
            throw new Error(getResponseError(response, `Error al obtener cliente con ID: ${id}`));
          }
          set({ clienteActual: response.data, loading: false });
          getState().upsertCliente(response.data);
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
          if (!response?.success || !response?.data) {
            throw new Error(getResponseError(response, 'Error al crear cliente'));
          }
          getState().upsertCliente(response.data);
          set({ loading: false });
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
          if (!response?.success || !response?.data) {
            throw new Error(getResponseError(response, `Error al actualizar cliente con ID: ${id}`));
          }
          getState().upsertCliente(response.data);
          set({ loading: false });
          return response.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteCliente: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await ClienteService.delete(id);
          if (!response?.success) {
            throw new Error(getResponseError(response, `Error al eliminar cliente con ID: ${id}`));
          }
          getState().removeCliente(id);
          set({ loading: false });
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
    }),
    {
      name: CLIENTES_CACHE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        clientes: state.clientes,
        loaded: state.loaded,
        lastFetchedAt: state.lastFetchedAt
      })
    }
  )
);

export default useClienteStore;
