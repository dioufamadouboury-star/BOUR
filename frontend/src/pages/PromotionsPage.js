import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Sparkles, Smartphone, Home, Sofa, Car, Building, Star, ArrowRight, ShoppingBag, Percent, Tag, Zap, Gift, Clock } from "lucide-react";
import SEO from "../components/SEO";
import CategoryHero from "../components/CategoryHero";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HERO_IMAGE = "https://images.unsplash.com/photo-1760565030243-c92ed557e8da?w=1400";

const CATEGORY_TABS = [
  { id: "all", label: "Tous", icon: Star, color: "from-amber-500 to-yellow-500" },
  { id: "electronique", label: "Électronique", icon: Smartphone, color: "from-blue-500 to-indigo-600" },
  { id: "electromenager", label: "Électroménager", icon: Home, color: "from-orange-500 to-red-500" },
  { id: "decoration", label: "Décoration", icon: Sofa, color: "from-emerald-500 to-teal-600" },
  { id: "beaute", label: "Mode & Beauté", icon: Sparkles, color: "from-pink-500 to-rose-600" },
  { id: "automobile", label: "Automobile", icon: Car, color: "from-slate-500 to-gray-600" },
  { id: "immobilier", label: "Immobilier", icon: Building, color: "from-cyan-500 to-blue-600" },
];

export default function PromotionsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (category) => {
    setLoading(true);
    try {
      const cat = category !== undefined ? category : activeTab;
      const catParam = cat !== "all" ? `&category=${cat}` : "";
      const response = await axios.get(`${API_URL}/api/products?is_promo=true&limit=50${catParam}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    fetchProducts(tabId);
  };

  const activeTabInfo = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" data-testid="promotions-page">
      <SEO
        title="Promotions & Bonnes Affaires"
        description="Les meilleures promotions au Sénégal ! Réductions sur l'électronique, l'électroménager, la décoration et la beauté. Livraison rapide Dakar."
        url="/promotions"
        keywords={["promo Dakar", "promotion Sénégal", "réduction électronique", "soldes Dakar", "bonnes affaires Sénégal"]}
      />

      {/* Hero Section */}
      <CategoryHero
        image="/assets/images/hero_promotions.jpg?v=2"
        gradient="from-red-950/90 via-orange-950/70 to-red-950/85"
        accent="text-orange-400"
        badge="Offres Limitées"
        title="Promotions Exceptionnelles"
        subtitle="Profitez de réductions incroyables sur toutes nos catégories — Quantités limitées !"
        filters={CATEGORY_TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeFilter={activeTab}
        onFilterChange={(id) => handleTabChange(id)}
      />

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">{activeTabInfo.label}</h2>
            <p className="text-white/50">{products.length} promotion{products.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="w-20 h-20 mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-xl">Pas de promotions dans cette catégorie</p>
                <p className="text-white/30 mt-2">Revenez bientôt pour de nouvelles offres</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.product_id} product={product} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Services Showcase */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Promotions dans <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">toutes les catégories</span>
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Smartphone, title: "Électronique", desc: "Smartphones, PC, Gadgets", href: "/category/electronique", color: "from-blue-500 to-indigo-600" },
            { icon: Home, title: "Électroménager", desc: "Appareils du quotidien", href: "/category/electromenager", color: "from-orange-500 to-red-500" },
            { icon: Sofa, title: "Décoration", desc: "Design et confort", href: "/category/decoration", color: "from-emerald-500 to-teal-600" },
            { icon: Sparkles, title: "Mode & Beauté", desc: "Mode, soins, cosmétiques", href: "/category/beaute", color: "from-pink-500 to-rose-600" },
            { icon: Car, title: "Automobile", desc: "Véhicules, accessoires", href: "/category/automobile", color: "from-slate-500 to-gray-600" },
            { icon: Building, title: "Immobilier", desc: "Location et vente", href: "/immobilier", color: "from-cyan-500 to-blue-600" },
          ].map((svc, i) => (
            <Link key={i} to={svc.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${svc.color} rounded-xl flex items-center justify-center`}>
                  <svc.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{svc.title}</h3>
                <p className="text-white/40 text-xs">{svc.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500 to-orange-500 p-8 md:p-12"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Des questions sur nos offres ?</h3>
              <p className="text-white/90">Contactez-nous pour plus de détails sur les promotions en cours</p>
            </div>
            <Link to="/contact" className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-white/90 transition-all hover:shadow-2xl">
              Nous contacter <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
