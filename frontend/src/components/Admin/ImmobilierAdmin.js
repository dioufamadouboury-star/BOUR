import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Plus, Edit, Trash2, Eye, Star, MapPin, X, Upload, Loader2, Search, Filter, Home, Building, Landmark, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PROPERTY_TYPES = [
  { id: "apartment", label: "Appartement" },
  { id: "house", label: "Maison" },
  { id: "villa", label: "Villa" },
  { id: "studio", label: "Studio" },
  { id: "land", label: "Terrain" },
  { id: "commercial", label: "Commercial" },
];

const LISTING_TYPES = [
  { id: "rent_short", label: "Location courte durée" },
  { id: "rent_long", label: "Location longue durée" },
  { id: "sale", label: "Vente" },
];

const AMENITIES_OPTIONS = [
  "WiFi", "Piscine", "Parking", "Climatisation", "Sécurité 24h", "Jardin",
  "Terrasse", "Meublé", "Cuisine équipée", "Machine à laver", "Groupe électrogène",
  "Eau courante", "Ascenseur", "Vue mer", "Balcon", "Garage",
  "Salle de sport", "Conciergerie", "Domotique", "Vidéosurveillance", "Interphone",
  "Digicode", "Fibre optique", "Panneaux solaires", "Citerne d'eau", "Fosse septique",
];

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Mbour", "Saly", "Somone", "Rufisque", "Pikine", "Ziguinchor", "Kaolack"];

