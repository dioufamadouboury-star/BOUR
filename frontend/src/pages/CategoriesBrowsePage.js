import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Smartphone, Sofa, Shirt, Car, Home, Sparkles, 
  Tag, Clock, Wrench, ChevronRight 
} from "lucide-react";

const categories = [
  {
    id: "electronique",
    name: "Électronique",
    icon: Smartphone,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    description: "Smartphones, TV, Audio"
  },
  {
    id: "decoration",
    name: "Décoration",
    icon: Sofa,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    description: "Mobilier, Literie, Déco"
  },
  {
    id: "mode",
    name: "Mode",
    icon: Shirt,
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    description: "Vêtements, Accessoires"
  },
  {
    id: "automobile",
    name: "Automobile",
    icon: Car,
    color: "from-slate-500 to-gray-700",
    bgColor: "bg-slate-50 dark:bg-slate-900/20",
    description: "Véhicules, Pièces"
  },
  {
    id: "immobilier",
    name: "Immobilier",
    icon: Home,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    description: "Vente, Location"
  },
  {
    id: "electromenager",
    name: "Électroménager",
    icon: Sparkles,
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    description: "Climatisation, Cuisine"
  },
];

const quickLinks = [
  { href: "/promotions", icon: Tag, label: "Promotions", color: "text-red-500" },
  { href: "/nouveautes", icon: Clock, label: "Nouveautés", color: "text-green-500" },
  { href: "/services", icon: Wrench, label: "Services", color: "text-purple-500" },
];

export default function CategoriesBrowsePage() {
  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-black/5 dark:border-white/[0.06]">
        <div className="container-lumina py-4">
          <h1 className="text-xl font-bold">Explorer</h1>
          <p className="text-sm text-muted-foreground">Parcourez nos catégories</p>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="container-lumina py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickLinks.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#141414] rounded-full border border-black/5 dark:border-white/[0.06] whitespace-nowrap shadow-sm hover:shadow-md transition-shadow"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Categories Grid */}
      <div className="container-lumina py-4">
        <h2 className="text-lg font-semibold mb-4">Catégories</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/category/${category.id}`}
                className={`block p-4 rounded-2xl ${category.bgColor} border border-black/5 dark:border-white/[0.06] hover:shadow-lg transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.description}</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* All Products Link */}
      <div className="container-lumina py-4">
        <Link
          to="/products"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 hover:border-primary/40 transition-colors"
        >
          <div>
            <h3 className="font-semibold">Tous les produits</h3>
            <p className="text-sm text-muted-foreground">Voir notre catalogue complet</p>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </Link>
      </div>
    </main>
  );
}
