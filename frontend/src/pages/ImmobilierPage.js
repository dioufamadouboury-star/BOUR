import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Home, Building, Landmark, Star, Trees, BedDouble, Bath, Maximize, MapPin, Eye, ArrowRight, Heart, Calendar, MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import AppointmentModal from "../components/AppointmentModal";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HERO_IMAGE = "/assets/images/immobilier_hero.jpg?v=3";

// Hero filters matching other category pages (Électronique style)
const HERO_FILTERS = [
  { id: "all", label: "Tous", icon: Home },
  { id: "rent_short", label: "Courte durée", icon: Star },
  { id: "rent_long", label: "Longue durée", icon: Building },
  { id: "sale", label: "Vente", icon: Landmark },
];

const LISTING_TYPES = [
  { id: "all", label: "Tous", icon: Home, color: "from-amber-500 to-yellow-500" },
  { id: "rent_short", label: "Courte durée", icon: Star, color: "from-cyan-500 to-blue-600" },
  { id: "rent_long", label: "Longue durée", icon: Building, color: "from-emerald-500 to-teal-600" },
  { id: "sale", label: "Vente", icon: Landmark, color: "from-rose-500 to-pink-600" },
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
const TYPE_LABEL = { apartment: "Appartement", house: "Maison", villa: "Villa", studio: "Studio", land: "Terrain", commercial: "Commercial" };
const LISTING_LABEL = { rent_short: "Courte durée", rent_long: "Location", sale: "Vente" };

export default function ImmobilierPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [wishlist, setWishlist] = useState([]);

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

  const fetchProperties = async (listingType, city) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const lt = listingType !== undefined ? listingType : activeTab;
      const c = city !== undefined ? city : cityFilter;
      if (lt !== "all") params.append("listing_type", lt);
      if (c) params.append("city", c);
      params.append("sort", "newest");
      params.append("limit", "20");
      const res = await axios.get(`${API_URL}/api/properties?${params}`);
      setProperties(res.data.properties);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    fetchProperties(tabId, cityFilter);
  };

  const handleCityChange = (city) => {
    setCityFilter(city);
    fetchProperties(activeTab, city);
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const activeListingType = LISTING_TYPES.find(t => t.id === activeTab) || LISTING_TYPES[0];

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black" data-testid="immobilier-page">
      <SEO
        title="Immobilier - GROUPE YAMA+"
        description="Trouvez votre bien immobilier au Sénégal. Appartements, maisons, villas, terrains à Dakar, Saly, Mbour."
        url="/immobilier"
        keywords={["immobilier Dakar", "location appartement Sénégal", "villa Saly", "terrain Dakar"]}
      />

      {/* ─── CATEGORY HERO (same structure as Électronique) ─── */}
      <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Immobilier YAMA+"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/90 via-stone-900/70 to-stone-950/85" />
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-16 py-10 pt-28">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-semibold tracking-widest uppercase mb-2 text-amber-400"
            >
              GROUPE YAMA+
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-white mb-3 max-w-xl leading-tight"
            >
              Immobilier
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-sm md:text-base max-w-lg"
            >
              Appartements, villas, maisons — location courte & longue durée, vente au Sénégal
            </motion.p>
          </div>

          {/* Filter tabs (same style as Électronique) */}
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
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-black" : "text-amber-400"}`} />
                  {f.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ─── PROPERTIES SECTION (same container style as Électronique) ─── */}
      <div className="container-lumina pt-8">
        {/* City filter + Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span>/</span>
            <span>Immobilier</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{activeListingType.label}</h2>
              <p className="text-muted-foreground mt-1">
                {total} bien{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
              </p>
            </div>
            
            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-5 py-2.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/10 dark:border-white/10 font-medium text-sm cursor-pointer"
              data-testid="city-filter"
            >
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab + cityFilter} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-2xl">
                <Building className="w-20 h-20 mx-auto text-gray-300 dark:text-white/20 mb-4" />
                <p className="text-muted-foreground text-xl">Aucun bien disponible</p>
                <p className="text-muted-foreground/60 mt-2">Revenez bientôt pour découvrir nos nouvelles offres</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property, i) => (
                  <PropertyCard
                    key={property.property_id}
                    property={property}
                    index={i}
                    isWished={wishlist.includes(property.property_id)}
                    onToggleWishlist={() => toggleWishlist(property.property_id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="container-lumina pb-20 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 p-8 md:p-12"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Besoin d'aide pour trouver ?</h3>
              <p className="text-white/90">Contactez-nous et décrivez votre bien idéal, nous le trouvons pour vous</p>
            </div>
            <Link
              to="/contact"
              className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-white/90 transition-all hover:shadow-2xl"
            >
              Nous contacter <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function PropertyCard({ property, index, isWished, onToggleWishlist }) {
  const [showVisitModal, setShowVisitModal] = useState(false);

  const listingBadge = {
    rent_short: { label: "Courte durée", cls: "from-cyan-500 to-blue-600" },
    rent_long: { label: "Location", cls: "from-emerald-500 to-teal-600" },
    sale: { label: "Vente", cls: "from-rose-500 to-pink-600" },
  };

  const badge = listingBadge[property.listing_type] || listingBadge.sale;
  const priceLabel = PRICE_LABEL[property.price_period] || "";
  const typeLabel = TYPE_LABEL[property.property_type] || property.property_type;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="group bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10"
          data-testid={`property-card-${property.property_id}`}>
          <Link to={`/immobilier/${property.property_id}`} className="block relative aspect-[4/3] overflow-hidden">
            <img
              src={property.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600"}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className={`px-3 py-1 bg-gradient-to-r ${badge.cls} text-white text-xs font-bold rounded-full`}>
                {badge.label}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                {typeLabel}
              </span>
            </div>

            {/* Wishlist + Featured */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {property.featured && (
                <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white fill-current" />
                </span>
              )}
              <button
                onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
                className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                  isWished ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                }`}
              >
                <Heart className={`w-4 h-4 ${isWished ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Bottom info on image */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white/80 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{property.location_area ? `${property.location_area}, ` : ""}{property.location_city}</span>
            </div>
          </Link>

          {/* Info */}
          <div className="p-5">
            <Link to={`/immobilier/${property.property_id}`}>
              <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-amber-500 transition-colors min-h-[3.5rem]">
                {property.title}
              </h3>
            </Link>

            {/* Specs */}
            <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.bedrooms}</span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</span>
              )}
              {property.surface > 0 && (
                <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{property.surface}m²</span>
              )}
            </div>

            {/* Price + Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10">
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  {property.price?.toLocaleString("fr-FR")} <span className="text-sm">FCFA</span>
                </p>
                {priceLabel && <p className="text-xs text-muted-foreground">{priceLabel}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                  title="Demander une visite"
                  data-testid={`visit-btn-${property.property_id}`}
                >
                  <Calendar className="w-5 h-5" />
                </button>
                {property.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${property.contact_whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, je suis intéressé par : ${property.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                    title="WhatsApp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AppointmentModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        property={property}
        appointmentType="immobilier"
      />
    </>
  );
}
