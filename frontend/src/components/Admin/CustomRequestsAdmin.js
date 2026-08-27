import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Car,
  Sofa,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  MessageCircle,
  Send,
  X,
  ChevronDown,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  Filter,
  Loader2,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = {
  vehicle: [
    { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
    { value: "searching", label: "Recherche en cours", color: "bg-blue-100 text-blue-800" },
    { value: "found", label: "Véhicule trouvé", color: "bg-purple-100 text-purple-800" },
    { value: "quoted", label: "Devis envoyé", color: "bg-indigo-100 text-indigo-800" },
    { value: "accepted", label: "Accepté", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Annulé", color: "bg-red-100 text-red-800" },
  ],
  sofa: [
    { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
    { value: "quoted", label: "Devis envoyé", color: "bg-indigo-100 text-indigo-800" },
    { value: "accepted", label: "Accepté", color: "bg-blue-100 text-blue-800" },
    { value: "production", label: "En production", color: "bg-purple-100 text-purple-800" },
    { value: "ready", label: "Prêt", color: "bg-teal-100 text-teal-800" },
    { value: "delivered", label: "Livré", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Annulé", color: "bg-red-100 text-red-800" },
  ],
  reupholstery: [
    { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
    { value: "quoted", label: "Devis envoyé", color: "bg-indigo-100 text-indigo-800" },
    { value: "accepted", label: "Accepté", color: "bg-blue-100 text-blue-800" },
    { value: "pickup", label: "Enlèvement prévu", color: "bg-orange-100 text-orange-800" },
    { value: "in_progress", label: "En cours", color: "bg-purple-100 text-purple-800" },
    { value: "ready", label: "Prêt", color: "bg-teal-100 text-teal-800" },
    { value: "delivered", label: "Livré", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Annulé", color: "bg-red-100 text-red-800" },
  ],
};

const TYPE_LABELS = {
  vehicle: { label: "Recherche véhicule", icon: Car, color: "text-blue-600" },
  sofa: { label: "Salon sur commande", icon: Sofa, color: "text-amber-600" },
  reupholstery: { label: "Rehoussage", icon: RefreshCw, color: "text-teal-600" },
};

export default function CustomRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState({ type: "", status: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append("request_type", filter.type);
      if (filter.status) params.append("status", filter.status);
      
      const response = await axios.get(`${API_URL}/api/custom-requests/admin/list?${params}`);
      setRequests(response.data.requests);
    } catch (error) {
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/custom-requests/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateStatus = async (requestNumber, newStatus, additionalData = {}) => {
    try {
      await axios.put(`${API_URL}/api/custom-requests/admin/${requestNumber}/status`, {
        status: newStatus,
        ...additionalData,
      });
      toast.success("Statut mis à jour");
      fetchRequests();
      fetchStats();
      if (selectedRequest?.request_number === requestNumber) {
        const updated = await axios.get(`${API_URL}/api/custom-requests/admin/${requestNumber}`);
        setSelectedRequest(updated.data);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (type, status) => {
    const options = STATUS_OPTIONS[type] || STATUS_OPTIONS.vehicle;
    const option = options.find(o => o.value === status) || options[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    );
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        req.request_number.toLowerCase().includes(search) ||
        req.full_name.toLowerCase().includes(search) ||
        req.phone.includes(search)
      );
    }
    return true;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    if (!price) return "-";
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  return (
    <div className="space-y-6" data-testid="custom-requests-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Demandes Personnalisées</h2>
        <button
          onClick={() => { fetchRequests(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="custom-requests-stats">
          {/* Vehicle Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Véhicules</p>
                <p className="text-2xl font-bold">{stats.vehicle.total}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {stats.vehicle.pending} en attente
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {stats.vehicle.accepted} acceptés
              </span>
            </div>
          </div>

          {/* Sofa Stats */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Sofa className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salons</p>
                <p className="text-2xl font-bold">{stats.sofa.total}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {stats.sofa.pending} en attente
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                {stats.sofa.production} en production
              </span>
            </div>
          </div>

          {/* Reupholstery Stats */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rehoussage</p>
                <p className="text-2xl font-bold">{stats.reupholstery.total}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {stats.reupholstery.pending} en attente
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                {stats.reupholstery.in_progress} en cours
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-muted/30 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>
        
        <select
          value={filter.type}
          onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
          data-testid="filter-type-select"
        >
          <option value="">Tous les types</option>
          <option value="vehicle">Véhicules</option>
          <option value="sofa">Salons</option>
          <option value="reupholstery">Rehoussage</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
          data-testid="filter-status-select"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="quoted">Devis envoyé</option>
          <option value="accepted">Accepté</option>
          <option value="cancelled">Annulé</option>
        </select>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par N°, nom, téléphone..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-[#141414] rounded-xl border overflow-hidden" data-testid="requests-list">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune demande trouvée
          </div>
        ) : (
          <div className="divide-y">
            {filteredRequests.map((req) => {
              const TypeInfo = TYPE_LABELS[req.request_type] || TYPE_LABELS.vehicle;
              const TypeIcon = TypeInfo.icon;
              
              return (
                <div
                  key={req.request_number}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(req)}
                  data-testid={`request-item-${req.request_number}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted ${TypeInfo.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium">{req.request_number}</span>
                        {getStatusBadge(req.request_type, req.status)}
                      </div>
                      
                      <p className="text-sm font-medium">{req.full_name}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {req.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(req.created_at)}
                        </span>
                      </div>

                      {/* Type-specific info */}
                      {req.request_type === "vehicle" && req.brand && (
                        <p className="text-sm text-primary mt-1">
                          {req.brand} {req.model && `- ${req.model}`}
                        </p>
                      )}
                      {req.request_type === "sofa" && req.sofa_type && (
                        <p className="text-sm text-amber-600 mt-1">{req.sofa_type}</p>
                      )}
                      {req.request_type === "reupholstery" && req.furniture_type && (
                        <p className="text-sm text-teal-600 mt-1">{req.furniture_type} ({req.piece_count} pièce(s))</p>
                      )}
                    </div>

                    <div className="text-right">
                      {req.quote_amount && (
                        <p className="font-semibold text-green-600">{formatPrice(req.quote_amount)}</p>
                      )}
                      <button className="text-sm text-primary hover:underline flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={updateStatus}
          formatDate={formatDate}
          formatPrice={formatPrice}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
}

function RequestDetailModal({ request, onClose, onUpdateStatus, formatDate, formatPrice, getStatusBadge }) {
  const [newStatus, setNewStatus] = useState(request.status);
  const [quoteAmount, setQuoteAmount] = useState(request.quote_amount || "");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [saving, setSaving] = useState(false);

  const TypeInfo = TYPE_LABELS[request.request_type] || TYPE_LABELS.vehicle;
  const TypeIcon = TypeInfo.icon;
  const statusOptions = STATUS_OPTIONS[request.request_type] || STATUS_OPTIONS.vehicle;

  const handleSave = async () => {
    setSaving(true);
    await onUpdateStatus(request.request_number, newStatus, {
      quote_amount: quoteAmount ? parseInt(quoteAmount) : null,
      admin_notes: adminNotes,
    });
    setSaving(false);
  };

  const openWhatsApp = () => {
    const phone = (request.whatsapp || request.phone).replace(/[^0-9]/g, "");
    const message = `Bonjour ${request.full_name},\n\nConcernant votre demande ${request.request_number}...`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-muted ${TypeInfo.color}`}>
              <TypeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{request.request_number}</h3>
              <p className="text-sm text-muted-foreground">{TypeInfo.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/30 rounded-xl p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
              {getStatusBadge(request.request_type, request.status)}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "..." : "Mettre à jour"}
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Informations client
              </h4>
              
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Nom:</span> {request.full_name}</p>
                <p><span className="text-muted-foreground">Téléphone:</span> {request.phone}</p>
                {request.whatsapp && (
                  <p><span className="text-muted-foreground">WhatsApp:</span> {request.whatsapp}</p>
                )}
                <p><span className="text-muted-foreground">Adresse:</span> {request.address || "-"}</p>
                <p><span className="text-muted-foreground">Ville:</span> {request.city}</p>
              </div>

              <button
                onClick={openWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter WhatsApp
              </button>
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Détails de la demande</h4>
              
              {request.request_type === "vehicle" && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Marque:</span> {request.brand}</p>
                  <p><span className="text-muted-foreground">Modèle:</span> {request.model || "-"}</p>
                  <p><span className="text-muted-foreground">Année:</span> {request.year_min} - {request.year_max}</p>
                  <p><span className="text-muted-foreground">Budget:</span> {formatPrice(request.budget_min)} - {formatPrice(request.budget_max)}</p>
                  <p><span className="text-muted-foreground">Km max:</span> {request.km_max || "-"}</p>
                  <p><span className="text-muted-foreground">Carburant:</span> {request.fuel || "-"}</p>
                  <p><span className="text-muted-foreground">Transmission:</span> {request.transmission || "-"}</p>
                  <p><span className="text-muted-foreground">Couleur:</span> {request.color || "-"}</p>
                  <p>
                    <span className="text-muted-foreground">Dédouanement:</span>{" "}
                    <span className={request.customs_status === "dedouane" ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                      {request.customs_status === "dedouane" ? "Dédouané" : "Sous douane"}
                    </span>
                  </p>
                </div>
              )}

              {request.request_type === "sofa" && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Type:</span> {request.sofa_type}</p>
                  <p><span className="text-muted-foreground">Quantité:</span> {request.quantity}</p>
                  <p><span className="text-muted-foreground">Dimensions:</span> {request.width}x{request.depth}x{request.height} cm</p>
                  <p><span className="text-muted-foreground">Tissu:</span> {request.fabric || "-"}</p>
                  <p><span className="text-muted-foreground">Couleur:</span> {request.color || "-"}</p>
                  <p><span className="text-muted-foreground">Rembourrage:</span> {request.cushion_type || "-"}</p>
                  <p><span className="text-muted-foreground">Budget:</span> {request.budget_range || "-"}</p>
                  <div className="flex gap-2 mt-2">
                    {request.with_armrests && <span className="px-2 py-1 bg-muted rounded text-xs">Accoudoirs</span>}
                    {request.with_headrests && <span className="px-2 py-1 bg-muted rounded text-xs">Têtières</span>}
                    {request.with_storage && <span className="px-2 py-1 bg-muted rounded text-xs">Rangement</span>}
                  </div>
                </div>
              )}

              {request.request_type === "reupholstery" && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Meuble:</span> {request.furniture_type}</p>
                  <p><span className="text-muted-foreground">Service:</span> {request.service_type}</p>
                  <p><span className="text-muted-foreground">Nb pièces:</span> {request.piece_count}</p>
                  <p><span className="text-muted-foreground">Tissu souhaité:</span> {request.fabric_preference || "-"}</p>
                  <p><span className="text-muted-foreground">État actuel:</span> {request.current_condition || "-"}</p>
                  <p><span className="text-muted-foreground">Urgence:</span> {request.urgency}</p>
                  <p>
                    <span className="text-muted-foreground">Enlèvement:</span>{" "}
                    {request.pickup_needed ? "Oui" : "Non"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {((request.reference_images && request.reference_images.length > 0) || 
            (request.photos && request.photos.length > 0)) && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {(request.reference_images || request.photos || []).map((img, i) => (
                  <a
                    key={i}
                    href={img.startsWith('/') ? `${API_URL}${img}` : img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={img.startsWith('/') ? `${API_URL}${img}` : img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {request.comments && (
            <div className="space-y-2">
              <h4 className="font-semibold">Commentaires client</h4>
              <p className="text-sm bg-muted/30 rounded-lg p-3">{request.comments}</p>
            </div>
          )}

          {/* Quote & Admin Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Montant du devis (FCFA)
              </label>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="Ex: 500000"
                className="w-full px-4 py-2 rounded-lg border bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Notes admin</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes internes..."
                rows={2}
                className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="text-xs text-muted-foreground">
            <p>Créée le: {formatDate(request.created_at)}</p>
            <p>Mise à jour: {formatDate(request.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
