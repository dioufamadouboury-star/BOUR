import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, ArrowRight } from "lucide-react";
import axios from "axios";
import { cn, formatPrice } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Popular searches (static)
const POPULAR_SEARCHES = [
  "iPhone",
  "Samsung",
  "Climatiseur",
  "Réfrigérateur",
  "Canapé",
  "Télévision"
];

export default function SearchBar({ className, onClose, isExpanded = false }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/products?search=${encodeURIComponent(query)}&limit=5`);
        setProducts(res.data || []);
        
        // Generate suggestions from product names
        const names = res.data?.map(p => p.name) || [];
        const uniqueSuggestions = [...new Set(names.map(n => n.split(" ").slice(0, 3).join(" ")))];
        setSuggestions(uniqueSuggestions.slice(0, 4));
      } catch (e) {
        console.error("Search error:", e);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
    
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowDropdown(false);
    setQuery("");
    onClose?.();
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Rechercher un produit..."
          className="w-full h-12 pl-12 pr-10 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setSuggestions([]); setProducts([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          >
            {/* Loading */}
            {loading && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto"></div>
              </div>
            )}

            {/* Suggestions */}
            {!loading && suggestions.length > 0 && (
              <div className="p-2 border-b border-black/5 dark:border-white/10">
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggestions</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(s)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span dangerouslySetInnerHTML={{ 
                      __html: s.replace(new RegExp(`(${query})`, 'gi'), '<strong>$1</strong>') 
                    }} />
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {!loading && products.length > 0 && (
              <div className="p-2 border-b border-black/5 dark:border-white/10">
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Produits</p>
                {products.map((p) => (
                  <button
                    key={p.product_id}
                    onClick={() => { navigate(`/product/${p.product_id}`); setShowDropdown(false); setQuery(""); onClose?.(); }}
                    className="w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-3"
                  >
                    <img src={p.images?.[0] || "/placeholder.jpg"} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-orange-600 font-semibold">{formatPrice(p.price)}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => handleSearch()}
                  className="w-full mt-1 px-3 py-2 text-sm text-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-center gap-1"
                >
                  Voir tous les résultats <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Recent Searches */}
            {!loading && !query && recentSearches.length > 0 && (
              <div className="p-2 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recherches récentes</p>
                  <button onClick={clearRecent} className="text-xs text-red-500 hover:underline">Effacer</button>
                </div>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(s)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!loading && !query && (
              <div className="p-2">
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Tendances
                </p>
                <div className="flex flex-wrap gap-2 px-3 py-2">
                  {POPULAR_SEARCHES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(s)}
                      className="px-3 py-1.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] text-sm rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && query.length >= 2 && products.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucun résultat pour "{query}"</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Essayez un autre terme</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
