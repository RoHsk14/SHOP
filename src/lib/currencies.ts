export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  region?: string
}

export const worldCurrencies: Currency[] = [
  // African Currencies (prioritized)
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", flag: "CA", region: "africa" },
  { code: "XOF", name: "West African CFA Franc", symbol: "FCFA", flag: "WA", region: "africa" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "NG", region: "africa" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "EG", region: "africa" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "ZA", region: "africa" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "KE", region: "africa" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "GH", region: "africa" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "TZ", region: "africa" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "UG", region: "africa" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", flag: "MA", region: "africa" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", flag: "TN", region: "africa" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DA", flag: "DZ", region: "africa" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC", flag: "CD", region: "africa" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", flag: "AO", region: "africa" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", flag: "MU", region: "africa" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "ET", region: "africa" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", flag: "RW", region: "africa" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", flag: "SL", region: "africa" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", flag: "LR", region: "africa" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", flag: "GM", region: "africa" },
  
  // Major World Currencies
  { code: "EUR", name: "Euro", symbol: "€", flag: "EU", region: "world" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "US", region: "world" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "GB", region: "world" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "JP", region: "world" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "CN", region: "world" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "IN", region: "world" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "AU", region: "world" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "CA", region: "world" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "CH", region: "world" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "SG", region: "world" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "BR", region: "world" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "MX", region: "world" },
  { code: "ARS", name: "Argentine Peso", symbol: "ARS$", flag: "AR", region: "world" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "RU", region: "world" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "KR", region: "world" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "TR", region: "world" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "SE", region: "world" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "NO", region: "world" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "DK", region: "world" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "PL", region: "world" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "TH", region: "world" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "ID", region: "world" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "MY", region: "world" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "PH", region: "world" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "NZ", region: "world" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "HK", region: "world" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", flag: "TW", region: "world" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "SA", region: "world" },
]
