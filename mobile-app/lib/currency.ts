const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  XOF: 'CFA',
  XAF: 'CFA',
  CDF: 'FC',
  GHS: '₵',
  NGN: '₦',
  ZAR: 'R',
  MAD: 'DH',
  TND: 'DT',
  DZD: 'DA',
  EGP: 'E£',
  KES: 'KSh',
  UGX: 'USh',
  TZS: 'TSh',
  RWF: 'RF',
  ETB: 'Br',
  MZN: 'MT',
  AOA: 'Kz',
};

export function formatPrice(price: number, currency: string): string {
  const symbol = currencySymbols[currency] || currency;
  const isXOF = currency === 'XOF' || currency === 'XAF';
  if (isXOF) {
    return `${Math.round(price)} ${symbol}`;
  }
  return `${symbol}${price.toFixed(2)}`;
}
