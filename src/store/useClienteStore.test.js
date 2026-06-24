import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import ClienteService from '../router/clientes/services/ClienteService';
import useClienteStore, {
  CLIENTES_CACHE_STORAGE_KEY,
  CLIENTES_CACHE_TTL_MS
} from './useClienteStore';

jest.mock('../router/clientes/services/ClienteService', () => ({
  __esModule: true,
  default: {
    getAllPages: jest.fn()
  }
}));

describe('useClienteStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useClienteStore.setState({
      clientes: [],
      clienteActual: null,
      loading: false,
      error: null,
      loaded: false,
      lastFetchedAt: 0
    });
  });

  it('carga el catalogo completo para los selectores de pedidos y ventas', async () => {
    ClienteService.getAllPages.mockResolvedValue({
      success: true,
      data: [{ id: 1 }, { id: 3 }, { id: 2 }]
    });

    const result = await useClienteStore.getState().fetchClientes();

    expect(ClienteService.getAllPages).toHaveBeenCalledTimes(1);
    expect(result.map((cliente) => cliente.id)).toEqual([3, 2, 1]);
    expect(useClienteStore.getState()).toMatchObject({
      clientes: [{ id: 3 }, { id: 2 }, { id: 1 }],
      loaded: true,
      loading: false
    });
  });

  it('reutiliza el cache vigente sin consultar nuevamente la API', async () => {
    const clientes = [{ id: 2 }, { id: 1 }];
    useClienteStore.setState({
      clientes,
      loaded: true,
      lastFetchedAt: Date.now()
    });

    const result = await useClienteStore.getState().fetchClientes();

    expect(result).toEqual(clientes);
    expect(ClienteService.getAllPages).not.toHaveBeenCalled();
  });

  it('devuelve el cache vencido de inmediato y lo actualiza en segundo plano', async () => {
    useClienteStore.setState({
      clientes: [{ id: 1 }],
      loaded: true,
      lastFetchedAt: Date.now() - CLIENTES_CACHE_TTL_MS - 1
    });
    ClienteService.getAllPages.mockResolvedValue({
      success: true,
      data: [{ id: 2 }]
    });

    const result = await useClienteStore.getState().fetchClientes();

    expect(ClienteService.getAllPages).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 1 }]);
    await Promise.resolve();
    expect(useClienteStore.getState().clientes).toEqual([{ id: 2 }]);
  });

  it('publica la primera pagina antes de completar el catalogo', async () => {
    let finishRequest;
    ClienteService.getAllPages.mockImplementation((_params, { onPage }) => {
      onPage({ data: [{ id: 3 }, { id: 2 }] });
      return new Promise((resolve) => {
        finishRequest = () => resolve({
          success: true,
          data: [{ id: 3 }, { id: 2 }, { id: 1 }]
        });
      });
    });

    const firstPage = await useClienteStore.getState().fetchClientes();

    expect(firstPage).toEqual([{ id: 3 }, { id: 2 }]);
    expect(useClienteStore.getState()).toMatchObject({
      clientes: [{ id: 3 }, { id: 2 }],
      loaded: false,
      loading: true
    });

    finishRequest();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useClienteStore.getState()).toMatchObject({
      clientes: [{ id: 3 }, { id: 2 }, { id: 1 }],
      loaded: true,
      loading: false
    });
  });

  it('conserva los clientes vencidos si la actualizacion falla', async () => {
    const clientes = [{ id: 1 }];
    useClienteStore.setState({
      clientes,
      loaded: true,
      lastFetchedAt: Date.now() - CLIENTES_CACHE_TTL_MS - 1
    });
    ClienteService.getAllPages.mockResolvedValue({
      success: false,
      error: 'API no disponible'
    });

    const result = await useClienteStore.getState().fetchClientes();

    expect(result).toEqual(clientes);
    expect(useClienteStore.getState().error).toBe('API no disponible');
  });

  it('persiste solamente el catalogo y su fecha de actualizacion', () => {
    useClienteStore.setState({
      clientes: [{ id: 7 }],
      loaded: true,
      lastFetchedAt: 123,
      clienteActual: { id: 99 },
      loading: true,
      error: 'temporal'
    });

    const cached = JSON.parse(localStorage.getItem(CLIENTES_CACHE_STORAGE_KEY));

    expect(cached.state).toEqual({
      clientes: [{ id: 7 }],
      loaded: true,
      lastFetchedAt: 123
    });
  });

  it('no marca como completo un catalogo parcial al agregar un cliente', () => {
    useClienteStore.setState({
      clientes: [],
      loaded: false,
      lastFetchedAt: 0
    });

    useClienteStore.getState().upsertCliente({ id: 8, first_name: 'Ana' });

    expect(useClienteStore.getState()).toMatchObject({
      clientes: [{ id: 8, first_name: 'Ana' }],
      loaded: false,
      lastFetchedAt: 0
    });
  });
});
