const DEFAULT_UNIT = 'unit';
const KG_UNIT = 'kg';

const KG_ALIASES = ['kg', 'kgs', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'kilogram', 'kilograms'];
const UNIT_ALIASES = ['unit', 'units', 'unidad', 'unidades', 'u'];

const normalizeUnit = (unit) => {
  if (typeof unit !== 'string' || !unit.trim()) {
    return DEFAULT_UNIT;
  }
  const normalized = unit.trim().toLowerCase();
  if (KG_ALIASES.includes(normalized)) return KG_UNIT;
  if (UNIT_ALIASES.includes(normalized)) return DEFAULT_UNIT;
  return normalized;
};

const parseNumericValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const fallback = Number(value);
  return Number.isFinite(fallback) ? fallback : 0;
};

const extractUnitFromObject = (obj) => {
  if (!obj) return null;
  const candidates = [
    obj.stock_unit,
    obj.stockUnit,
    obj.product_stock_unit,
    obj.productStockUnit,
    obj.unit,
    obj.units,
    obj.unit_measure,
    obj.unitMeasure,
    obj.unit_measurement,
    obj.unitMeasurement,
    obj.measure_unit,
    obj.measureUnit,
    obj.product_unit,
    obj.productUnit,
    obj.unidad,
    obj.unidades
  ];
  const found = candidates.find((val) => typeof val === 'string' && val.trim());
  return found || null;
};

export const extractStockUnit = (source) => {
  if (!source) return DEFAULT_UNIT;
  const candidateSources = [
    source,
    source.product,
    source.producto,
    source.original_product,
    source.originalProduct,
    source.product_data,
    source.productData,
    source.product_info,
    source.productInfo
  ];

  for (const candidate of candidateSources) {
    const unitValue = extractUnitFromObject(candidate);
    if (unitValue) {
      return normalizeUnit(unitValue);
    }
  }

  return DEFAULT_UNIT;
};

export const parseQuantityValue = (value) => parseNumericValue(value);

export const formatUnitValue = (value, unit, options = {}) => {
  const { withSuffix = true } = options;
  const normalizedUnit = normalizeUnit(unit);
  const numericValue = parseNumericValue(value);

  if (normalizedUnit === KG_UNIT) {
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(numericValue);
    return withSuffix ? `${formatted} kg` : formatted;
  }

  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.trunc(numericValue));
  return withSuffix ? `${formatted} u` : formatted;
};

export const formatQuantityFromSource = (quantity, source, options = {}) => {
  const unit = extractStockUnit(source);
  const numericQuantity = parseNumericValue(quantity);
  return formatUnitValue(numericQuantity, unit, options);
};
