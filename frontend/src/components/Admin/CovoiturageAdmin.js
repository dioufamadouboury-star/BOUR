import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Plus, Edit, Trash2, Car, MapPin, Clock, Users, X, Upload, Loader2, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROUTES_PREDEFINIS = [
  { from: "Dakar", to: "AIBD (Aéroport)", label: "Dakar → AIBD" },
  { from: "AIBD (Aéroport)", to: "Dakar", label: "AIBD → Dakar" },
  { from: "Dakar", to: "Thiès", label: "Dakar → Thiès" },
  { from: "Thiès", to: "Dakar", label: "Thiès → Dakar" },
  { from: "Dakar", to: "Mbour", label: "Dakar → Mbour" },
  { from: "Mbour", to: "Dakar", label: "Mbour → Dakar" },
  { from: "Dakar", to: "Saly", label: "Dakar → Saly" },
  { from: "Dakar", to: "Saint-Louis", label: "Dakar → Saint-Louis" },
  { from: "Dakar", to: "Ziguinchor", label: "Dakar → Ziguinchor" },
  { from: "Dakar", to: "Kaolack", label: "Dakar → Kaolack" },
  { from: "Dakar", to: "Touba", label: "Dakar → Touba" },
  { from: "Dakar", to: "Tambacounda", label: "Dakar → Tambacounda" },
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CovoiturageAdmin({ token }) {
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/trips`, authHeader);
      setTrips(res.data.trips || []);
      setTotal(res.data.total || 0);
    } catch (e) { toast.error("Erreur chargement"); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce trajet ?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/trips/${id}`, authHeader);
      toast.success("Trajet supprimé");
      fetchTrips();
    } catch (e) { toast.error("Erreur suppression"); }
  };

  return (
    <div className="space-y-6" data-testid="covoiturage-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Covoiturage</h1>
          <p className="text-muted-foreground text-sm">{total} trajet{total !== 1 ? "s" : ""} configuré{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          data-testid="add-trip-btn"
        >
          <Plus className="w-4 h-4" /> Ajouter un trajet
        </button>
      </div>

      {/* Quick routes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Routes rapides — Cliquez pour pré-remplir</p>
        <div className="flex flex-wrap gap-2">
          {ROUTES_PREDEFINIS.map(r => (
            <button
              key={r.label}
              onClick={() => { setEditing({ route_from: r.from, route_to: r.to, route_label: r.label }); setShowForm(true); }}
              className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Aucun trajet configuré</h3>
          <p className="text-sm text-muted-foreground">Ajoutez vos trajets Dakar ↔ régions</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {trips.map(trip => (
            <TripCard key={trip.trip_id} trip={trip} onEdit={() => { setEditing(trip); setShowForm(true); }} onDelete={() => handleDelete(trip.trip_id)} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TripFormModal
            trip={editing}
            token={token}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { setShowForm(false); setEditing(null); fetchTrips(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TripCard({ trip, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-lg transition-all">
      {trip.vehicle_image && (
        <div className="h-40 overflow-hidden">
          <img src={trip.vehicle_image} alt={trip.vehicle_model} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-base font-bold">
              <MapPin className="w-4 h-4 text-blue-500" />
              {trip.route_label || `${trip.route_from} → ${trip.route_to}`}
            </div>
            {trip.vehicle_model && (
              <p className="text-sm text-muted-foreground mt-1">
                <Car className="w-3.5 h-3.5 inline mr-1" />{trip.vehicle_model}
                {trip.vehicle_plate && ` • ${trip.vehicle_plate}`}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${trip.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {trip.is_available ? "Disponible" : "Indisponible"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {trip.departure_time && (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.departure_time}</span>
          )}
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{trip.total_seats} places</span>
          <span className="font-semibold text-foreground">{trip.price_per_seat?.toLocaleString("fr-FR")} FCFA</span>
        </div>

        {trip.driver_name && (
          <p className="text-xs text-muted-foreground mb-3">Chauffeur : {trip.driver_name} {trip.driver_phone && `• ${trip.driver_phone}`}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TripFormModal({ trip, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    route_from: "Dakar", route_to: "", route_label: "",
    departure_time: "", return_time: "",
    price_per_seat: "", total_seats: "4",
    driver_name: "", driver_phone: "",
    vehicle_model: "", vehicle_plate: "", vehicle_image: "",
    is_available: true, is_recurring: false,
    days_of_week: [], notes: "",
    ...(trip || {}),
    price_per_seat: trip?.price_per_seat?.toString() || "",
    total_seats: trip?.total_seats?.toString() || "4",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      days_of_week: p.days_of_week.includes(day) ? p.days_of_week.filter(d => d !== day) : [...p.days_of_week, day]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API_URL}/api/upload`, fd, {
        headers: { ...authHeader.headers, "Content-Type": "multipart/form-data" }
      });
      if (res.data.url) handleChange("vehicle_image", res.data.url);
      toast.success("Image uploadée");
    } catch (e) { toast.error("Erreur upload"); }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.route_from || !form.route_to) { toast.error("Départ et destination requis"); return; }
    setSaving(true);
    const payload = {
      ...form,
      price_per_seat: parseInt(form.price_per_seat) || 0,
      total_seats: parseInt(form.total_seats) || 4,
      route_label: form.route_label || `${form.route_from} → ${form.route_to}`,
    };
    try {
      if (trip?.trip_id) {
        await axios.put(`${API_URL}/api/admin/trips/${trip.trip_id}`, payload, authHeader);
        toast.success("Trajet mis à jour");
      } else {
        await axios.post(`${API_URL}/api/admin/trips`, payload, authHeader);
        toast.success("Trajet créé");
      }
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:border-blue-500 outline-none";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-2xl mb-10">
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <h3 className="text-lg font-bold">{trip?.trip_id ? "Modifier le trajet" : "Nouveau trajet"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Départ *</label>
              <input value={form.route_from} onChange={e => handleChange("route_from", e.target.value)} className={inputCls} placeholder="ex: Dakar" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Destination *</label>
              <input value={form.route_to} onChange={e => handleChange("route_to", e.target.value)} className={inputCls} placeholder="ex: AIBD" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Nom du trajet (affiché)</label>
            <input value={form.route_label} onChange={e => handleChange("route_label", e.target.value)} className={inputCls} placeholder="ex: Dakar → Aéroport AIBD" />
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Heure départ</label>
              <input type="time" value={form.departure_time} onChange={e => handleChange("departure_time", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Heure retour (optionnel)</label>
              <input type="time" value={form.return_time} onChange={e => handleChange("return_time", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Prix & places */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Prix par place (FCFA) *</label>
              <input type="number" value={form.price_per_seat} onChange={e => handleChange("price_per_seat", e.target.value)} className={inputCls} placeholder="ex: 5000" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Nombre de places</label>
              <input type="number" value={form.total_seats} onChange={e => handleChange("total_seats", e.target.value)} className={inputCls} min="1" max="50" />
            </div>
          </div>

          {/* Véhicule */}
          <div className="border border-black/8 dark:border-white/8 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">Informations véhicule</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Modèle du véhicule</label>
                <input value={form.vehicle_model} onChange={e => handleChange("vehicle_model", e.target.value)} className={inputCls} placeholder="ex: Toyota Hiace, Mercedes..." />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Plaque d'immatriculation</label>
                <input value={form.vehicle_plate} onChange={e => handleChange("vehicle_plate", e.target.value)} className={inputCls} placeholder="ex: DK 1234 AB" />
              </div>
            </div>
            {/* Vehicle Image */}
            <div>
              <label className="text-xs font-medium mb-2 block">Photo du véhicule</label>
              {form.vehicle_image && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 group">
                  <img src={form.vehicle_image} alt="Véhicule" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleChange("vehicle_image", "")}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-black/10 dark:border-white/10 cursor-pointer hover:border-blue-500 transition-colors w-fit">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-xs">{uploading ? "Upload..." : "Choisir une photo"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Chauffeur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Nom du chauffeur</label>
              <input value={form.driver_name} onChange={e => handleChange("driver_name", e.target.value)} className={inputCls} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Téléphone chauffeur</label>
              <input value={form.driver_phone} onChange={e => handleChange("driver_phone", e.target.value)} className={inputCls} placeholder="+221 77..." />
            </div>
          </div>

          {/* Jours récurrents */}
          <div>
            <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => handleChange("is_recurring", e.target.checked)} className="rounded" />
              Trajet récurrent (jours fixes)
            </label>
            {form.is_recurring && (
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.days_of_week.includes(d) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"}`}>
                    {form.days_of_week.includes(d) && <Check className="w-3 h-3 inline mr-1" />}{d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={e => handleChange("is_available", e.target.checked)} className="rounded" />
              Disponible à la réservation
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium mb-1 block">Notes / informations complémentaires</label>
            <textarea value={form.notes} onChange={e => handleChange("notes", e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="Point de rendez-vous, bagages autorisés..." />
          </div>
        </form>

        <div className="flex justify-end gap-3 p-5 border-t border-black/5 dark:border-white/5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="save-trip-btn">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {trip?.trip_id ? "Mettre à jour" : "Créer le trajet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
