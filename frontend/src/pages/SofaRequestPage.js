import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Sofa,
  ChevronRight,
  Upload,
  Loader2,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Ruler,
  Palette,
  Layers,
  MessageCircle,
  X,
  Sparkles,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SOFA_TYPES = [
  "Canapé 3 places",
  "Canapé 2 places",
  "Canapé d'angle",
  "Canapé convertible",
  "Fauteuil",
  "Pouf",
  "Méridienne",
  "Canapé sur mesure",
];

const FABRIC_TYPES = [
  "Tissu classique",
  "Velours",
  "Cuir véritable",
  "Simili cuir",
  "Lin",
  "Coton",
  "Microfibre",
  "Daim",
];

const COLORS = [
  "Noir", "Blanc", "Gris", "Beige", "Marron", "Bleu marine", "Vert émeraude",
  "Bordeaux", "Orange", "Jaune", "Rose", "Violet", "Autre"
];

const CUSHION_TYPES = [
  "Mousse haute densité",
  "Mousse mémoire de forme",
  "Plumes",
  "Mixte mousse/plumes",
];

export default function SofaRequestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    sofa_type: "",
    width: "",
    depth: "",
    height: "",
    seat_height: "",
    fabric: "",
    color: "",
    cushion_type: "",
    quantity: "1",
    with_armrests: true,
    with_headrests: false,
    with_storage: false,
    full_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "Dakar",
    budget_range: "",
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
        const response = await axios.post(`${API_URL}/api/upload/public`, formData);
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

    if (!form.sofa_type || !form.full_name || !form.phone) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/custom-requests/sofa`, {
        ...form,
        reference_images: images,
      });

      setRequestNumber(response.data.request_number);
      setSuccess(true);
      toast.success("Demande envoyée avec succès !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background" data-testid="sofa-request-success">
        <div className="bg-muted/30 border-b">
          <div className="container-lumina py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/category/mobilier" className="text-muted-foreground hover:text-foreground">Mobilier</Link>
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
              <p className="text-2xl font-mono font-bold text-primary" data-testid="sofa-request-number">{requestNumber}</p>
            </div>

            <p className="text-muted-foreground mb-8">
              Notre équipe artisanale va étudier votre demande et vous proposer un devis personnalisé
              sous 48-72h. Vous serez contacté par téléphone ou WhatsApp.
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Notre engagement qualité
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                <li>• Fabrication artisanale locale</li>
                <li>• Matériaux de haute qualité</li>
                <li>• Finitions soignées sur mesure</li>
                <li>• Garantie 2 ans sur la structure</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/category/mobilier"
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Voir nos meubles
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
    <main className="min-h-screen bg-background" data-testid="sofa-request-page">
      <div className="bg-muted/30 border-b">
        <div className="container-lumina py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link to="/category/mobilier" className="text-muted-foreground hover:text-foreground">Mobilier</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span>Salon sur commande</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white py-16">
        <div className="container-lumina">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Sofa className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4" />
                Fabrication artisanale
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Salon sur commande
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Créez le canapé de vos rêves ! Choisissez les dimensions, le tissu,
              la couleur et recevez un devis personnalisé sous 48h.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Ruler className="w-4 h-4 text-amber-300" />
                Dimensions sur mesure
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Palette className="w-4 h-4 text-orange-300" />
                Choix du tissu
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Garantie 2 ans
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="container-lumina py-12">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Left Column - Sofa Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sofa className="w-5 h-5 text-primary" />
                  Type de salon
                </h2>

                <div className="space-y-4">
                  {/* Sofa Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de meuble *</label>
                    <select
                      value={form.sofa_type}
                      onChange={(e) => updateField("sofa_type", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="sofa-type-select"
                    >
                      <option value="">Sélectionner un type</option>
                      {SOFA_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantité</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => updateField("quantity", e.target.value)}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Dimensions (en cm)
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Largeur</label>
                      <input
                        type="number"
                        value={form.width}
                        onChange={(e) => updateField("width", e.target.value)}
                        placeholder="Ex: 200"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Profondeur</label>
                      <input
                        type="number"
                        value={form.depth}
                        onChange={(e) => updateField("depth", e.target.value)}
                        placeholder="Ex: 90"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Hauteur totale</label>
                      <input
                        type="number"
                        value={form.height}
                        onChange={(e) => updateField("height", e.target.value)}
                        placeholder="Ex: 85"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Hauteur assise</label>
                      <input
                        type="number"
                        value={form.seat_height}
                        onChange={(e) => updateField("seat_height", e.target.value)}
                        placeholder="Ex: 45"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Matériaux et finitions
                </h2>

                <div className="space-y-4">
                  {/* Fabric */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de tissu</label>
                    <select
                      value={form.fabric}
                      onChange={(e) => updateField("fabric", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="">Sélectionner un tissu</option>
                      {FABRIC_TYPES.map(fabric => (
                        <option key={fabric} value={fabric}>{fabric}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Couleur souhaitée</label>
                    <select
                      value={form.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="">Sélectionner une couleur</option>
                      {COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cushion Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Rembourrage</label>
                    <select
                      value={form.cushion_type}
                      onChange={(e) => updateField("cushion_type", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="">Sélectionner un rembourrage</option>
                      {CUSHION_TYPES.map(cushion => (
                        <option key={cushion} value={cushion}>{cushion}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Options</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.with_armrests}
                          onChange={(e) => updateField("with_armrests", e.target.checked)}
                          className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                        />
                        <span>Accoudoirs</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.with_headrests}
                          onChange={(e) => updateField("with_headrests", e.target.checked)}
                          className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                        />
                        <span>Têtières ajustables</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.with_storage}
                          onChange={(e) => updateField("with_storage", e.target.checked)}
                          className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                        />
                        <span>Rangement intégré</span>
                      </label>
                    </div>
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
                  Ajoutez des photos du modèle souhaité (max 5 images)
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img.startsWith('/') ? `${API_URL}${img}` : img} alt="" className="w-full h-full object-cover" />
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => updateField("full_name", e.target.value)}
                      placeholder="Prénom et Nom"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="sofa-fullname-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+221 7X XXX XX XX"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="sofa-phone-input"
                    />
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium mb-2">Budget estimé (FCFA)</label>
                    <select
                      value={form.budget_range}
                      onChange={(e) => updateField("budget_range", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="">Sélectionner une fourchette</option>
                      <option value="100000-200000">100 000 - 200 000 FCFA</option>
                      <option value="200000-400000">200 000 - 400 000 FCFA</option>
                      <option value="400000-600000">400 000 - 600 000 FCFA</option>
                      <option value="600000-1000000">600 000 - 1 000 000 FCFA</option>
                      <option value="1000000+">Plus de 1 000 000 FCFA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Commentaires</label>
                    <textarea
                      value={form.comments}
                      onChange={(e) => updateField("comments", e.target.value)}
                      placeholder="Détails supplémentaires, inspirations..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-4">
                  Pourquoi commander chez nous ?
                </h3>
                <ul className="space-y-3 text-sm text-amber-800 dark:text-amber-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Artisans locaux qualifiés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Matériaux premium sélectionnés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Livraison et installation incluses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Garantie 2 ans structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Devis gratuit et sans engagement</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="sofa-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Sofa className="w-5 h-5" />
                    Demander un devis
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Devis gratuit et sans engagement. Vous serez contacté sous 48-72h.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
