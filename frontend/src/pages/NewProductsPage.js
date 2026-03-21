import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Sparkles, Smartphone, Home, Sofa, Car, Building, Star, ArrowRight, Package } from "lucide-react";
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

const CATEGORY_CARDS = [
  { id: "electronique", label: "Électronique", image: "/assets/images/hero_electronique.jpg?v=2", href: "/category/electronique" },
  { id: "electromenager", label: "Électroménager", image: "/assets/images/hero_electromenager.jpg?v=2", href: "/category/electromenager" },
  { id: "decoration", label: "Décoration", image: "/assets/images/hero_decoration.jpg?v=2", href: "/category/decoration" },
  { id: "beaute", label: "Mode & Beauté", image: "/assets/images/hero_beaute.jpg?v=2", href: "/category/beaute" },
  { id: "automobile", label: "Automobile", image: "/assets/images/hero_automobile.jpg?v=2", href: "/category/automobile" },
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
  const activeTabInfo = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];

  return (
    <main className="min-h-screen" data-testid="new-products-page" style={{ background: "#0D0D5B" }}>
      <SEO title="Nouveautés - Derniers Produits" description="Découvrez les derniers produits chez GROUPE YAMA+" url="/nouveautes" />

      {/* ═══ HERO — Maquette fidèle ═══ */}
      <div className="relative overflow-hidden pt-28 pb-10 px-6" style={{ background: "linear-gradient(160deg, #0D0D6B 0%, #1a1a8a 40%, #0D0D55 100%)" }}>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#F5A623" }}>
            GROUPE YAMA+ NOUVEAUTÉS
          </motion.p>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            Fraîchement Arrivés
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-white/60 text-base md:text-lg max-w-2xl mx-auto mb-10">
            Électronique, Mode, Décoration, Automobile, Immobilier<br />— tout ce qui est nouveau chez YAMA+
          </motion.p>

          {/* Category Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-5 gap-3 mb-10">
            {CATEGORY_CARDS.map((cat, i) => (
              <motion.button key={cat.id} whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 300 }}
                onClick={() => handleTabChange(cat.id)}
                className={`flex flex-col items-center gap-2 group cursor-pointer ${activeTab === cat.id ? "opacity-100" : "opacity-80 hover:opacity-100"}`}>
                <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: activeTab === cat.id ? "#F5A623" : "transparent" }}>
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                </div>
                <span className="text-white font-semibold text-sm">{cat.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Filter pills */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex justify-center gap-2 flex-wrap">
            {CATEGORY_TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: active ? "white" : "rgba(255,255,255,0.1)",
                    color: active ? "#0D0D5B" : "rgba(255,255,255,0.8)",
                    border: active ? "none" : "1px solid rgba(255,255,255,0.2)"
                  }}>
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
            <h2 className="text-xl font-bold text-white">{activeTabInfo.label}</h2>
            <p className="text-white/40 text-sm">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-lg">Aucune nouveauté dans cette catégorie</p>
                <p className="text-white/30 text-sm mt-1">Revenez bientôt pour de nouvelles arrivées</p>
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
