import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ClienteService from '../services/ClienteService';
import ClienteForm from '../components/ClienteForm';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';

const formatAddress = (cliente) => {
  const address = cliente?.address;
  if (!address) return 'Sin dirección';

  const main = [address.street, address.number].filter(Boolean).join(' ').trim();
  const location = [
    address.locality?.name,
    address.locality?.province?.name
  ].filter(Boolean).join(', ');
  const extra = [address.floor, address.apartment].filter(Boolean).join(' ').trim();

  const locationText = location ? ` (${location})` : '';
  const extraText = extra ? ` ${extra}` : '';
  return `${main}${extraText}${locationText}`.trim() || 'Sin dirección';
};

const Columns = [
  { field: 'first_name', header: 'Nombre', style: { width: '18%' } },
  { field: 'last_name', header: 'Apellido', style: { width: '18%' } },
  { field: 'phone_number', header: 'Teléfono', style: { width: '18%' } },
  { field: 'dni', header: 'DNI', style: { width: '16%' } },
  { header: 'Dirección', body: formatAddress, style: { width: '30%' } },
];

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
          const sorted = Array.isArray(list) ? [...list].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
          setClientes(sorted);
        } else {
          console.error('Error al obtener clientes:', response.error);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar clientes', life: 3000 });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error inesperado:', error);
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
        } else {
          const detail = typeof response.error === 'string' ? response.error : 'No se pudo obtener el cliente';
          toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
        }
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
        if (response.success) {
          const updatedClientes = clientes
            .map(c => c.id === clienteEditando.id ? response.data : c)
            .sort((a, b) => (b.id || 0) - (a.id || 0));
          setClientes(updatedClientes);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
        } else {
          const detail = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
          throw new Error(detail);
        }
      } else {
        const response = await ClienteService.create(formData);
        if (response.success) {
          // Optimista: agrega el nuevo registro primero
          setClientes((prev) => {
            const next = [response.data, ...(prev || [])];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
          // Refresca con backend en segundo plano, solo si trae algo
          ClienteService.getAll()
            .then((refetch) => {
              const list = refetch?.data?.results || refetch?.data || [];
              if (Array.isArray(list) && list.length > 0) {
                setClientes([...list].sort((a, b) => (b.id || 0) - (a.id || 0)));
              }
            })
            .catch(() => {
              /* si falla el refetch, dejamos la lista optimista */
            });
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
        } else {
          // Intenta extraer el primer mensaje legible del backend
          const err = response.error;
          let detail = typeof err === 'string' ? err : '';
          if (!detail && err && typeof err === 'object') {
            const firstKey = Object.keys(err)[0];
            const firstVal = err[firstKey];
            if (Array.isArray(firstVal) && firstVal.length) {
              detail = `${firstKey}: ${firstVal[0]}`;
            } else {
              detail = JSON.stringify(err);
            }
          }
          throw new Error(detail || 'Error al crear cliente');
        }
      }

      setShowDialog(false);
      setClienteEditando(null);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const eliminarSeleccionado = async () => {
    if (!selectedCliente) return;
    try {
      const response = await ClienteService.delete(selectedCliente.id);
      if (response.success) {
        const updatedClientes = clientes.filter(c => c.id !== selectedCliente.id);
        setClientes(updatedClientes);
        setSelectedCliente(null);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedCliente) return;
    const nombre = `${selectedCliente.first_name || ''} ${selectedCliente.last_name || ''}`.trim() || 'este cliente';
    confirmDialog({
      message: `¿Seguro que deseas eliminar a ${nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  const filteredClientes = Array.isArray(clientes)
    ? clientes.filter((c) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        return (
          (c.first_name || '').toLowerCase().includes(term) ||
          (c.last_name || '').toLowerCase().includes(term) ||
          (c.dni || '').toString().toLowerCase().includes(term) ||
          (c.phone_number || '').toLowerCase().includes(term)
        );
      })
    : [];

  return (
    <div className="cliente-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Clientes</h1>
      </div>

      <TableComponent
        data={filteredClientes}
        loading={loading}
        columns={Columns}
        selection={selectedCliente}
        onSelectionChange={setSelectedCliente}
        header={<ActionButtons
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
        />}
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
