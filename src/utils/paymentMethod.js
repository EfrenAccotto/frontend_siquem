const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  debit: 'Debito'
};

export const DEFAULT_PAYMENT_METHOD = 'cash';

export const normalizePaymentMethod = (value) => {
  if (!value) return DEFAULT_PAYMENT_METHOD;
  const normalized = String(value).trim().toLowerCase();
  if (PAYMENT_METHOD_LABELS[normalized]) {
    return normalized;
  }
  const labelMatch = Object.entries(PAYMENT_METHOD_LABELS).find(([, label]) => label.toLowerCase() === normalized);
  if (labelMatch) {
    return labelMatch[0];
  }
  return DEFAULT_PAYMENT_METHOD;
};

export const formatPaymentMethod = (value) => {
  const method = normalizePaymentMethod(value);
  return PAYMENT_METHOD_LABELS[method] || PAYMENT_METHOD_LABELS[DEFAULT_PAYMENT_METHOD];
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const getPaymentMethodLabel = (value) => formatPaymentMethod(value);
