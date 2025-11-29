import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ClienteService from '../services/ClienteService';
import ClienteForm from '../components/ClienteForm';
import { Toast } from 'primereact/toast';

const Columns = [
  { field: 'first_name', header: 'Nombre', style: { width: '25%' } },
  { field: 'last_name', header: 'Apellido', style: { width: '25%' } },
  { field: 'phone_number', header: 'Teléfono', style: { width: '20%' } },
  { field: 'dni', header: 'Email', style: { width: '25%' } },
];

const ClienteView = () => {
  const [clientes, setClientes] = useState([]);
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
          setClientes(response.data.results || response.data || []);
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
    if (selectedCliente) {
      setClienteEditando(selectedCliente);
      setShowDialog(true);
    }
  };

  const handleGuardar = async (formData) => {
    try {
      if (clienteEditando) {
        const response = await ClienteService.update(clienteEditando.id, formData);
        if (response.success) {
          const updatedClientes = clientes.map(c => c.id === clienteEditando.id ? { ...c, ...formData } : c);
          setClientes(updatedClientes);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await ClienteService.create(formData);
        if (response.success) {
          setClientes([...clientes, response.data]);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      }

      setShowDialog(false);
      setClienteEditando(null);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = async () => {
    if (selectedCliente) {
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
    }
  };

  return (
    <div className="cliente-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Clientes</h1>
      </div>

      <TableComponent
        data={clientes}
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