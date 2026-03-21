import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Sparkles, Smartphone, Home, Sofa, Car, Building, Star, ShoppingBag, Percent, Tag } from "lucide-react";
import SEO from "../components/SEO";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_TABS = [
  { id: "all", label: "Tous", icon: Star },
  { id: "electronique", label: "Électronique", icon: Smartphone },
  { id: "electromenager", label: "Électroménager", icon: Home },
  { id: "decoration", label: "Décoration", icon: Sofa },
  { id: "beaute", label: "Mode & Beauté", icon: Sparkles },
  { id: "automobile", label: "Automobile", icon: Car },
  { id: "immobilier", label: "Immobilier", icon: Building },
];

export default function PromotionsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async (category) => {
    setLoading(true);
    try {
      const cat = category !== undefined ? category : activeTab;
      const catParam = cat !== "all" ? `&category=${cat}` : "";
      const response = await axios.get(`${API_URL}/api/products?is_promo=true&limit=50${catParam}`);
      setProducts(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleTabChange = (tabId) => { setActiveTab(tabId); fetchProducts(tabId); };
  const activeTabInfo = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black" data-testid="promotions-page">
      <SEO title="Promotions Exceptionnelles - YAMA+" description="Profitez de réductions incroyables sur toutes nos catégories" />

      {/* ═══ HERO — Maquette rouge confettis ═══ */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "520px" }}>
        {/* Background image */}
        <img
          src="/assets/images/hero_promotions.jpg?v=3"
          alt="Promotions"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtle dark overlay top for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40" />

        <div className="relative z-10 flex flex-col justify-between h-full px-6 md:px-14 pt-28 pb-8" style={{ minHeight: "520px" }}>
          {/* Content */}
          <div className="max-w-lg">
            {/* Badge */}
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold tracking-widest uppercase mb-3"
              style={{ color: "#F5A623" }}
            >
              OFFRES LIMITÉES
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-5"
            >
              Promotions<br />Exceptionnelles
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-white/90 text-base md:text-lg max-w-sm"
            >
              Profitez de réductions incroyables sur toutes nos catégories — Quantités limitées !
            </motion.p>
          </div>

          {/* Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex gap-2 flex-wrap mt-8"
          >
            {CATEGORY_TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: active ? "white" : "rgba(255,255,255,0.15)",
                    color: active ? "#C0392B" : "white",
                    border: "none",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ═══ Products Grid ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{activeTabInfo.label}</h2>
            <p className="text-muted-foreground text-sm">{products.length} produit{products.length !== 1 ? "s" : ""} en promotion</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-3xl bg-gray-200 dark:bg-white/5 animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Percent className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
                <p className="text-lg font-semibold text-gray-500 dark:text-white/50">Aucune promotion dans cette catégorie</p>
                <p className="text-sm text-gray-400 dark:text-white/30 mt-1">De nouvelles offres arrivent bientôt</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product, i) => <ProductCard key={product.product_id} product={product} index={i} />)}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