export default function ImmobilierAdmin({ token }) {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [filterType, setFilterType] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterType ? `?listing_type=${filterType}` : "";
      const res = await axios.get(`${API_URL}/api/admin/properties${params}`, authHeader);
      setProperties(res.data.properties);
      setTotal(res.data.total);
    } catch (e) {
      toast.error("Erreur chargement des biens");
    }
    setLoading(false);
  }, [filterType, token]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce bien ?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/properties/${id}`, authHeader);
      toast.success("Bien supprimé");
      fetchProperties();
    } catch (e) { toast.error("Erreur suppression"); }
  };

  const toggleFeatured = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/api/admin/properties/${id}/toggle-featured`, {}, authHeader);
      toast.success(res.data.message);
      fetchProperties();
    } catch (e) { toast.error("Erreur"); }
  };

  const toggleAvailability = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/api/admin/properties/${id}/toggle-availability`, {}, authHeader);
      toast.success(res.data.message);
      fetchProperties();
    } catch (e) { toast.error("Erreur"); }
  };

  return (
    <div data-testid="immobilier-admin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Immobilier</h2>
          <p className="text-sm text-muted-foreground">{total} bien{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditingProperty(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white font-medium hover:bg-[#2D6A4F] transition-colors"
          data-testid="add-property-btn">
          <Plus className="w-4 h-4" /> Ajouter un bien
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterType("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filterType ? "bg-[#1B4332] text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
          Tous
        </button>
        {LISTING_TYPES.map(lt => (
          <button key={lt.id} onClick={() => setFilterType(lt.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === lt.id ? "bg-[#1B4332] text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
            {lt.label}
          </button>
        ))}
      </div>

      {/* Properties Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-2xl">
          <Home className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">Aucun bien immobilier</h3>
          <p className="text-sm text-muted-foreground mb-4">Ajoutez votre premier bien pour commencer</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm">
            Ajouter un bien
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(prop => (
            <div key={prop.property_id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/5 dark:border-white/5"
              data-testid={`admin-property-${prop.property_id}`}>
              {/* Image */}
              <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {prop.images?.[0] ? (
                  <img src={prop.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-400" /></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{prop.title}</h3>
                  {prop.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{prop.location_city}</span>
                  <span className={`px-2 py-0.5 rounded-full ${prop.listing_type === "sale" ? "bg-red-100 text-red-700" : prop.listing_type === "rent_short" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    {LISTING_TYPES.find(l => l.id === prop.listing_type)?.label}
                  </span>
                  <span>{prop.price?.toLocaleString("fr-FR")} FCFA</span>
                  <span className={prop.is_available ? "text-green-600" : "text-red-500"}>
                    {prop.is_available ? "Disponible" : "Indisponible"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleFeatured(prop.property_id)} title="Mettre en avant"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Star className={`w-4 h-4 ${prop.featured ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                </button>
                <button onClick={() => toggleAvailability(prop.property_id)} title="Disponibilité"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Eye className={`w-4 h-4 ${prop.is_available ? "text-green-500" : "text-gray-400"}`} />
                </button>
                <button onClick={() => { setEditingProperty(prop); setShowForm(true); }} title="Modifier"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(prop.property_id)} title="Supprimer"
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      <AnimatePresence>
        {showForm && (
          <PropertyFormModal
            property={editingProperty}
            token={token}
            onClose={() => { setShowForm(false); setEditingProperty(null); }}
            onSaved={() => { setShowForm(false); setEditingProperty(null); fetchProperties(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function PropertyFormModal({ property, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "", description: "", property_type: "apartment", listing_type: "rent_long",
    price: "", price_period: "per_month", location_city: "Dakar", location_area: "",
    location_address: "", surface: "", rooms: "", bedrooms: "", bathrooms: "",
    floor_number: "", total_floors: "", year_built: "", video_url: "", google_maps_url: "",
    amenities: [], is_furnished: false, is_available: true, contact_phone: "", contact_whatsapp: "",
    contact_name: "", images: [], featured: false,
    ...(property || {}),
    price: property?.price?.toString() || "",
    surface: property?.surface?.toString() || "",
    rooms: property?.rooms?.toString() || "",
    bedrooms: property?.bedrooms?.toString() || "",
    bathrooms: property?.bathrooms?.toString() || "",
    floor_number: property?.floor_number?.toString() || "",
    total_floors: property?.total_floors?.toString() || "",
    year_built: property?.year_built?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Limit to 6 images total
    if (form.images.length + files.length > 6) {
      toast.error("Maximum 6 images par bien");
      return;
    }
    
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post(`${API_URL}/api/upload/image`, formData, {
          headers: { ...authHeader.headers, "Content-Type": "multipart/form-data" }
        });
        if (res.data.url) {
          setForm(prev => ({ ...prev, images: [...prev.images, res.data.url] }));
        }
      }
      toast.success("Images uploadées");
    } catch (e) { 
      console.error("Upload error:", e);
      toast.error(e.response?.data?.detail || "Erreur upload - format non supporté"); 
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error("Titre et prix requis"); return; }
    setSaving(true);

    const payload = {
      ...form,
      price: parseInt(form.price) || 0,
      surface: form.surface ? parseInt(form.surface) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      floor_number: form.floor_number ? parseInt(form.floor_number) : null,
      total_floors: form.total_floors ? parseInt(form.total_floors) : null,
      year_built: form.year_built ? parseInt(form.year_built) : null,
    };

    try {
      if (property?.property_id) {
        await axios.put(`${API_URL}/api/admin/properties/${property.property_id}`, payload, authHeader);
        toast.success("Bien mis à jour");
      } else {
        await axios.post(`${API_URL}/api/admin/properties`, payload, authHeader);
        toast.success("Bien ajouté");
      }
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-2xl mb-10" data-testid="property-form-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <h3 className="text-lg font-bold">{property ? "Modifier le bien" : "Ajouter un bien"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">Titre *</label>
            <input value={form.title} onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent" placeholder="Bel appartement F3 Plateau" required />
          </div>

          {/* Type & Listing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Type de bien</label>
              <select value={form.property_type} onChange={(e) => handleChange("property_type", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
                {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type d'annonce</label>
              <select value={form.listing_type} onChange={(e) => handleChange("listing_type", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
                {LISTING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Prix (FCFA) *</label>
              <input type="number" value={form.price} onChange={(e) => handleChange("price", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent" placeholder="150000" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Période</label>
              <select value={form.price_period} onChange={(e) => handleChange("price_period", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
                <option value="per_night">Par nuit</option>
                <option value="per_month">Par mois</option>
                <option value="per_year">Par an</option>
                <option value="total">Prix total</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Ville</label>
              <select value={form.location_city} onChange={(e) => handleChange("location_city", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quartier</label>
              <input value={form.location_area} onChange={(e) => handleChange("location_area", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent" placeholder="Plateau, Almadies, Ngor..." />
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Surface m²</label>
              <input type="number" value={form.surface} onChange={(e) => handleChange("surface", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Pièces</label>
              <input type="number" value={form.rooms} onChange={(e) => handleChange("rooms", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Chambres</label>
              <input type="number" value={form.bedrooms} onChange={(e) => handleChange("bedrooms", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">SDB</label>
              <input type="number" value={form.bathrooms} onChange={(e) => handleChange("bathrooms", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
          </div>

          {/* Additional Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Étage n°</label>
              <input type="number" value={form.floor_number} onChange={(e) => handleChange("floor_number", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="ex: 3" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Nb étages total</label>
              <input type="number" value={form.total_floors} onChange={(e) => handleChange("total_floors", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="ex: 5" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Année de construction</label>
              <input type="number" value={form.year_built} onChange={(e) => handleChange("year_built", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="ex: 2020" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium mb-1 block">Adresse complète</label>
            <input value={form.location_address} onChange={(e) => handleChange("location_address", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="ex: 12 Rue du Plateau, Dakar" />
          </div>

          {/* Video & Maps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Lien vidéo / visite virtuelle</label>
              <input value={form.video_url} onChange={(e) => handleChange("video_url", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Lien Google Maps</label>
              <input value={form.google_maps_url} onChange={(e) => handleChange("google_maps_url", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="https://maps.google.com/..." />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent min-h-[100px]" placeholder="Décrivez le bien..." />
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium mb-2 block">Photos</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-16 rounded-lg border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-[#2D6A4F] transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-sm font-medium mb-2 block">Équipements</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map(amenity => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    form.amenities.includes(amenity) ? "bg-[#1B4332] text-white" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
                  }`}>
                  {form.amenities.includes(amenity) && <Check className="w-3 h-3 inline mr-1" />}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_furnished} onChange={(e) => handleChange("is_furnished", e.target.checked)} className="rounded" />
              Meublé
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => handleChange("featured", e.target.checked)} className="rounded" />
              Mettre en avant
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_available !== false} onChange={(e) => handleChange("is_available", e.target.checked)} className="rounded" />
              Disponible
            </label>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Nom contact</label>
              <input value={form.contact_name} onChange={(e) => handleChange("contact_name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Téléphone</label>
              <input value={form.contact_phone} onChange={(e) => handleChange("contact_phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="+221..." />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">WhatsApp</label>
              <input value={form.contact_whatsapp} onChange={(e) => handleChange("contact_whatsapp", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm" placeholder="+221..." />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-black/5 dark:border-white/5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] disabled:opacity-50 flex items-center gap-2"
            data-testid="save-property-btn">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {property ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
