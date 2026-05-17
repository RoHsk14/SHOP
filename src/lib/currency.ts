export const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  XAF: 655.957,
  USD: 1.08,
};

export const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(price);
};

export const convertPrice = (basePrice: number, baseCurrency: string, targetCurrency: string) => {
  if (baseCurrency === targetCurrency) return basePrice;
  const priceInEur = basePrice / EXCHANGE_RATES[baseCurrency];
  return priceInEur * EXCHANGE_RATES[targetCurrency];
};

// Nouvelle fonction pour obtenir le prix selon la devise depuis l'objet prices (JSONB)
export const getPriceFromProduct = (product: any, currency: string): number => {
  if (product.prices && product.prices[currency]) {
    return product.prices[currency];
  }
  // Fallback à l'ancienne méthode
  if (product.base_price) {
    return convertPrice(product.base_price, product.currency_code || "EUR", currency);
  }
  return 0;
};
