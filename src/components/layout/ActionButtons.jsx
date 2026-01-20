import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const ActionButtons = ({
  showCreate = true,
  showEdit = true,
  showDelete = true,
  showExport = true,
  showDetail = false,
  editDisabled = false,
  deleteDisabled = false,
  detailDisabled = false,
  onCreate,
  onEdit,
  onDelete,
  onExport,
  onDetail,
  searchValue,
  onSearch,
  searchPlaceholder = 'Buscar...',
  filtersContent = null,
  extraActions = null,
  extraButtons = [],
}) => (
  <div className="flex gap-2 align-items-center w-full flex-wrap">
    <div className="flex-1" style={{ minWidth: '220px' }}>
      <span className="p-input-icon-left">
        <i className="pi pi-search ml-2" />
        <InputText
          placeholder={searchPlaceholder}
          className="w-full pl-5"
          value={searchValue}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </span>
    </div>

    {filtersContent && (
      <div className="flex align-items-center gap-2 flex-wrap">
        {filtersContent}
      </div>
    )}

    <div className="flex gap-2 flex-wrap justify-content-end">
      {extraActions}
      {Array.isArray(extraButtons) &&
        extraButtons.map((btn, idx) => (
          <Button
            key={`extra-btn-${idx}-${btn.label || 'btn'}`}
            label={btn.label}
            icon={btn.icon}
            className={btn.className || 'p-button-secondary p-button-raised'}
            onClick={btn.onClick}
            disabled={btn.disabled || btn.loading}
            loading={btn.loading}
            style={btn.disabled || btn.loading ? { opacity: 0.5 } : undefined}
          />
        ))}
      {showCreate && (
        <Button label="Crear" className="p-button-success p-button-raised" onClick={onCreate} />
      )}
      {showEdit && (
        <Button
          label="Editar"
          className="p-button-warning p-button-raised"
          onClick={onEdit}
          disabled={editDisabled}
          style={editDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showDelete && (
        <Button
          label="Eliminar"
          className="p-button-danger p-button-raised"
          onClick={onDelete}
          disabled={deleteDisabled}
          style={deleteDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showDetail && (
        <Button
          label="Ver Detalle"
          icon="pi pi-list"
          className="p-button-info p-button-raised"
          onClick={onDetail}
          disabled={detailDisabled}
          style={detailDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showExport && (
        <Button label="Exportar" className="p-button-info p-button-raised" onClick={onExport} />
      )}
    </div>
  </div>
);

export default ActionButtons;
