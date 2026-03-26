import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Clock, User, Phone, Mail, Check, X, Loader2, Filter, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ReservationsAdmin({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ confirmed_date: "", confirmed_time: "", admin_notes: "", send_sms: false, send_email: true });

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/admin/reservations`;
      const params = [];
      if (filter !== "all") params.push(`status=${filter}`);
      if (typeFilter !== "all") params.push(`type=${typeFilter}`);
      if (params.length) url += `?${params.join("&")}`;
      
      const res = await axios.get(url, authHeader);
      setReservations(res.data.reservations || []);
    } catch (e) {
      toast.error("Erreur chargement réservations");
    }
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, [filter, typeFilter]);

  const handleConfirm = async () => {
    try {
      await axios.put(`${API_URL}/api/admin/reservations/${showConfirmModal}/confirm`, confirmForm, authHeader);
      toast.success("Réservation confirmée");
      setShowConfirmModal(null);
      fetchReservations();
    } catch (e) { toast.error("Erreur"); }
  };

  const handleReject = async (id, reason) => {
    try {
      await axios.put(`${API_URL}/api/admin/reservations/${id}/reject`, { reason }, authHeader);
      toast.success("Réservation refusée");
      fetchReservations();
    } catch (e) { toast.error("Erreur"); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800"
    };
    const labels = { pending: "En attente", confirmed: "Confirmée", rejected: "Refusée", completed: "Terminée" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
  };

  const getTypeBadge = (type) => {
    const styles = { transport: "bg-blue-100 text-blue-800", service: "bg-purple-100 text-purple-800", immobilier: "bg-amber-100 text-amber-800" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || "bg-gray-100"}`}>{type}</span>;
  };

  return (
    <div className="space-y-6" data-testid="reservations-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">Gérez les réservations transport et services</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? "bg-[#1B4332] text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
            {s === "all" ? "Toutes" : s === "pending" ? "En attente" : s === "confirmed" ? "Confirmées" : "Refusées"}
          </button>
        ))}
        <div className="border-l border-gray-300 mx-2" />
        {["all", "transport", "service", "immobilier"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
            {t === "all" ? "Tous types" : t}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-semibold">Aucune réservation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(res => (
            <div key={res.reservation_id} className="p-4 bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/5 dark:border-white/5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{res.reservation_id}</span>
                    {getStatusBadge(res.status)}
                    {getTypeBadge(res.type)}
                  </div>
                  <h3 className="font-semibold">{res.item_name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" />{res.client_name}</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{res.client_phone}</span>
                    {res.client_email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{res.client_email}</span>}
                    {res.date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{res.date}</span>}
                    {res.time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{res.time}</span>}
                  </div>
                  {res.notes && <p className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">{res.notes}</p>}
                </div>
                {res.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => { setShowConfirmModal(res.reservation_id); setConfirmForm({ confirmed_date: res.date || "", confirmed_time: res.time || "", admin_notes: "", send_sms: false, send_email: true }); }}
                      className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleReject(res.reservation_id, "")} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirmModal(null)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Confirmer la réservation</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Date confirmée</label>
                <input type="date" value={confirmForm.confirmed_date} onChange={e => setConfirmForm(p => ({...p, confirmed_date: e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Heure confirmée</label>
                <input type="time" value={confirmForm.confirmed_time} onChange={e => setConfirmForm(p => ({...p, confirmed_time: e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes admin</label>
                <textarea value={confirmForm.admin_notes} onChange={e => setConfirmForm(p => ({...p, admin_notes: e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10" rows={2} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={confirmForm.send_email} onChange={e => setConfirmForm(p => ({...p, send_email: e.target.checked}))} />
                  Email de confirmation
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={confirmForm.send_sms} onChange={e => setConfirmForm(p => ({...p, send_sms: e.target.checked}))} />
                  SMS de confirmation
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirmModal(null)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-green-600 text-white">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
