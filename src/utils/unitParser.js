const DEFAULT_UNIT = 'unit';
const KG_UNIT = 'kg';

const normalizeUnit = (unit) => {
  if (typeof unit !== 'string' || !unit.trim()) {
    return DEFAULT_UNIT;
  }
  const normalized = unit.trim().toLowerCase();
  if (normalized === KG_UNIT) return KG_UNIT;
  if (normalized === 'unit' || normalized === 'units' || normalized === 'unidad') {
    return DEFAULT_UNIT;
  }
  return normalized;
};

export const extractStockUnit = (source) => {
  if (!source) return DEFAULT_UNIT;
  const candidates = [
    source.stock_unit,
    source.producto?.stock_unit,
    source.product?.stock_unit,
    source.product_data?.stock_unit,
    source.producto?.stockUnit,
    source.product?.stockUnit,
    source.product_data?.stockUnit
  ];
  const found = candidates.find((value) => typeof value === 'string' && value.trim());
  return normalizeUnit(found);
};

export const formatUnitValue = (value, unit, options = {}) => {
  const { withSuffix = true } = options;
  const normalizedUnit = normalizeUnit(unit);
  const numericValue = Number(value);
  if (!isFinite(numericValue)) return '-';

  if (normalizedUnit === KG_UNIT) {
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(numericValue);
    return withSuffix ? `${formatted} kg` : formatted;
  }

  const integerValue = Math.trunc(numericValue);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(integerValue);
  return withSuffix ? `${formatted} u` : formatted;
};

export const formatQuantityFromSource = (quantity, source, options = {}) => {
  const unit = extractStockUnit(source);
  return formatUnitValue(quantity, unit, options);
};
