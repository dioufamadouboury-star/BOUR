import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Sparkles, Smartphone, Home, Sofa, Car, Building, Star, ArrowRight, Package, Zap, Gift } from "lucide-react";
import SEO from "../components/SEO";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HERO_IMAGE = "https://images.pexels.com/photos/36285541/pexels-photo-36285541.jpeg?auto=compress&cs=tinysrgb&w=1400";

const CATEGORY_TABS = [
  { id: "all", label: "Tous", icon: Star, color: "from-amber-500 to-yellow-500" },
  { id: "electronique", label: "Électronique", icon: Smartphone, color: "from-blue-500 to-indigo-600" },
  { id: "electromenager", label: "Électroménager", icon: Home, color: "from-orange-500 to-red-500" },
  { id: "decoration", label: "Décoration", icon: Sofa, color: "from-emerald-500 to-teal-600" },
  { id: "beaute", label: "Mode & Beauté", icon: Sparkles, color: "from-pink-500 to-rose-600" },
  { id: "automobile", label: "Automobile", icon: Car, color: "from-slate-500 to-gray-600" },
  { id: "immobilier", label: "Immobilier", icon: Building, color: "from-cyan-500 to-blue-600" },
];

export default function NewProductsPage() {
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
      const response = await axios.get(`${API_URL}/api/products?is_new=true&limit=50${catParam}`);
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" data-testid="new-products-page">
      <SEO
        title="Nouveautés - Derniers Produits"
        description="Découvrez les derniers produits arrivés chez GROUPE YAMA+. Nouveautés électronique, décoration, beauté au Sénégal. Livraison rapide à Dakar."
        url="/nouveautes"
        keywords={["nouveautés Dakar", "nouveaux produits Sénégal", "dernières arrivées", "nouveauté tech Dakar"]}
      />

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 mb-6">
              GROUPE YAMA+ Nouveautés
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Fraîchement{" "}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Arrivés
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Électronique, Mode, Décoration, Automobile, Immobilier - Tout ce qui est nouveau chez YAMA+
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
          {CATEGORY_TABS.map((tab, i) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleTabChange(tab.id)}
              className={`group relative px-4 md:px-5 py-3 rounded-2xl font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-white shadow-2xl scale-105"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {activeTab === tab.id && (
                <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl`} />
              )}
              <span className="relative flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{activeTabInfo.label}</h2>
            <p className="text-white/50">{products.length} produit{products.length > 1 ? "s" : ""}</p>
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
                <Package className="w-20 h-20 mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-xl">Pas de nouveautés dans cette catégorie</p>
                <p className="text-white/30 mt-2">Revenez bientôt pour de nouvelles arrivées</p>
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
          Tout ce que <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">YAMA+</span> vous propose
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
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 p-8 md:p-12"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Ne manquez rien !</h3>
              <p className="text-white/90">Inscrivez-vous pour être alerté des nouvelles arrivées</p>
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
