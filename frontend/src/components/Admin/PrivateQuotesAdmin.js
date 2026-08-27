import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Eye,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Phone,
  Calendar,
  Link,
  Copy,
  X,
  Loader2,
  RefreshCw,
  Ban,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  MessageCircle,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  { value: "viewed", label: "Consulté", color: "bg-blue-100 text-blue-800" },
  { value: "signed", label: "Signé", color: "bg-purple-100 text-purple-800" },
  { value: "deposit_paid", label: "Acompte payé", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Terminé", color: "bg-teal-100 text-teal-800" },
  { value: "expired", label: "Expiré", color: "bg-gray-100 text-gray-800" },
  { value: "cancelled", label: "Annulé", color: "bg-red-100 text-red-800" },
];

const QUOTE_TYPES = [
  { value: "vehicle", label: "Véhicule" },
  { value: "sofa", label: "Salon" },
  { value: "reupholstery", label: "Rehoussage" },
  { value: "custom", label: "Autre" },
];

export default function PrivateQuotesAdmin() {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [filter, setFilter] = useState({ status: "", type: "" });

  useEffect(() => {
    fetchQuotes();
    fetchStats();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.type) params.append("quote_type", filter.type);
      
      const response = await axios.get(`${API_URL}/api/private-quotes/admin/list?${params}`);
      setQuotes(response.data.quotes);
    } catch (error) {
      toast.error("Erreur lors du chargement des devis");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/private-quotes/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const copyLink = (quote) => {
    const link = `https://groupeyamaplus.com/devis/${quote.quote_number}?token=${quote.access_token}`;
    navigator.clipboard.writeText(link);
    toast.success("Lien copié !");
  };

  const sendWhatsApp = (quote) => {
    const phone = quote.client.phone.replace(/[^0-9]/g, "");
    const link = `https://groupeyamaplus.com/devis/${quote.quote_number}`;
    const message = `Bonjour ${quote.client.name},\n\nVotre devis "${quote.title}" est prêt !\n\nMontant total: ${formatPrice(quote.subtotal)}\nAcompte demandé (${quote.deposit_percentage}%): ${formatPrice(quote.deposit_amount)}\n\nConsultez et signez votre devis ici:\n${link}\n\nCe devis est valable jusqu'au ${formatDate(quote.expires_at)}.\n\nYAMA+ - Votre partenaire de croissance`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const cancelQuote = async (quoteNumber) => {
    if (!window.confirm("Voulez-vous vraiment annuler ce devis ?")) return;
    
    try {
      await axios.put(`${API_URL}/api/private-quotes/admin/${quoteNumber}/cancel`);
      toast.success("Devis annulé");
      fetchQuotes();
      fetchStats();
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const resendQuote = async (quoteNumber) => {
    try {
      const response = await axios.post(`${API_URL}/api/private-quotes/admin/${quoteNumber}/resend`);
      toast.success("Nouveau lien généré !");
      navigator.clipboard.writeText(response.data.secure_link);
      fetchQuotes();
    } catch (error) {
      toast.error("Erreur lors du renvoi");
    }
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6" data-testid="private-quotes-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Devis Privés</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchQuotes(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Nouveau devis
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#141414] rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Total devis</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-[#141414] rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">En attente de signature</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending + stats.viewed}</p>
          </div>
          <div className="bg-white dark:bg-[#141414] rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Acomptes reçus</p>
            <p className="text-2xl font-bold text-green-600">{stats.deposit_paid}</p>
          </div>
          <div className="bg-white dark:bg-[#141414] rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Montant acomptes</p>
            <p className="text-xl font-bold text-primary">{formatPrice(stats.deposits_collected)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center bg-muted/30 rounded-xl p-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filter.type}
          onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">Tous les types</option>
          {QUOTE_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Quotes List */}
      <div className="bg-white dark:bg-[#141414] rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Aucun devis trouvé</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary hover:underline"
            >
              Créer un nouveau devis
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {quotes.map((quote) => (
              <div key={quote.quote_number} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{quote.quote_number}</span>
                      {getStatusBadge(quote.status)}
                    </div>
                    
                    <p className="font-medium truncate">{quote.title}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {quote.client.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {quote.client.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expire le {formatDate(quote.expires_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(quote.subtotal)}</p>
                    <p className="text-sm text-green-600">
                      Acompte: {formatPrice(quote.deposit_amount)}
                    </p>
                    
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => sendWhatsApp(quote)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Envoyer par WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyLink(quote)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Copier le lien"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => resendQuote(quote.quote_number)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Renouveler le lien"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {quote.status !== "cancelled" && quote.status !== "deposit_paid" && (
                        <button
                          onClick={() => cancelQuote(quote.quote_number)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Annuler"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateQuoteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchQuotes();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}

function CreateQuoteModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    quote_type: "vehicle",
    title: "",
    deposit_percentage: 30,
    valid_days: 7,
    notes: "",
    terms: "Acompte non remboursable. Solde à payer à la livraison.",
    items: [{ description: "", quantity: 1, unit_price: "" }],
  });

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: "" }]
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => {
      return sum + (item.quantity * (parseInt(item.unit_price) || 0));
    }, 0);
  };

  const calculateDeposit = () => {
    return Math.round(calculateTotal() * form.deposit_percentage / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.client_name || !form.client_phone || !form.title) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (form.items.some(item => !item.description || !item.unit_price)) {
      toast.error("Veuillez remplir tous les articles");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/private-quotes/create`, {
        ...form,
        items: form.items.map(item => ({
          ...item,
          unit_price: parseInt(item.unit_price)
        }))
      });
      
      setResult(response.data);
      toast.success("Devis créé avec succès !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.secure_link);
    toast.success("Lien copié !");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-bold mb-2">Devis créé !</h3>
            <p className="text-muted-foreground mb-4">{result.quote_number}</p>
            
            <div className="bg-muted/50 rounded-xl p-4 mb-4 text-left text-sm">
              <p><span className="text-muted-foreground">Total:</span> {formatPrice(result.subtotal)}</p>
              <p><span className="text-muted-foreground">Acompte:</span> {formatPrice(result.deposit_amount)}</p>
              <p><span className="text-muted-foreground">Expire le:</span> {new Date(result.expires_at).toLocaleDateString("fr-FR")}</p>
            </div>
            
            <div className="bg-primary/10 rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-2">Lien sécurisé du devis</p>
              <p className="text-xs font-mono break-all">{result.secure_link}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
              >
                <Copy className="w-4 h-4" />
                Copier le lien
              </button>
              <button
                onClick={onSuccess}
                className="px-4 py-3 border rounded-xl hover:bg-muted"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold">Nouveau devis privé</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom du client *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone *</label>
              <input
                type="tel"
                value={form.client_phone}
                onChange={(e) => setForm(prev => ({ ...prev, client_phone: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm(prev => ({ ...prev, client_email: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type de devis</label>
              <select
                value={form.quote_type}
                onChange={(e) => setForm(prev => ({ ...prev, quote_type: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
              >
                {QUOTE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titre du devis *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border bg-transparent"
              placeholder="Ex: Toyota Land Cruiser 2022 - Import Chine"
              required
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Articles</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-primary hover:underline"
              >
                + Ajouter un article
              </button>
            </div>
            
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-2 rounded-lg border bg-transparent text-sm"
                    min="1"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                    placeholder="Prix FCFA"
                    className="w-32 px-3 py-2 rounded-lg border bg-transparent text-sm"
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deposit Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Acompte (%)</label>
              <select
                value={form.deposit_percentage}
                onChange={(e) => setForm(prev => ({ ...prev, deposit_percentage: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
              >
                <option value={20}>20%</option>
                <option value={30}>30%</option>
                <option value={40}>40%</option>
                <option value={50}>50%</option>
                <option value={100}>100% (Paiement complet)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Validité (jours)</label>
              <select
                value={form.valid_days}
                onChange={(e) => setForm(prev => ({ ...prev, valid_days: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-xl border bg-transparent"
              >
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border bg-transparent resize-none"
              rows={2}
              placeholder="Notes visibles par le client..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conditions</label>
            <textarea
              value={form.terms}
              onChange={(e) => setForm(prev => ({ ...prev, terms: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border bg-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span>Total</span>
              <span className="font-semibold">{formatPrice(calculateTotal())}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Acompte ({form.deposit_percentage}%)</span>
              <span className="font-semibold">{formatPrice(calculateDeposit())}</span>
            </div>
            <div className="flex justify-between text-muted-foreground mt-2 pt-2 border-t">
              <span>Solde restant</span>
              <span>{formatPrice(calculateTotal() - calculateDeposit())}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-xl font-medium hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Créer le devis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
