// src/modules/clientes/components/ClienteList.jsx
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog } from 'primereact/confirmdialog';
import ActionButtons from './ActionButtons';

const TableComponent = ({
  data = [],
  loading = false,
  columns = [],
  header: customHeader,
  selection = null,
  onSelectionChange = null,
}) => {

  const defaultHeader = <ActionButtons />;

  const header = customHeader || defaultHeader;
  return (
    <>
      <ConfirmDialog />
      <DataTable
        value={Array.isArray(data) ? data : []}
        header={header}
        columns={columns}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron registros"
        className="p-datatable-sm"
        stripedRows
        scrollable={true}
        scrollHeight="550px"
        selectionMode="single"
        selection={selection}
        onSelectionChange={(e) => onSelectionChange && onSelectionChange(e.value)}
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

export default TableComponent;