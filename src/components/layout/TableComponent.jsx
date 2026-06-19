import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog } from 'primereact/confirmdialog';
import ActionButtons from './ActionButtons';
import Loader from '../ux/Loader';

const TableComponent = ({
  data = [],
  loading = false,
  columns = [],
  header: customHeader,
  selection = null,
  onSelectionChange = null,
  rows = 10,
  first = 0,
  totalRecords = undefined,
  onPage = null,
  rowsPerPageOptions = [10, 25, 50, 60],
}) => {
  const defaultHeader = <ActionButtons />;
  const header = customHeader || defaultHeader;

  return (
    <>
      <ConfirmDialog />
      <div className="relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex justify-content-center align-items-center z-5 bg-white-alpha-70" style={{ backdropFilter: 'blur(2px)' }}>
            <Loader />
          </div>
        )}
        <DataTable
          value={Array.isArray(data) ? data : []}
          header={header}
          paginator
          lazy={typeof onPage === 'function'}
          rows={rows}
          first={first}
          totalRecords={typeof totalRecords === 'number' ? totalRecords : undefined}
          onPage={onPage || undefined}
          rowsPerPageOptions={rowsPerPageOptions}
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
              key={column.field || column.header}
              field={column.field}
              header={column.header}
              body={column.body}
              sortable
              style={column.style}
              headerStyle={column.headerStyle}
              bodyClassName={column.bodyClassName}
            />
          ))}
        </DataTable>
      </div>
    </>
  );
};

export default TableComponent;
