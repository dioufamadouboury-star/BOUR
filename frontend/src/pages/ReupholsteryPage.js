import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Armchair,
  ChevronRight,
  Upload,
  Loader2,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Camera,
  MessageCircle,
  X,
  Sparkles,
  RefreshCw,
  Palette,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FURNITURE_TYPES = [
  "Canapé",
  "Fauteuil",
  "Chaise",
  "Tête de lit",
  "Pouf",
  "Banquette",
  "Siège auto",
  "Siège moto",
  "Autre meuble",
];

const SERVICE_TYPES = [
  { id: "rehoussage", label: "Rehoussage complet", desc: "Changement total du tissu" },
  { id: "reparation", label: "Réparation", desc: "Coutures, déchirures, trous" },
  { id: "rembourrage", label: "Rembourrage", desc: "Remplacement de la mousse" },
  { id: "nettoyage", label: "Nettoyage profond", desc: "Nettoyage vapeur professionnel" },
];

const FABRIC_PREFERENCES = [
  "Tissu classique",
  "Velours",
  "Cuir véritable",
  "Simili cuir",
  "Lin",
  "Même tissu qu'avant",
  "Je souhaite des conseils",
];

export default function ReupholsteryPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    furniture_type: "",
    service_type: "rehoussage",
    piece_count: "1",
    fabric_preference: "",
    current_condition: "",
    pickup_needed: true,
    full_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "Dakar",
    urgency: "normal",
    comments: "",
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 8) {
      toast.error("Maximum 8 images autorisées");
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

    if (!form.furniture_type || !form.full_name || !form.phone || images.length === 0) {
      toast.error("Veuillez remplir les champs obligatoires et ajouter au moins une photo");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/custom-requests/reupholstery`, {
        ...form,
        photos: images,
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
      <main className="min-h-screen bg-background" data-testid="reupholstery-request-success">
        <div className="bg-muted/30 border-b">
          <div className="container-lumina py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/services" className="text-muted-foreground hover:text-foreground">Services</Link>
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
              <p className="text-2xl font-mono font-bold text-primary" data-testid="reupholstery-request-number">{requestNumber}</p>
            </div>

            <p className="text-muted-foreground mb-8">
              Notre tapissier va examiner vos photos et vous envoyer un devis détaillé
              sous 24-48h. Vous serez contacté par téléphone ou WhatsApp.
            </p>

            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-teal-900 dark:text-teal-200 mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Notre processus
              </h3>
              <ul className="text-sm text-teal-800 dark:text-teal-300 space-y-2">
                <li>1. Analyse de vos photos → Devis sous 24-48h</li>
                <li>2. Validation du devis → Prise de rendez-vous</li>
                <li>3. Enlèvement du meuble (si demandé)</li>
                <li>4. Travaux en atelier → 5 à 10 jours</li>
                <li>5. Livraison et installation</li>
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
    <main className="min-h-screen bg-background" data-testid="reupholstery-request-page">
      <div className="bg-muted/30 border-b">
        <div className="container-lumina py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Accueil</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link to="/services" className="text-muted-foreground hover:text-foreground">Services</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span>Rehoussage</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 text-white py-16">
        <div className="container-lumina">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4" />
                Redonnez vie à vos meubles
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Service Rehoussage & Réparation
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Votre canapé est fatigué ? Vos chaises ont besoin d&apos;un coup de neuf ?
              Envoyez-nous des photos et recevez un devis gratuit sous 24h !
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Camera className="w-4 h-4 text-teal-300" />
                Devis sur photo
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Palette className="w-4 h-4 text-emerald-300" />
                Large choix de tissus
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Enlèvement à domicile
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="container-lumina py-12">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Left Column - Photos & Furniture */}
            <div className="space-y-6">
              {/* Photos - Priority Section */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border-2 border-primary/20">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Photos du meuble *
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Prenez des photos claires de votre meuble sous différents angles.
                  <br />
                  <span className="text-primary font-medium">Minimum 1 photo, maximum 8</span>
                </p>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img.startsWith('/') ? `${API_URL}${img}` : img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < 8 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-primary mb-1" />
                          <span className="text-xs text-primary font-medium">Ajouter</span>
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

                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Conseils pour de bonnes photos :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Prenez les photos en pleine lumière</li>
                    <li>Montrez l&apos;état actuel du tissu (usures, tâches, déchirures)</li>
                    <li>Photographiez les zones abîmées en gros plan</li>
                  </ul>
                </div>
              </div>

              {/* Furniture Type */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-primary" />
                  Type de meuble
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de meuble *</label>
                    <select
                      value={form.furniture_type}
                      onChange={(e) => updateField("furniture_type", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="reupholstery-furniture-select"
                    >
                      <option value="">Sélectionner un type</option>
                      {FURNITURE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre de pièces</label>
                    <input
                      type="number"
                      value={form.piece_count}
                      onChange={(e) => updateField("piece_count", e.target.value)}
                      min="1"
                      max="20"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Ex: 6 chaises = 6 pièces</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">État actuel</label>
                    <textarea
                      value={form.current_condition}
                      onChange={(e) => updateField("current_condition", e.target.value)}
                      placeholder="Décrivez l'état actuel : usure, tâches, déchirures..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Service Type */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4">Service souhaité</h2>

                <div className="space-y-3">
                  {SERVICE_TYPES.map(service => (
                    <label
                      key={service.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.service_type === service.id
                          ? "border-primary bg-primary/5"
                          : "border-black/10 dark:border-white/10 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service_type"
                        value={service.id}
                        checked={form.service_type === service.id}
                        onChange={(e) => updateField("service_type", e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{service.label}</p>
                        <p className="text-sm text-muted-foreground">{service.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fabric Preference */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Préférence tissu
                </h2>

                <select
                  value={form.fabric_preference}
                  onChange={(e) => updateField("fabric_preference", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                >
                  <option value="">Sélectionner une préférence</option>
                  {FABRIC_PREFERENCES.map(fabric => (
                    <option key={fabric} value={fabric}>{fabric}</option>
                  ))}
                </select>
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
                      data-testid="reupholstery-fullname-input"
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
                      data-testid="reupholstery-phone-input"
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
                    <label className="block text-sm font-medium mb-2">Adresse *</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Quartier, Rue..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                      required
                      data-testid="reupholstery-address-input"
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
                </div>
              </div>

              {/* Options */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-black/5 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold mb-4">Options</h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.pickup_needed}
                      onChange={(e) => updateField("pickup_needed", e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <div>
                      <span className="font-medium">Enlèvement à domicile</span>
                      <p className="text-sm text-muted-foreground">Nous venons chercher le meuble</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium mb-2">Urgence</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => updateField("urgency", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="normal">Normal (5-10 jours)</option>
                      <option value="urgent">Urgent (3-5 jours, +30%)</option>
                      <option value="express">Express (48h, +50%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Commentaires</label>
                    <textarea
                      value={form.comments}
                      onChange={(e) => updateField("comments", e.target.value)}
                      placeholder="Informations supplémentaires..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-teal-100 dark:border-teal-800">
                <h3 className="font-semibold text-teal-900 dark:text-teal-200 mb-4">
                  Notre engagement
                </h3>
                <ul className="space-y-3 text-sm text-teal-800 dark:text-teal-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Devis gratuit sous 24-48h</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Tapissiers expérimentés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Large choix de tissus et couleurs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Garantie 1 an sur les travaux</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Enlèvement et livraison inclus</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || images.length === 0}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-500 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="reupholstery-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Demander un devis gratuit
                  </>
                )}
              </button>

              {images.length === 0 && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  Ajoutez au moins une photo pour soumettre votre demande
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Devis gratuit et sans engagement. Vous serez contacté sous 24-48h.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
