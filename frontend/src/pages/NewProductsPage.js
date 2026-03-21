import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Sparkles, Smartphone, Home, Sofa, Car, Building, Star, Package, Cpu } from "lucide-react";
import SEO from "../components/SEO";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HERO_IMAGE = "/assets/images/hero_nouveautes.jpg?v=3";

// Hero filters matching other category pages style
const HERO_FILTERS = [
  { id: "all", label: "Tous", icon: Star },
  { id: "electronique", label: "Électronique", icon: Smartphone },
  { id: "electromenager", label: "Électroménager", icon: Cpu },
  { id: "decoration", label: "Décoration", icon: Sofa },
  { id: "beaute", label: "Mode & Beauté", icon: Sparkles },
  { id: "automobile", label: "Automobile", icon: Car },
  { id: "immobilier", label: "Immobilier", icon: Building },
];

export default function NewProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async (category) => {
    setLoading(true);
    try {
      const cat = category !== undefined ? category : activeTab;
      const catParam = cat !== "all" ? `&category=${cat}` : "";
      const response = await axios.get(`${API_URL}/api/products?is_new=true&limit=50${catParam}`);
      setProducts(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleTabChange = (tabId) => { setActiveTab(tabId); fetchProducts(tabId); };
  const activeTabInfo = HERO_FILTERS.find(t => t.id === activeTab) || HERO_FILTERS[0];

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black" data-testid="new-products-page">
      <SEO title="Nouveautés - Derniers Produits" description="Découvrez les derniers produits chez GROUPE YAMA+" url="/nouveautes" />

      {/* ─── CATEGORY HERO (same structure as Électronique, Immobilier, etc.) ─── */}
      <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Nouveautés YAMA+"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/90 via-amber-900/70 to-stone-950/85" />
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-16 py-10 pt-28">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-semibold tracking-widest uppercase mb-2 text-yellow-400"
            >
              GROUPE YAMA+
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-white mb-3 max-w-xl leading-tight"
            >
              Nouveautés
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-sm md:text-base max-w-lg"
            >
              Découvrez les dernières arrivées — Électronique, Mode, Décoration, Automobile et plus
            </motion.p>
          </div>

          {/* Filter tabs (same style as other category pages) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-2 flex-wrap"
          >
            {HERO_FILTERS.map(f => {
              const Icon = f.icon;
              const active = activeTab === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleTabChange(f.id)}
                  data-testid={`filter-${f.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    active
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/10 backdrop-blur text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-black" : "text-yellow-400"}`} />
                  {f.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ─── PRODUCTS SECTION ─── */}
      <div className="container-lumina pt-8 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span>/</span>
            <span>Nouveautés</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{activeTabInfo.label}</h2>
              <p className="text-muted-foreground mt-1">
                {products.length} produit{products.length !== 1 ? "s" : ""} nouveau{products.length !== 1 ? "x" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-3xl skeleton" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-2xl">
                <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
                <p className="text-muted-foreground text-lg">Aucune nouveauté dans cette catégorie</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Revenez bientôt pour de nouvelles arrivées</p>
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
