import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Car,
  ChevronRight,
  Upload,
  Loader2,
  CheckCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Fuel,
  Cog,
  Palette,
  FileText,
  Globe,
  Ship,
  MessageCircle,
  X,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Car brands for selection
const CAR_BRANDS = [
  "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Mercedes-Benz", "BMW", "Audi",
  "Volkswagen", "Ford", "Chevrolet", "Peugeot", "Renault", "Mazda", "Mitsubishi",
  "Suzuki", "Lexus", "Porsche", "Land Rover", "Jeep", "Volvo", "Subaru",
  "Tesla", "BYD", "Chery", "Geely", "Haval", "JAC", "Jetour", "Autre"
];

const FUEL_TYPES = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
const TRANSMISSION_TYPES = ["Automatique", "Manuelle", "Semi-automatique"];
const COLORS = ["Noir", "Blanc", "Gris", "Argent", "Bleu", "Rouge", "Vert", "Beige", "Marron", "Autre"];

export default function VehicleRequestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year_min: "",
    year_max: "",
    budget_min: "",
    budget_max: "",
    km_max: "",
    fuel: "",
    transmission: "",
    color: "",
    customs_status: "sous_douane", // sous_douane or dedouane
    desired_date: "",
    full_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "Dakar",
    comments: "",
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images autorisées");
      return;
    }
    
    setUploading(true);
    const newImages = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await axios.post(`${API_URL}/api/upload`, formData);
        newImages.push(response.data.url);
      } catch (error) {
        toast.error(`Erreur upload: ${file.name}`);
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
    setUploading(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.brand || !form.full_name || !form.phone) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/custom-requests/vehicle`, {
        ...form,
        reference_images: images,
      });
      
      setRequestNumber(response.data.request_number);
      setSuccess(true);
      toast.success("Demande envoyée avec succès !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l&apos;envoi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background" data-testid="vehicle-request-success">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b">
          <div className="container-lumina py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/category/automobile" className="text-muted-foreground hover:text-foreground">Automobile</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span>Demande envoyée</span>
            </nav>
          </div>
        </div>

        <div className="container-lumina py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Demande envoyée !</h1>
            
            <div className="bg-muted/50 rounded-2xl p-6 mb-6">
              <p className="text-muted-foreground mb-2">Votre numéro de demande</p>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="vehicle-request-number">{requestNumber}</p>
            </div>
            
            <p className="text-muted-foreground mb-8">
              Notre équipe va étudier votre demande et rechercher le véhicule idéal pour vous.
              Vous serez contacté sous 24-48h avec des propositions.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Notre service d&apos;importation
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li>• Recherche et achat du véhicule en Chine</li>
                <li>• Transport maritime jusqu&apos;au Sénégal</li>
                <li>• Dédouanement et immatriculation</li>
                <li>• Livraison à votre domicile</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/category/automobile"
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Voir nos véhicules
              </Link>
              <a
                href="https://wa.me/221783827575"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contacter par WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background" data-testid="vehicle-request-page">
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-lumina py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link to="/category/automobile" className="text-muted-foreground hover:text-foreground">Automobile</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span>Demande de véhicule</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container-lumina">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
                <Globe className="w-4 h-4" />
                Import Chine → Sénégal
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Vous recherchez un véhicule ?
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Décrivez le véhicule de vos rêves et nous le trouverons pour vous en Chine, 
              avec livraison complète jusqu&apos;au Sénégal.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Recherche personnalisée
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Ship className="w-4 h-4 text-blue-400" />
                Transport inclus
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <FileText className="w-4 h-4 text-amber-400" />
                Dédouanement possible
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="container-lumina py-12">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Column - Vehicle Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Véhicule recherché
                </h2>
                
                <div className="space-y-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Marque *</label>
                    <select
                      value={form.brand}
                      onChange={(e) => updateField("brand", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="vehicle-brand-select"
                    >
                      <option value="">Sélectionner une marque</option>
                      {CAR_BRANDS.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Modèle souhaité</label>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => updateField("model", e.target.value)}
                      placeholder="Ex: Corolla, Civic, X5..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                  
                  {/* Year Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Année min</label>
                      <input
                        type="number"
                        value={form.year_min}
                        onChange={(e) => updateField("year_min", e.target.value)}
                        placeholder="2018"
                        min="2000"
                        max="2027"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Année max</label>
                      <input
                        type="number"
                        value={form.year_max}
                        onChange={(e) => updateField("year_max", e.target.value)}
                        placeholder="2024"
                        min="2000"
                        max="2027"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Budget Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Budget min (FCFA)</label>
                      <input
                        type="number"
                        value={form.budget_min}
                        onChange={(e) => updateField("budget_min", e.target.value)}
                        placeholder="5 000 000"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Budget max (FCFA)</label>
                      <input
                        type="number"
                        value={form.budget_max}
                        onChange={(e) => updateField("budget_max", e.target.value)}
                        placeholder="15 000 000"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* KM Max */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Kilométrage maximum</label>
                    <input
                      type="text"
                      value={form.km_max}
                      onChange={(e) => updateField("km_max", e.target.value)}
                      placeholder="Ex: 50 000 km"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                  
                  {/* Fuel & Transmission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Carburant</label>
                      <select
                        value={form.fuel}
                        onChange={(e) => updateField("fuel", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      >
                        <option value="">Indifférent</option>
                        {FUEL_TYPES.map(fuel => (
                          <option key={fuel} value={fuel}>{fuel}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Transmission</label>
                      <select
                        value={form.transmission}
                        onChange={(e) => updateField("transmission", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      >
                        <option value="">Indifférent</option>
                        {TRANSMISSION_TYPES.map(trans => (
                          <option key={trans} value={trans}>{trans}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Couleur préférée</label>
                    <select
                      value={form.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="">Indifférent</option>
                      {COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Customs Status */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut douanier</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateField("customs_status", "sous_douane")}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.customs_status === "sous_douane"
                            ? "border-primary bg-primary/5"
                            : "border-black/10 dark:border-white/10 hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium">Sous douane</p>
                        <p className="text-xs text-muted-foreground">Prix hors taxes</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("customs_status", "dedouane")}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.customs_status === "dedouane"
                            ? "border-primary bg-primary/5"
                            : "border-black/10 dark:border-white/10 hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium">Dédouané</p>
                        <p className="text-xs text-muted-foreground">Prêt à immatriculer</p>
                      </button>
                    </div>
                  </div>
                  
                  {/* Desired Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Date souhaitée</label>
                    <input
                      type="date"
                      value={form.desired_date}
                      onChange={(e) => updateField("desired_date", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Reference Images */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Images de référence
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez des photos du modèle que vous recherchez (max 5 images)
                </p>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Ajouter</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Contact Info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Vos coordonnées
                </h2>
                
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => updateField("full_name", e.target.value)}
                      placeholder="Prénom et Nom"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="vehicle-fullname-input"
                    />
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+221 7X XXX XX XX"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="vehicle-phone-input"
                    />
                  </div>
                  
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp (si différent)</label>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => updateField("whatsapp", e.target.value)}
                      placeholder="+221 7X XXX XX XX"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                  
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Quartier, Rue..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                  
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Dakar"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                  
                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Commentaires supplémentaires</label>
                    <textarea
                      value={form.comments}
                      onChange={(e) => updateField("comments", e.target.value)}
                      placeholder="Options souhaitées, détails supplémentaires..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Trust Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-4">
                  Pourquoi nous faire confiance ?
                </h3>
                <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Plus de 500 véhicules importés avec succès</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Partenaires fiables en Chine et au Sénégal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Suivi de commande en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Paiement sécurisé via PayDunya</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Garantie et service après-vente</span>
                  </li>
                </ul>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="vehicle-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Car className="w-5 h-5" />
                    Envoyer ma demande
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-muted-foreground">
                En soumettant ce formulaire, vous acceptez d&apos;être contacté par notre équipe.
                Vos données sont protégées et ne seront pas partagées.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
