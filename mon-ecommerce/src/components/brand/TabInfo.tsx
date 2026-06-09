"use client";

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Luxembourg",
  "Maroc", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire",
];

export default function TabInfo({
  shopName, setShopName,
  shopDescription, setShopDescription,
  ownerName, setOwnerName,
  shopCountry, setShopCountry,
  defaultCurrency, setDefaultCurrency,
  worldCurrencies,
}: {
  shopName: string;
  setShopName: (v: string) => void;
  shopDescription: string;
  setShopDescription: (v: string) => void;
  ownerName: string;
  setOwnerName: (v: string) => void;
  shopCountry: string;
  setShopCountry: (v: string) => void;
  defaultCurrency: string;
  setDefaultCurrency: (v: string) => void;
  worldCurrencies: { code: string; name: string; symbol: string }[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la boutique</label>
        <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
          placeholder="Ma Boutique"
          className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea value={shopDescription} onChange={e => setShopDescription(e.target.value)}
          placeholder="Décrivez votre boutique..." rows={3}
          className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors resize-none rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du propriétaire</label>
          <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
            placeholder="Votre nom"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
          <select value={shopCountry} onChange={e => setShopCountry(e.target.value)}
            className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Sélectionner</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise par défaut</label>
        <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}
          className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
        >
          {worldCurrencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}
        </select>
      </div>
    </div>
  );
}
