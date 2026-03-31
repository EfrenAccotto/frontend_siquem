import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ClienteService from '../services/ClienteService';
import ClienteForm from '../components/ClienteForm';
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
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchClientes = async () => {
      setLoading(true);
      try {
        const response = await ClienteService.getAll();
        if (!mounted) return;

        if (response.success) {
          const list = response.data.results || response.data || [];
          setClientes(Array.isArray(list) ? sortClientesByIdDesc(list) : []);
        } else {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar clientes', life: 3000 });
        }
      } catch {
        if (mounted) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchClientes();

    return () => {
      mounted = false;
    };
  }, []);

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

        setClientes((prev) =>
          sortClientesByIdDesc(prev.map((clienteItem) =>
            clienteItem.id === clienteEditando.id ? response.data : clienteItem
          ))
        );
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Cliente actualizado', life: 3000 });
      } else {
        const response = await ClienteService.create(formData);
        const verifiedCliente = await verifyCreatedCliente(response);

        setClientes((prev) => sortClientesByIdDesc([verifiedCliente, ...(prev || [])]));
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

      setClientes((prev) => prev.filter((clienteItem) => clienteItem.id !== selectedCliente.id));
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

  const filteredClientes = Array.isArray(clientes)
    ? clientes.filter((clienteItem) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        return (
          (clienteItem.first_name || '').toLowerCase().includes(term) ||
          (clienteItem.last_name || '').toLowerCase().includes(term) ||
          (clienteItem.dni || '').toString().toLowerCase().includes(term) ||
          (clienteItem.phone_number || '').toLowerCase().includes(term)
        );
      })
    : [];

  return (
    <div className="cliente-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestion de Clientes</h1>
      </div>

      <TableComponent
        data={filteredClientes}
        loading={loading}
        columns={Columns}
        selection={selectedCliente}
        onSelectionChange={setSelectedCliente}
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
