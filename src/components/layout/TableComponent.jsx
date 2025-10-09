// src/modules/clientes/components/ClienteList.jsx
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog } from 'primereact/confirmdialog';
import ActionButtons from './ActionButtons';

const ClienteList = ({ clientes, loading }) => {

  const header = (
   <ActionButtons/>
  );

  return (
    <>
      <ConfirmDialog />
      <DataTable
        value={clientes}
        header={header}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron clientes"
        className="p-datatable-sm"
        stripedRows
        // onRowSelect={}
      >
        <Column field="id" header="ID" sortable style={{ width: '5%' }} />
        <Column field="nombreCompleto" header="Nombre Completo" sortable style={{ width: '20%' }} />
        <Column field="email" header="Email" sortable style={{ width: '20%' }} />
        <Column field="telefono" header="Teléfono" sortable style={{ width: '15%' }} />
        <Column field="ciudad" header="Ciudad" sortable style={{ width: '12%' }} />
        <Column field="dniCuit" header="DNI/CUIT" sortable style={{ width: '15%' }} />
        <Column field="fechaRegistro" header="Fecha Registro" sortable style={{ width: '13%' }} />
      </DataTable>
    </>
  );
};

export default ClienteList;