import { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Phone, Users, Send, Loader2, TrendingUp, Filter, Download, FileText, Sparkles, MessageSquare, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Email Templates
const EMAIL_TEMPLATES = [
  {
    id: "promo",
    name: "Promotion",
    subject: "🔥 Offre Exclusive YAMA+ - Jusqu'à -50%",
    content: `<h1>Offre Spéciale YAMA+</h1>
<p>Bonjour,</p>
<p>Profitez de réductions exceptionnelles sur notre sélection de produits !</p>
<ul>
<li>Électroménager : -30%</li>
<li>Mobilier : -25%</li>
<li>Décoration : -40%</li>
</ul>
<p><strong>Utilisez le code PROMO20 pour bénéficier de 20% supplémentaires !</strong></p>
<p>Offre valable jusqu'au [DATE]</p>
<p>À bientôt,<br>L'équipe YAMA+</p>`
  },
  {
    id: "nouveautes",
    name: "Nouveautés",
    subject: "✨ Découvrez nos nouveautés YAMA+",
    content: `<h1>Nouvelles Arrivées !</h1>
<p>Bonjour,</p>
<p>De nouveaux produits viennent d'arriver chez YAMA+ !</p>
<p>Découvrez notre sélection exclusive de [CATEGORIE] pour embellir votre intérieur.</p>
<p>Visitez notre site pour les découvrir en avant-première.</p>
<p>À bientôt,<br>L'équipe YAMA+</p>`
  },
  {
    id: "relance",
    name: "Relance panier",
    subject: "🛒 Vous avez oublié quelque chose...",
    content: `<h1>Votre panier vous attend</h1>
<p>Bonjour,</p>
<p>Vous avez récemment consulté nos produits mais n'avez pas finalisé votre commande.</p>
<p>Vos articles sont toujours disponibles et prêts à être livrés !</p>
<p><strong>Finalisez votre commande maintenant et bénéficiez de la livraison offerte avec le code LIVRAISON</strong></p>
<p>À bientôt,<br>L'équipe YAMA+</p>`
  },
  {
    id: "fidelite",
    name: "Programme fidélité",
    subject: "🎁 Merci pour votre fidélité !",
    content: `<h1>Merci de votre confiance</h1>
<p>Bonjour,</p>
<p>Nous tenons à vous remercier pour votre fidélité !</p>
<p>En tant que client privilégié, profitez de <strong>15% de réduction</strong> sur votre prochaine commande.</p>
<p>Code : FIDELE15</p>
<p>À bientôt,<br>L'équipe YAMA+</p>`
  }
];

// SMS Templates
const SMS_TEMPLATES = [
  { id: "promo_sms", name: "Promo", content: "🔥 YAMA+ : -30% sur tout le site ! Code PROMO30. Valable 48h. yamaplus.com" },
  { id: "livraison_sms", name: "Livraison", content: "📦 YAMA+ : Livraison GRATUITE ce weekend ! Profitez-en. yamaplus.com" },
  { id: "relance_sms", name: "Relance", content: "🛒 YAMA+ : Votre panier vous attend ! Finalisez votre commande. yamaplus.com" },
  { id: "nouveautes_sms", name: "Nouveautés", content: "✨ YAMA+ : Nouvelles arrivées ! Découvrez notre collection. yamaplus.com" }
];

export default function MarketingAdmin({ token }) {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total_contacts: 0, total_emails: 0, total_phones: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contacts");
  const [sourceFilter, setSourceFilter] = useState("all");
  
  // WhatsApp notifications state
  const [whatsappNotifications, setWhatsappNotifications] = useState([]);
  const [whatsappPending, setWhatsappPending] = useState(0);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  
  // Campaign state
  const [campaignType, setCampaignType] = useState("email");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignTarget, setCampaignTarget] = useState("all");
  const [sending, setSending] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = sourceFilter !== "all" ? `?source=${sourceFilter}` : "";
      const res = await axios.get(`${API_URL}/api/admin/marketing/contacts${params}`, authHeader);
      setContacts(res.data.contacts || []);
      setStats(res.data.stats || {});
    } catch (e) {
      toast.error("Erreur chargement contacts");
    }
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [sourceFilter]);

  // Fetch WhatsApp notifications
  const fetchWhatsappNotifications = async () => {
    setLoadingWhatsapp(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/whatsapp/notifications`, authHeader);
      setWhatsappNotifications(res.data.notifications || []);
      setWhatsappPending(res.data.pending_count || 0);
    } catch (e) {
      console.log("WhatsApp notifications not available");
    }
    setLoadingWhatsapp(false);
  };

  useEffect(() => {
    if (activeTab === "whatsapp") {
      fetchWhatsappNotifications();
    }
  }, [activeTab]);

  const markWhatsappSent = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/api/admin/whatsapp/notifications/${notificationId}/mark-sent`, {}, authHeader);
      toast.success("Marqué comme envoyé");
      fetchWhatsappNotifications();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const sendCampaign = async () => {
    if (!campaignMessage) { toast.error("Message requis"); return; }
    if (campaignType === "email" && !campaignSubject) { toast.error("Sujet requis pour email"); return; }
    
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/marketing/campaign`, {
        type: campaignType,
        subject: campaignSubject,
        message: campaignMessage,
        target: campaignTarget
      }, authHeader);
      toast.success(`Campagne envoyée : ${res.data.sent}/${res.data.total} contacts`);
      setCampaignSubject("");
      setCampaignMessage("");
    } catch (e) {
      toast.error("Erreur envoi campagne");
    }
    setSending(false);
  };

  const exportContacts = () => {
    const csv = contacts.map(c => `${c.name || ""},${c.email || ""},${c.phone || ""},${c.source || ""}`).join("\n");
    const blob = new Blob([`Nom,Email,Téléphone,Source\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_marketing.csv";
    a.click();
  };

  const tabCls = (t) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t ? "bg-black dark:bg-white text-white dark:text-black" : "text-muted-foreground hover:bg-black/5"}`;

  return (
    <div className="space-y-6" data-testid="marketing-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing & Collecte</h1>
          <p className="text-muted-foreground">Contacts collectés et campagnes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.total_contacts}</p>
              <p className="text-xs text-muted-foreground">Total contacts</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Mail className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.total_emails}</p>
              <p className="text-xs text-muted-foreground">Avec email</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><Phone className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.total_phones}</p>
              <p className="text-xs text-muted-foreground">Avec téléphone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabCls("contacts")} onClick={() => setActiveTab("contacts")}>Contacts</button>
        <button className={tabCls("campaign")} onClick={() => setActiveTab("campaign")}>Nouvelle campagne</button>
        <button className={tabCls("whatsapp")} onClick={() => setActiveTab("whatsapp")}>
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
            {whatsappPending > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">{whatsappPending}</span>
            )}
          </span>
        </button>
      </div>

      {/* WhatsApp Tab */}
      {activeTab === "whatsapp" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications WhatsApp à envoyer</h3>
            <button onClick={fetchWhatsappNotifications} className="text-sm text-blue-600 hover:underline">
              Actualiser
            </button>
          </div>
          
          {loadingWhatsapp ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : whatsappNotifications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Aucune notification WhatsApp en attente</div>
          ) : (
            <div className="space-y-3">
              {whatsappNotifications.map(notif => (
                <div key={notif.notification_id} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-black/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          notif.status === "sent" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {notif.status === "sent" ? "Envoyé" : "En attente"}
                        </span>
                        <span className="text-xs text-muted-foreground">{notif.type}</span>
                        {notif.order_id && <span className="text-xs font-mono">{notif.order_id}</span>}
                      </div>
                      <p className="text-sm font-medium">{notif.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={notif.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ouvrir WhatsApp
                      </a>
                      {notif.status !== "sent" && (
                        <button
                          onClick={() => markWhatsappSent(notif.notification_id)}
                          className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marquer envoyé
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {["all", "registration", "order", "newsletter", "reservation", "service_request"].map(s => (
                <button key={s} onClick={() => setSourceFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sourceFilter === s ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  {s === "all" ? "Toutes sources" : s === "registration" ? "Inscription" : s === "order" ? "Commande" : s === "newsletter" ? "Newsletter" : s === "reservation" ? "Réservation" : "Service"}
                </button>
              ))}
            </div>
            <button onClick={exportContacts} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-sm hover:bg-gray-200">
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Nom</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Téléphone</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="px-4 py-3">{c.name || "-"}</td>
                      <td className="px-4 py-3">{c.email || "-"}</td>
                      <td className="px-4 py-3">{c.phone || "-"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">{c.source}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{c.collected_at?.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaign Tab */}
      {activeTab === "campaign" && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border p-6 space-y-6">
          <h2 className="font-bold text-lg">Créer une campagne</h2>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" checked={campaignType === "email"} onChange={() => setCampaignType("email")} />
              <Mail className="w-4 h-4" /> Email
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" checked={campaignType === "sms"} onChange={() => setCampaignType("sms")} />
              <Phone className="w-4 h-4" /> SMS
            </label>
          </div>

          {/* Templates */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Templates prédéfinis
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(campaignType === "email" ? EMAIL_TEMPLATES : SMS_TEMPLATES).map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    if (campaignType === "email") {
                      setCampaignSubject(tpl.subject);
                    }
                    setCampaignMessage(tpl.content);
                    toast.success(`Template "${tpl.name}" appliqué`);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-sm"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Cible</label>
            <select value={campaignTarget} onChange={e => setCampaignTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-transparent">
              <option value="all">Tous les contacts ({stats.total_contacts})</option>
              <option value="emails_only">Contacts avec email ({stats.total_emails})</option>
              <option value="phones_only">Contacts avec téléphone ({stats.total_phones})</option>
            </select>
          </div>

          {campaignType === "email" && (
            <div>
              <label className="text-sm font-medium block mb-1">Sujet</label>
              <input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 bg-transparent" placeholder="Sujet de l'email" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">
              Message {campaignType === "sms" && <span className="text-muted-foreground">({campaignMessage.length}/160 caractères)</span>}
            </label>
            <textarea value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-transparent font-mono text-sm" rows={6}
              placeholder={campaignType === "email" ? "Contenu HTML de l'email..." : "Message SMS..."} />
          </div>

          <div className="flex gap-3">
            <button onClick={sendCampaign} disabled={sending}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer la campagne
            </button>
            <button onClick={() => { setCampaignSubject(""); setCampaignMessage(""); }}
              className="px-6 py-3 rounded-xl border border-black/10 font-semibold hover:bg-black/5 transition-colors">
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
