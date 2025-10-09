// src/modules/clientes/views/ClienteView.jsx
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ClienteList from '../components/ClienteList';
import ClienteForm from '../components/ClienteForm';

const ClienteView = () => {
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null );

  const {
    clientes,
    loading,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    searchClientes
  } = useClienteStore();

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleNuevoCliente = () => {
    setClienteEditando(null);
    setShowDialog(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditando(cliente);
    setShowDialog(true);
  };

  const handleGuardarCliente = async (clienteData) => {
    try {
      if (clienteEditando) {
        await updateCliente(clienteEditando.id, clienteData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente actualizado correctamente',
          life: 3000
        });
      } else {
        await createCliente(clienteData);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente creado correctamente',
          life: 3000
        });
      }
      setShowDialog(false);
      setClienteEditando(null);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al guardar el cliente',
        life: 3000
      });
    }
  };

  const handleEliminarCliente = async (id) => {
    try {
      await deleteCliente(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al eliminar el cliente',
        life: 3000
      });
    }
  };

  const handleBuscarCliente = async (query) => {
    if (query.trim() === '') {
      fetchClientes();
    } else {
      searchClientes(query);
    }
  };

  return (
    <div className="cliente-view">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Clientes</h1>
        <Button
          label="Nuevo Cliente"
          icon="pi pi-plus"
          onClick={handleNuevoCliente}
          className="p-button-success"
        />
      </div>

      <ClienteList
        clientes={clientes}
        loading={loading}
        onEdit={handleEditarCliente}
        onDelete={handleEliminarCliente}
        onSearch={handleBuscarCliente}
      />

      <ClienteForm
        visible={showDialog}
        cliente={clienteEditando}
        onHide={() => {
          setShowDialog(false);
          setClienteEditando(null);
        }}
        onSave={handleGuardarCliente}
        loading={loading}
      />
    </div>
  );
};

export default ClienteView;