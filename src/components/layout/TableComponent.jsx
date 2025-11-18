// src/modules/clientes/components/ClienteList.jsx
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog } from 'primereact/confirmdialog';
import ActionButtons from './ActionButtons';

const ClienteList = ({ data, loading,columns }) => {

  const header = (
   <ActionButtons/>
  );

  return (
    <>
      <ConfirmDialog />
      <DataTable
        value={data}
        header={header}
        columns={columns}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron clientes"
        className="p-datatable-sm"
        stripedRows
        // onRowSelect={}
      >
        {columns.map((column) => (
          <Column
            key={column.field}
            field={column.field}
            header={column.header}
            sortable
            style={column.style}
          />
        ))}
      </DataTable>
    </>
  );
};

export default ClienteList;