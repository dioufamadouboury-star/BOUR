import { useState, useEffect, createContext, useContext } from "react";
import { ChevronDown, Check } from "lucide-react";
import axios from "axios";
import { cn } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Currency Context
const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

// Available currencies
const CURRENCIES = [
  { code: "XOF", name: "Franc CFA", symbol: "FCFA", flag: "🇸🇳" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "USD", name: "Dollar US", symbol: "$", flag: "🇺🇸" },
];

// Currency Provider
export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("currency") || "XOF";
  });
  const [rates, setRates] = useState({ XOF: 1, EUR: 0.00152, USD: 0.00165 });
  const [loading, setLoading] = useState(false);

  // Fetch rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/currency/rates`);
        setRates(res.data.rates);
      } catch (e) {
        console.error("Failed to fetch rates:", e);
      }
    };
    fetchRates();
  }, []);

  // Save currency preference
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  // Convert price from XOF to selected currency
  const convertPrice = (priceInXOF) => {
    const rate = rates[currency] || 1;
    return priceInXOF * rate;
  };

  // Format price with currency symbol
  const formatPrice = (priceInXOF, options = {}) => {
    const converted = convertPrice(priceInXOF);
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    
    if (currency === "XOF") {
      return `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
    } else if (currency === "EUR") {
      return `${converted.toFixed(2).replace(".", ",")} €`;
    } else if (currency === "USD") {
      return `$${converted.toFixed(2)}`;
    }
    
    return `${converted.toFixed(2)} ${currencyInfo?.symbol || currency}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencies: CURRENCIES,
      rates,
      convertPrice,
      formatPrice,
      loading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Currency Selector Component
export function CurrencySelector({ className }) {
  const { currency, setCurrency, currencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
      >
        <span className="text-lg">{currentCurrency?.flag}</span>
        <span className="font-medium">{currency}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-1 z-50">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setCurrency(curr.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                  currency === curr.code && "bg-orange-50 dark:bg-orange-900/20"
                )}
              >
                <span className="text-xl">{curr.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{curr.code}</p>
                  <p className="text-xs text-muted-foreground">{curr.name}</p>
                </div>
                {currency === curr.code && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CurrencySelector;
