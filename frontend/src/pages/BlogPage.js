import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Calendar, Clock, Search, ArrowRight, BookOpen, Smartphone, Home, Sofa, Sparkles, Car, Building, Star, PenTool, MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import CategoryHero from "../components/CategoryHero";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BLOG_CATEGORIES = [
  { id: "all", label: "Tous", icon: Star },
  { id: "guides", label: "Guides d'achat", icon: BookOpen },
  { id: "tendances", label: "Tendances", icon: Sparkles },
  { id: "conseils", label: "Conseils", icon: PenTool },
  { id: "nouveautes", label: "Nouveautés", icon: Star },
];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? `?category=${activeTab}` : "";
      const response = await axios.get(`${API_URL}/api/blog/posts${params}`);
      setPosts(response.data);
    } catch (error) {
      setPosts(samplePosts);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const activeTabInfo = BLOG_CATEGORIES.find(t => t.id === activeTab) || BLOG_CATEGORIES[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" data-testid="blog-page">
      <SEO
        title="Blog - YAMA+ | Guides, Tendances & Conseils Shopping"
        description="Découvrez nos guides d'achat, les dernières tendances et conseils pour vos achats. Électronique, mode, maison et beauté au Sénégal."
      />

      {/* Hero Section */}
      <CategoryHero
        image="/assets/images/hero_blog.jpg"
        gradient="from-gray-950/90 via-gray-900/70 to-gray-950/85"
        accent="text-amber-400"
        badge="GROUPE YAMA+ Blog"
        title="Guides & Conseils"
        subtitle="Guides d'achat, tendances et conseils pour faire les meilleurs choix au Sénégal"
        filters={BLOG_CATEGORIES}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
      />

      {/* Search */}
      <div className="max-w-xl mx-auto px-4 -mt-4 relative z-10 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:border-amber-400/60"
            data-testid="blog-search" />
        </div>
      </div>
      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{BLOG_CATEGORIES.find(t => t.id === activeTab)?.label || "Tous les articles"}</h2>
            <p className="text-muted-foreground text-sm">{filteredPosts.length} article{filteredPosts.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab + searchQuery} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[16/10] rounded-2xl bg-white/5 mb-4" />
                    <div className="h-4 bg-white/5 rounded mb-2 w-1/4" />
                    <div className="h-6 bg-white/5 rounded mb-2" />
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 border border-white/10">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                          {post.category}
                        </span>
                        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTime} min
                          </span>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-white/50 text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                    </Link>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-20 h-20 mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-xl">Aucun article trouvé</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* What YAMA+ offers */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Découvrez tout <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">l'univers YAMA+</span>
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

      {/* Newsletter CTA */}
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
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Restez informé !</h3>
              <p className="text-white/90">Inscrivez-vous pour recevoir nos guides et conseils</p>
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

const samplePosts = [
  {
    id: 1, slug: "guide-achat-smartphone-2025",
    title: "Guide d'achat : Comment choisir son smartphone en 2025",
    excerpt: "Découvrez les critères essentiels pour choisir le smartphone parfait selon vos besoins et votre budget.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    category: "Guides d'achat", date: "2025-02-01", readTime: 8, author: "YAMA+"
  },
  {
    id: 2, slug: "tendances-decoration-2025",
    title: "Les tendances déco 2025 : Ce qui va transformer votre intérieur",
    excerpt: "Couleurs, matériaux, styles... Découvrez toutes les tendances décoration pour cette année.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    category: "Tendances", date: "2025-01-28", readTime: 6, author: "YAMA+"
  },
  {
    id: 3, slug: "conseils-entretien-electromenager",
    title: "5 conseils pour prolonger la durée de vie de vos appareils",
    excerpt: "Nos astuces simples pour entretenir vos appareils électroménagers et éviter les pannes.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    category: "Conseils", date: "2025-01-25", readTime: 5, author: "YAMA+"
  },
  {
    id: 4, slug: "nouveautes-apple-2025",
    title: "Apple 2025 : Toutes les nouveautés à venir",
    excerpt: "iPhone 17, MacBook M4, Apple Watch X... Tour d'horizon des produits Apple attendus cette année.",
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800",
    category: "Nouveautés", date: "2025-01-20", readTime: 7, author: "YAMA+"
  },
  {
    id: 5, slug: "routine-beaute-naturelle",
    title: "Routine beauté : Les indispensables pour une peau éclatante",
    excerpt: "Découvrez notre sélection de produits pour une routine beauté efficace et naturelle.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
    category: "Conseils", date: "2025-01-18", readTime: 4, author: "YAMA+"
  },
  {
    id: 6, slug: "guide-televiseur-4k",
    title: "TV 4K ou 8K : Quel téléviseur choisir en 2025 ?",
    excerpt: "OLED, QLED, Mini-LED... On vous explique tout pour faire le bon choix.",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
    category: "Guides d'achat", date: "2025-01-15", readTime: 9, author: "YAMA+"
  },
  {
    id: 7, slug: "guide-immobilier-dakar",
    title: "Immobilier à Dakar : Guide complet pour bien investir",
    excerpt: "Quartiers prisés, prix du marché, conseils pour acheter ou louer au Sénégal.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    category: "Guides d'achat", date: "2025-01-10", readTime: 10, author: "YAMA+"
  },
  {
    id: 8, slug: "entretien-voiture-senegal",
    title: "Entretien automobile au Sénégal : Les gestes essentiels",
    excerpt: "Climat chaud, routes poussiéreuses... Comment protéger votre véhicule au quotidien.",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
    category: "Conseils", date: "2025-01-05", readTime: 6, author: "YAMA+"
  },
  {
    id: 9, slug: "tendances-mode-africaine",
    title: "Mode africaine 2025 : Les tendances qui cartonnent",
    excerpt: "Du wax revisité aux créateurs émergents, la mode africaine s'impose sur la scène mondiale.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
    category: "Tendances", date: "2025-01-01", readTime: 5, author: "YAMA+"
  }
];
