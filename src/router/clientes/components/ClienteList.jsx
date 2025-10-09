// src/modules/clientes/components/ClienteList.jsx
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useState } from 'react';

const ClienteList = ({ clientes, loading, onEdit, onDelete, onSearch }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  const confirmarEliminacion = (cliente) => {
    confirmDialog({
      message: `¿Estás seguro de eliminar al cliente ${cliente.nombreCompleto}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => onDelete(cliente.id),
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger'
    });
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => onEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminacion(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h2 className="m-0">Lista de Clientes</h2>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder="Buscar cliente..."
          className="w-full md:w-auto"
        />
      </span>
    </div>
  );

  return (
    <>
      <ConfirmDialog />
      <DataTable
        value={clientes}
        loading={loading}
        header={header}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron clientes"
        className="p-datatable-sm"
        stripedRows
      >
        <Column field="id" header="ID" sortable style={{ width: '5%' }} />
        <Column field="nombreCompleto" header="Nombre Completo" sortable style={{ width: '20%' }} />
        <Column field="email" header="Email" sortable style={{ width: '20%' }} />
        <Column field="telefono" header="Teléfono" sortable style={{ width: '15%' }} />
        <Column field="ciudad" header="Ciudad" sortable style={{ width: '12%' }} />
        <Column field="dniCuit" header="DNI/CUIT" sortable style={{ width: '15%' }} />
        <Column field="fechaRegistro" header="Fecha Registro" sortable style={{ width: '13%' }} />
        <Column 
          body={accionesTemplate} 
          header="Acciones" 
          style={{ width: '10%' }}
          exportable={false}
        />
      </DataTable>
    </>
  );
};

export default ClienteList;