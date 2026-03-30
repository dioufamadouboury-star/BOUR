import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Send,
  X,
  Check,
  RefreshCw,
  Download,
  Link2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ResellersAdmin({ token }) {
  const [resellers, setResellers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("wave");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    commission_rate: 10,
    password: ""
  });

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/resellers`, authHeader);
      setResellers(res.data.resellers || []);
      setStats(res.data.stats || {});
    } catch (e) {
      toast.error("Erreur chargement revendeurs");
    }
    setLoading(false);
  };

  useEffect(() => { fetchResellers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Tous les champs sont requis");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/admin/resellers`, form, authHeader);
      toast.success(`Revendeur créé ! Mot de passe: ${res.data.reseller.temp_password}`);
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", commission_rate: 10, password: "" });
      fetchResellers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur création");
    }
  };

  const handleToggleActive = async (reseller) => {
    try {
      await axios.put(`${API_URL}/api/admin/resellers/${reseller.reseller_id}`, {
        is_active: !reseller.is_active
      }, authHeader);
      toast.success(reseller.is_active ? "Revendeur désactivé" : "Revendeur activé");
      fetchResellers();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const handlePayCommission = async () => {
    if (!showPayment || paymentAmount <= 0) return;
    try {
      await axios.post(`${API_URL}/api/admin/resellers/${showPayment.reseller_id}/pay-commission`, {
        amount: paymentAmount,
        payment_method: paymentMethod
      }, authHeader);
      toast.success(`${paymentAmount} FCFA versé`);
      setShowPayment(null);
      setPaymentAmount(0);
      fetchResellers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur paiement");
    }
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast.success("Lien copié !");
  };

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price || 0) + ' FCFA';

  return (
    <div className="space-y-6" data-testid="resellers-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programme Revendeurs</h1>
          <p className="text-muted-foreground">Gérez vos revendeurs et leurs commissions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouveau Revendeur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
          <p className="text-sm text-muted-foreground">{stats.active || 0} actifs</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatPrice(stats.total_sales)}</p>
          <p className="text-sm text-muted-foreground">Ventes totales</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatPrice(stats.total_commission)}</p>
          <p className="text-sm text-muted-foreground">Commissions totales</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatPrice(resellers.reduce((sum, r) => sum + (r.pending_commission || 0), 0))}</p>
          <p className="text-sm text-muted-foreground">À verser</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin" /></div>
      ) : resellers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold">Aucun revendeur</p>
          <p className="text-muted-foreground">Créez votre premier revendeur pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resellers.map(reseller => (
            <div key={reseller.reseller_id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-black/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {reseller.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{reseller.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${reseller.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {reseller.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{reseller.email} • {reseller.phone}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-blue-600 font-medium">{reseller.commission_rate}% commission</span>
                      <span className="text-muted-foreground">Code: {reseller.reseller_code}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatPrice(reseller.total_sales)}</p>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">{formatPrice(reseller.pending_commission)}</p>
                    <p className="text-xs text-muted-foreground">À verser</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => copyLink(reseller.reseller_code)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Copier le lien">
                      <Link2 className="w-4 h-4" />
                    </button>
                    {reseller.pending_commission > 0 && (
                      <button onClick={() => { setShowPayment(reseller); setPaymentAmount(reseller.pending_commission); }}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600" title="Verser commission">
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleToggleActive(reseller)}
                      className={`p-2 rounded-lg ${reseller.is_active ? "hover:bg-red-100 text-red-600" : "hover:bg-green-100 text-green-600"}`}
                      title={reseller.is_active ? "Désactiver" : "Activer"}>
                      {reseller.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nouveau Revendeur</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Nom complet *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border" placeholder="jean@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Téléphone *</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border" placeholder="+221 77 123 45 67" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Taux de commission (%)</label>
                <input type="number" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 rounded-lg border" min="1" max="50" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Mot de passe (optionnel)</label>
                <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border" placeholder="Généré auto si vide" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPayment(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Verser commission</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
              <p className="font-medium">{showPayment.name}</p>
              <p className="text-sm text-muted-foreground">Solde disponible: {formatPrice(showPayment.pending_commission)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Montant à verser</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border text-lg font-bold" max={showPayment.pending_commission} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Méthode de paiement</label>
                <div className="flex gap-2">
                  {["wave", "orange_money", "free_money", "cash", "bank"].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${paymentMethod === m ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                      {m === "wave" ? "Wave" : m === "orange_money" ? "OM" : m === "free_money" ? "Free" : m === "cash" ? "Espèces" : "Banque"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPayment(null)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handlePayCommission} className="px-4 py-2 bg-green-600 text-white rounded-lg">Verser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
