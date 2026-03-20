import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Calendar, Clock, User, Phone, Mail, MessageSquare, X, CheckCircle, MapPin, Home, Car } from "lucide-react";
import { getImageUrl } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AppointmentModal({ isOpen, onClose, product = null, property = null, category = null, appointmentType = "general" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
    message: "",
    contact_method: "whatsapp"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/appointments`, {
        ...formData,
        product_id: product?.product_id,
        product_name: product?.name,
        property_id: property?.property_id,
        property_title: property?.title,
        category: category || product?.category,
        appointment_type: appointmentType
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccess(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      preferred_date: "",
      preferred_time: "",
      message: "",
      contact_method: "whatsapp"
    });
    onClose();
  };

  const timeSlots = [];
  for (let h = 9; h <= 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 18) timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const isImmobilier = appointmentType === "immobilier";
  const isAutomobile = appointmentType === "automobile";
  const headerColor = isImmobilier ? "from-[#1B4332] to-[#2D6A4F]" : isAutomobile ? "from-gray-900 to-gray-700" : "from-blue-600 to-indigo-600";
  const headerTitle = isImmobilier ? "Demander une visite" : isAutomobile ? "Prendre rendez-vous" : "Prendre Rendez-vous";
  const headerDesc = isImmobilier
    ? "Planifiez une visite pour découvrir ce bien"
    : isAutomobile
    ? "Planifiez un rendez-vous pour voir ce véhicule"
    : "Planifiez une visite pour voir nos produits en personne";
  const HeaderIcon = isImmobilier ? Home : isAutomobile ? Car : Calendar;

  // Display item (product or property)
  const displayItem = property || product;
  const displayName = property?.title || product?.name;
  const displayPrice = property?.price || product?.price;
  const displayImage = property?.images?.[0] || (product?.images?.[0] ? getImageUrl(product.images[0]) : null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          data-testid="appointment-modal"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${headerColor} p-6 text-white`}>
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              data-testid="close-appointment-modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <HeaderIcon className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{headerTitle}</h2>
            </div>
            <p className="text-white/80">{headerDesc}</p>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Demande envoyée !</h3>
              <p className="text-muted-foreground mb-6">
                Nous vous contacterons très bientôt pour confirmer votre {isImmobilier ? "visite" : "rendez-vous"}.
              </p>
              <button
                onClick={resetAndClose}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium"
                data-testid="close-success"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4" data-testid="appointment-form">
              {displayItem && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center gap-4">
                  {displayImage && (
                    <img
                      src={displayImage}
                      alt={displayName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{displayName}</p>
                    {displayPrice && (
                      <p className="text-sm text-muted-foreground">{displayPrice?.toLocaleString("fr-FR")} FCFA</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom complet *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Votre nom"
                      data-testid="appointment-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="77 123 45 67"
                      data-testid="appointment-phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemple.com"
                      data-testid="appointment-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date souhaitée *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="date"
                      name="preferred_date"
                      value={formData.preferred_date}
                      onChange={handleChange}
                      required
                      min={minDate}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="appointment-date"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Heure souhaitée *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      name="preferred_time"
                      value={formData.preferred_time}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="appointment-time"
                    >
                      <option value="">Choisir</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Mode de contact préféré</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contact_method"
                        value="whatsapp"
                        checked={formData.contact_method === "whatsapp"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contact_method"
                        value="email"
                        checked={formData.contact_method === "email"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Message (optionnel)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={isImmobilier ? "Précisions sur la visite souhaitée..." : "Des précisions sur votre visite..."}
                      data-testid="appointment-message"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  L'adresse exacte vous sera communiquée lors de la confirmation
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-gradient-to-r ${headerColor} text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50`}
                data-testid="submit-appointment"
              >
                {loading ? "Envoi en cours..." : isImmobilier ? "Demander une visite" : "Demander un rendez-vous"}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
