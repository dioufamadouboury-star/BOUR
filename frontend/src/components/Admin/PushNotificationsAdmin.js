import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Send, Users, TrendingUp, Loader2, Zap, Gift, ShoppingBag, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Pre-defined notification templates
const TEMPLATES = [
  {
    id: "flash_sale",
    name: "Vente Flash",
    icon: Zap,
    color: "bg-red-500",
    title: "🔥 Vente Flash !",
    body: "Jusqu'à -50% pendant 24h seulement !",
    url: "/promotions"
  },
  {
    id: "new_products",
    name: "Nouveautés",
    icon: Sparkles,
    color: "bg-blue-500",
    title: "✨ Nouveautés disponibles",
    body: "Découvrez nos dernières arrivées !",
    url: "/nouveautes"
  },
  {
    id: "special_offer",
    name: "Offre Spéciale",
    icon: Gift,
    color: "bg-purple-500",
    title: "🎁 Offre Spéciale",
    body: "Code promo exclusif : YAMA20 pour -20% !",
    url: "/promotions"
  },
  {
    id: "free_delivery",
    name: "Livraison Gratuite",
    icon: ShoppingBag,
    color: "bg-green-500",
    title: "🚚 Livraison Gratuite",
    body: "Livraison offerte ce weekend sur toutes vos commandes !",
    url: "/"
  }
];

export default function PushNotificationsAdmin({ token }) {
  const [stats, setStats] = useState({ total_subscribers: 0, active_subscribers: 0, total_campaigns: 0 });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("send");
  
  // Custom notification form
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customUrl, setCustomUrl] = useState("/");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        axios.get(`${API_URL}/api/notifications/stats`, authHeader),
        axios.get(`${API_URL}/api/notifications/campaigns`, authHeader)
      ]);
      setStats(statsRes.data);
      setCampaigns(campaignsRes.data.campaigns || []);
    } catch (e) {
      console.log("Error fetching notification data:", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const selectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setCustomTitle(template.title);
    setCustomBody(template.body);
    setCustomUrl(template.url);
  };

  const sendNotification = async () => {
    if (!customTitle || !customBody) {
      toast.error("Titre et message requis");
      return;
    }

    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/notifications/campaign`, {
        title: customTitle,
        body: customBody,
        url: customUrl,
        target: "all"
      }, authHeader);
      
      toast.success(`Notification envoyée à ${res.data.sent_to} abonnés !`);
      setCustomTitle("");
      setCustomBody("");
      setCustomUrl("/");
      setSelectedTemplate(null);
      fetchData(); // Refresh stats and campaigns
    } catch (e) {
      toast.error("Erreur lors de l'envoi");
      console.error(e);
    }
    setSending(false);
  };

  const tabCls = (t) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t ? "bg-black dark:bg-white text-white dark:text-black" : "text-muted-foreground hover:bg-black/5"}`;

  return (
    <div className="space-y-6" data-testid="push-notifications-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications Push</h1>
          <p className="text-muted-foreground">Alertez vos clients des promotions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active_subscribers}</p>
              <p className="text-xs text-muted-foreground">Abonnés actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_campaigns}</p>
              <p className="text-xs text-muted-foreground">Campagnes envoyées</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_subscribers}</p>
              <p className="text-xs text-muted-foreground">Total abonnés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner if no subscribers */}
      {stats.active_subscribers === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Aucun abonné pour l'instant</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Les clients verront une invitation à s'abonner aux notifications sur votre site. 
              Une fois abonnés, vous pourrez leur envoyer des alertes promotionnelles.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabCls("send")} onClick={() => setActiveTab("send")}>Envoyer</button>
        <button className={tabCls("history")} onClick={() => setActiveTab("history")}>Historique</button>
      </div>

      {/* Send Tab */}
      {activeTab === "send" && (
        <div className="space-y-6">
          {/* Templates */}
          <div>
            <h3 className="font-semibold mb-3">Modèles rapides</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map(template => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate === template.id 
                        ? "border-black dark:border-white bg-black/5 dark:bg-white/5" 
                        : "border-transparent bg-white dark:bg-[#1C1C1E] hover:border-black/20"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${template.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-medium text-sm">{template.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Form */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/5 p-6 space-y-4">
            <h3 className="font-semibold">Personnaliser le message</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Titre</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="🔥 Vente Flash !"
                className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Jusqu'à -50% sur tout le site !"
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Lien (optionnel)</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/promotions"
                className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
              />
            </div>

            {/* Preview */}
            {customTitle && (
              <div className="border border-dashed border-black/20 dark:border-white/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">Aperçu de la notification</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{customTitle}</p>
                    <p className="text-sm text-muted-foreground">{customBody}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={sendNotification}
              disabled={sending || !customTitle || !customBody}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Envoyer à {stats.active_subscribers} abonnés
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune campagne envoyée pour l'instant
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign, index) => (
                <div 
                  key={campaign.campaign_id || index}
                  className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/5 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{campaign.title}</p>
                        <p className="text-sm text-muted-foreground">{campaign.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(campaign.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {campaign.sent_count} envoyés
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
