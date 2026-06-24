import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import ClienteService from '../router/clientes/services/ClienteService';
import useClienteStore from './useClienteStore';

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
      loaded: false
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
});
