import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ClienteService from '../services/ClienteService';
import ClienteForm from '../components/ClienteForm';
import useClienteStore from '../../../store/useClienteStore';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';

const formatAddress = (cliente) => {
  const address = cliente?.address;
  if (!address) return 'Sin direccion';

  const main = [address.street, address.number].filter(Boolean).join(' ').trim();
  const location = [
    address.locality?.name,
    address.locality?.province?.name
  ].filter(Boolean).join(', ');
  const extra = [address.floor, address.apartment].filter(Boolean).join(' ').trim();

  const locationText = location ? ` (${location})` : '';
  const extraText = extra ? ` ${extra}` : '';
  return `${main}${extraText}${locationText}`.trim() || 'Sin direccion';
};

const Columns = [
  { field: 'first_name', header: 'Nombre', style: { width: '18%' } },
  { field: 'last_name', header: 'Apellido', style: { width: '18%' } },
  { field: 'phone_number', header: 'Telefono', style: { width: '18%' } },
  { field: 'dni', header: 'DNI', style: { width: '16%' } },
  { header: 'Direccion', body: formatAddress, style: { width: '30%' } },
];

const sortClientesByIdDesc = (list = []) =>
  [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

const getErrorDetail = (errorValue, fallbackMessage) => {
  if (typeof errorValue === 'string' && errorValue.trim()) return errorValue;
  if (!errorValue || typeof errorValue !== 'object') return fallbackMessage;

  const firstKey = Object.keys(errorValue)[0];
  const firstValue = errorValue[firstKey];

  if (Array.isArray(firstValue) && firstValue.length) {
    return `${firstKey}: ${firstValue[0]}`;
  }

  if (typeof firstValue === 'string' && firstValue.trim()) {
    return `${firstKey}: ${firstValue}`;
  }

  return fallbackMessage;
};

const verifyCreatedCliente = async (createdResponse) => {
  const createdId = createdResponse?.data?.id;

  if (!createdResponse?.success || !createdId) {
    throw new Error(getErrorDetail(createdResponse?.error, 'El backend no confirmo el alta del cliente'));
  }

  const verification = await ClienteService.getById(createdId);
  if (!verification?.success || !verification?.data?.id) {
    throw new Error(getErrorDetail(verification?.error, 'No se pudo verificar el cliente guardado en el backend'));
  }

  return verification.data;
};

const ClienteView = () => {
  const DEFAULT_ROWS = 60;
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, rows: DEFAULT_ROWS, total: 0 });
  const toast = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadClientes = async ({ page = pagination.page, rows = pagination.rows, searchTerm = debouncedSearch } = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: rows
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await ClienteService.getAll(params);
      if (response.success) {
        const list = response.data || [];
        setClientes(Array.isArray(list) ? sortClientesByIdDesc(list) : []);
        setSelectedCliente(null);
        setPagination((prev) => ({
          ...prev,
          page,
          rows,
          total: Number(response.pagination?.count) || 0
        }));
      } else {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar clientes', life: 3000 });
      }
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes({
      page: pagination.page,
      rows: pagination.rows,
      searchTerm: debouncedSearch
    });
  }, [pagination.page, pagination.rows, debouncedSearch]);

  const handleNuevo = () => {
    setClienteEditando(null);
    setShowDialog(true);
  };

  const handleEditar = () => {
    if (!selectedCliente) return;

    setLoading(true);
    ClienteService.getById(selectedCliente.id)
      .then((response) => {
        if (response.success && response.data) {
          setClienteEditando(response.data);
          setShowDialog(true);
          return;
        }

        const detail = getErrorDetail(response.error, 'No se pudo obtener el cliente');
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
      })
      .catch((error) => {
        const detail = error?.message || 'No se pudo obtener el cliente';
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
      })
      .finally(() => setLoading(false));
  };

  const handleGuardar = async (formData) => {
    try {
      if (clienteEditando) {
        const response = await ClienteService.update(clienteEditando.id, formData);
        if (!response.success) {
          throw new Error(getErrorDetail(response.error, 'No se pudo actualizar el cliente'));
        }

        useClienteStore.getState().upsertCliente(response.data);
        await loadClientes();
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Cliente actualizado', life: 3000 });
      } else {
        const response = await ClienteService.create(formData);
        const clienteCreado = await verifyCreatedCliente(response);
        useClienteStore.getState().upsertCliente(clienteCreado);
        setPagination((prev) => ({ ...prev, page: 1 }));
        await loadClientes({ page: 1 });
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Cliente guardado correctamente', life: 3000 });
      }

      setShowDialog(false);
      setClienteEditando(null);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'No se pudo guardar el cliente',
        life: 3500
      });
    }
  };

  const eliminarSeleccionado = async () => {
    if (!selectedCliente) return;

    try {
      const response = await ClienteService.delete(selectedCliente.id);
      if (!response.success) {
        throw new Error(getErrorDetail(response.error, 'No se pudo eliminar el cliente'));
      }

      useClienteStore.getState().removeCliente(selectedCliente.id);
      await loadClientes();
      setSelectedCliente(null);
      toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Cliente eliminado', life: 3000 });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedCliente) return;
    const nombre = `${selectedCliente.first_name || ''} ${selectedCliente.last_name || ''}`.trim() || 'este cliente';
    confirmDialog({
      message: `¿Seguro que deseas eliminar a ${nombre}?`,
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  return (
    <div className="cliente-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestion de Clientes</h1>
      </div>

      <TableComponent
        data={clientes}
        loading={loading}
        columns={Columns}
        selection={selectedCliente}
        onSelectionChange={setSelectedCliente}
        rows={pagination.rows}
        first={(pagination.page - 1) * pagination.rows}
        totalRecords={pagination.total}
        rowsPerPageOptions={[10, 25, 50, 60]}
        onPage={(event) => {
          setPagination((prev) => ({
            ...prev,
            page: Math.floor(event.first / event.rows) + 1,
            rows: event.rows
          }));
        }}
        header={
          <ActionButtons
            showCreate={true}
            showEdit={true}
            showDelete={true}
            showExport={false}
            editDisabled={!selectedCliente}
            deleteDisabled={!selectedCliente}
            searchValue={search}
            onSearch={(value) => setSearch(value || '')}
            onCreate={handleNuevo}
            onEdit={handleEditar}
            onDelete={handleEliminar}
          />
        }
      />

      <ClienteForm
        visible={showDialog}
        cliente={clienteEditando}
        onHide={() => {
          setShowDialog(false);
          setClienteEditando(null);
        }}
        onSave={handleGuardar}
      />
    </div>
  );
};

export default ClienteView;
