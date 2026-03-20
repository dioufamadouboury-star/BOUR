import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Search, MapPin, Home, Building, Landmark, Trees, BedDouble, Bath, Maximize, Filter, X, ChevronDown, Star, Eye, MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import { formatPrice } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LISTING_TYPES = [
  { id: "all", label: "Tous", icon: Home },
  { id: "rent_short", label: "Location courte durée", icon: Star },
  { id: "rent_long", label: "Location longue durée", icon: Building },
  { id: "sale", label: "Vente", icon: Landmark },
];

const PROPERTY_TYPES = [
  { id: "all", label: "Tous types" },
  { id: "apartment", label: "Appartement" },
  { id: "house", label: "Maison" },
  { id: "villa", label: "Villa" },
  { id: "studio", label: "Studio" },
  { id: "land", label: "Terrain" },
  { id: "commercial", label: "Commercial" },
];

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Mbour", "Saly", "Somone", "Rufisque", "Pikine"];

const PRICE_LABEL = { per_night: "/nuit", per_month: "/mois", per_year: "/an", total: "" };
const PROPERTY_TYPE_LABEL = { apartment: "Appartement", house: "Maison", villa: "Villa", studio: "Studio", land: "Terrain", commercial: "Commercial" };

export default function ImmobilierPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    listing_type: "all",
    property_type: "all",
    city: "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    sort: "newest",
  });

  useEffect(() => {
    fetchProperties();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/properties/stats`);
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchProperties = async (customFilters) => {
    setLoading(true);
    try {
      const f = customFilters || filters;
      const params = new URLSearchParams();
      if (f.listing_type !== "all") params.append("listing_type", f.listing_type);
      if (f.property_type !== "all") params.append("property_type", f.property_type);
      if (f.city) params.append("city", f.city);
      if (f.min_price) params.append("min_price", f.min_price);
      if (f.max_price) params.append("max_price", f.max_price);
      if (f.bedrooms) params.append("bedrooms", f.bedrooms);
      params.append("sort", f.sort);
      params.append("limit", "20");

      const res = await axios.get(`${API_URL}/api/properties?${params}`);
      setProperties(res.data.properties);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSearch = () => fetchProperties();

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key === "listing_type" || key === "sort") fetchProperties(newFilters);
  };

  return (
    <main className="min-h-screen pt-20 bg-[#FAFAFA] dark:bg-[#0A0A0A]" data-testid="immobilier-page">
      <SEO
        title="Immobilier - Locations & Ventes"
        description="Trouvez votre bien immobilier au Sénégal. Appartements, maisons, villas, terrains à Dakar, Saly, Mbour. Location courte et longue durée, vente."
        url="/immobilier"
        keywords={["immobilier Dakar", "location appartement Sénégal", "villa Saly", "terrain Dakar", "maison à louer Dakar"]}
      />

      {/* Hero */}
      <section className="relative text-white py-16 px-4 overflow-hidden min-h-[420px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/images/category_immobilier.jpg')` }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/80 via-[#1B4332]/70 to-[#1B4332]/90" />

        <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
          >
            Immobilier au Sénégal
          </motion.h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Trouvez votre bien idéal : appartements, maisons, villas et terrains à Dakar et régions
          </p>

          {/* Quick Stats */}
          {stats && stats.total > 0 && (
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-white/60">Biens disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.cities?.length || 0}</div>
                <div className="text-sm text-white/60">Villes</div>
              </div>
            </div>
          )}

          {/* Listing Type Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt.id}
                onClick={() => handleFilterChange("listing_type", lt.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filters.listing_type === lt.id
                    ? "bg-white text-[#1B4332] shadow-lg"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                data-testid={`filter-${lt.id}`}
              >
                <lt.icon className="w-4 h-4" />
                {lt.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm appearance-none"
                data-testid="city-filter"
              >
                <option value="">Toutes les villes</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors"
              data-testid="toggle-filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={handleSearch}
              className="px-8 py-3.5 rounded-xl bg-[#FFD700] text-[#1B4332] font-semibold hover:bg-[#FFC107] transition-colors"
              data-testid="search-btn"
            >
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          className="bg-white dark:bg-[#1C1C1E] border-b border-black/5 dark:border-white/5"
        >
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <select value={filters.property_type} onChange={(e) => handleFilterChange("property_type", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" data-testid="property-type-filter">
              {PROPERTY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input type="number" placeholder="Prix min (FCFA)" value={filters.min_price}
              onChange={(e) => handleFilterChange("min_price", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            <input type="number" placeholder="Prix max (FCFA)" value={filters.max_price}
              onChange={(e) => handleFilterChange("max_price", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            <select value={filters.bedrooms} onChange={(e) => handleFilterChange("bedrooms", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm">
              <option value="">Chambres</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+ chambres</option>)}
            </select>
            <select value={filters.sort} onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm">
              <option value="newest">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="surface_desc">Surface</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" data-testid="results-count">
            {total} bien{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-[#1C1C1E] rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun bien disponible</h3>
            <p className="text-muted-foreground">Revenez bientôt, de nouvelles annonces arrivent !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop, i) => (
              <PropertyCard key={prop.property_id} property={prop} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PropertyCard({ property, index }) {
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600";
  const typeLabel = PROPERTY_TYPE_LABEL[property.property_type] || property.property_type;
  const priceLabel = PRICE_LABEL[property.price_period] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/immobilier/${property.property_id}`}
        className="group block bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 dark:border-white/5"
        data-testid={`property-card-${property.property_id}`}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              property.listing_type === "sale" ? "bg-red-500" : property.listing_type === "rent_short" ? "bg-blue-500" : "bg-green-600"
            }`}>
              {property.listing_type === "sale" ? "Vente" : property.listing_type === "rent_short" ? "Courte durée" : "Location"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">{typeLabel}</span>
          </div>
          {property.featured && (
            <div className="absolute top-3 right-3">
              <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
            </div>
          )}
          {property.images?.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs backdrop-blur-sm">
              {property.images.length} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-[#2D6A4F] transition-colors">{property.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{property.location_area ? `${property.location_area}, ` : ""}{property.location_city}</span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            {property.bedrooms && (
              <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} ch.</span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} sdb</span>
            )}
            {property.surface && (
              <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{property.surface} m²</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-[#1B4332]">
              {property.price?.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span>
              <span className="text-xs text-muted-foreground font-normal">{priceLabel}</span>
            </div>
            {property.views > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />{property.views}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
