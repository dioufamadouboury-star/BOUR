import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { MapPin, BedDouble, Bath, Maximize, Home, ChevronLeft, ChevronRight, Phone, MessageCircle, Share2, Star, Calendar, Check, Building } from "lucide-react";
import SEO from "../components/SEO";
import ShareButtons from "../components/ShareButtons";
import AppointmentModal from "../components/AppointmentModal";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PRICE_LABEL = { per_night: "/nuit", per_month: "/mois", per_year: "/an", total: "" };
const LISTING_LABEL = { rent_short: "Location courte durée", rent_long: "Location longue durée", sale: "Vente" };
const TYPE_LABEL = { apartment: "Appartement", house: "Maison", villa: "Villa", studio: "Studio", land: "Terrain", commercial: "Commercial" };

const AMENITY_ICONS = {
  "WiFi": "wifi", "Piscine": "waves", "Parking": "car", "Climatisation": "snowflake",
  "Sécurité 24h": "shield", "Jardin": "flower2", "Terrasse": "sun", "Meublé": "sofa",
  "Cuisine équipée": "utensils", "Machine à laver": "washing-machine", "Groupe électrogène": "zap",
  "Eau courante": "droplets", "Ascenseur": "arrow-up", "Vue mer": "eye",
};

export default function PropertyDetailPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/properties/${propertyId}`);
        setProperty(res.data.property);
        setSimilar(res.data.similar || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <main className="min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bien non trouvé</h1>
          <Link to="/immobilier" className="text-[#2D6A4F] hover:underline">Retour aux annonces</Link>
        </div>
      </main>
    );
  }

  const images = property.images?.length ? property.images : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"];
  const priceLabel = PRICE_LABEL[property.price_period] || "";
  const whatsappMsg = encodeURIComponent(`Bonjour, je suis intéressé(e) par : ${property.title} - ${property.price?.toLocaleString("fr-FR")} FCFA${priceLabel}. Réf: ${property.property_id}`);
  const whatsappUrl = `https://wa.me/${(property.contact_whatsapp || property.contact_phone || "221783827575").replace(/\D/g, "")}?text=${whatsappMsg}`;

  return (
    <main className="min-h-screen pt-20 bg-[#FAFAFA] dark:bg-[#0A0A0A]" data-testid="property-detail-page">
      <SEO
        title={property.title}
        description={`${property.title} - ${TYPE_LABEL[property.property_type] || ""} ${property.location_area ? "à " + property.location_area + ", " : ""}${property.location_city}. ${property.price?.toLocaleString("fr-FR")} FCFA${priceLabel}. ${property.bedrooms ? property.bedrooms + " chambres. " : ""}${property.surface ? property.surface + " m². " : ""}`}
        url={`/immobilier/${property.property_id}`}
        image={images[0]}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" data-testid="breadcrumb">
          <Link to="/immobilier" className="hover:text-foreground">Immobilier</Link>
          <span>/</span>
          <span>{LISTING_LABEL[property.listing_type]}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10]" data-testid="property-gallery">
              <img
                src={images[currentImage]}
                alt={`${property.title} - Photo ${currentImage + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImage ? "bg-white scale-110" : "bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white ${
                  property.listing_type === "sale" ? "bg-red-500" : property.listing_type === "rent_short" ? "bg-blue-500" : "bg-green-600"
                }`}>
                  {LISTING_LABEL[property.listing_type]}
                </span>
                {property.is_furnished && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500 text-white">Meublé</span>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === currentImage ? "border-[#2D6A4F]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="property-title">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{property.location_address || ""}{property.location_area ? (property.location_address ? ", " : "") + property.location_area : ""}{property.location_city ? ", " + property.location_city : ""}</span>
                  </div>
                </div>
                <ShareButtons product={{ product_id: property.property_id, name: property.title, short_description: property.description?.substring(0, 100) }} />
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Building, label: TYPE_LABEL[property.property_type] || property.property_type, show: true },
                { icon: BedDouble, label: `${property.bedrooms} chambre${property.bedrooms > 1 ? "s" : ""}`, show: property.bedrooms },
                { icon: Bath, label: `${property.bathrooms} salle${property.bathrooms > 1 ? "s" : ""} de bain`, show: property.bathrooms },
                { icon: Maximize, label: `${property.surface} m²`, show: property.surface },
              ].filter(s => s.show).map((spec, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5">
                  <spec.icon className="w-5 h-5 text-[#2D6A4F]" />
                  <span className="text-sm font-medium">{spec.label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-black/5 dark:border-white/5">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed" data-testid="property-description">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-black/5 dark:border-white/5">
                <h2 className="text-lg font-semibold mb-4">Équipements & Services</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[#2D6A4F]" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Price + Contact */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-black/5 dark:border-white/5 sticky top-24" data-testid="price-card">
              <div className="text-3xl font-bold text-[#1B4332] mb-1">
                {property.price?.toLocaleString("fr-FR")} <span className="text-lg font-normal">FCFA</span>
                <span className="text-base text-muted-foreground font-normal">{priceLabel}</span>
              </div>

              {property.available_from && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 mb-4">
                  <Calendar className="w-4 h-4" />
                  Disponible à partir du {new Date(property.available_from).toLocaleDateString("fr-FR")}
                </div>
              )}

              <div className="border-t border-black/5 dark:border-white/5 my-4" />

              {/* Contact */}
              <div className="space-y-3">
                {property.contact_name && (
                  <p className="font-medium">{property.contact_name}</p>
                )}

                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20BD5A] transition-colors"
                  data-testid="whatsapp-contact">
                  <MessageCircle className="w-5 h-5" />
                  Contacter sur WhatsApp
                </a>

                {property.contact_phone && (
                  <a href={`tel:${property.contact_phone}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-[#1B4332] text-[#1B4332] dark:text-white font-semibold hover:bg-[#1B4332] hover:text-white transition-colors"
                    data-testid="phone-contact">
                    <Phone className="w-5 h-5" />
                    Appeler
                  </a>
                )}

                <button
                  onClick={() => setShowVisitModal(true)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#FFD700] text-[#1B4332] font-semibold hover:bg-[#FFC107] transition-colors"
                  data-testid="request-visit-btn"
                >
                  <Calendar className="w-5 h-5" />
                  Demander une visite
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Réf: {property.property_id}
              </p>
            </div>

            {/* Info Card */}
            <div className="bg-[#F0FFF4] dark:bg-[#1B4332]/20 rounded-2xl p-5 border border-[#2D6A4F]/10">
              <h3 className="font-semibold text-sm mb-2">Conseils de sécurité</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>- Visitez le bien avant tout engagement</li>
                <li>- Ne payez jamais avant la visite</li>
                <li>- Vérifiez les documents de propriété</li>
                <li>- Privilégiez les transactions sécurisées</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-6">Biens similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similar.map((prop) => (
                <Link key={prop.property_id} to={`/immobilier/${prop.property_id}`}
                  className="group bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 hover:shadow-lg transition-all">
                  <div className="h-36 overflow-hidden">
                    <img src={prop.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"} alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{prop.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{prop.location_city}</p>
                    <p className="text-sm font-bold text-[#1B4332] mt-2">{prop.price?.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Visit Appointment Modal */}
      <AppointmentModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        property={property}
        appointmentType="immobilier"
      />
    </main>
  );
}
