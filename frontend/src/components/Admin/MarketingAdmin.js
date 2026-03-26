import { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Phone, Users, Send, Loader2, TrendingUp, Filter, Download } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MarketingAdmin({ token }) {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total_contacts: 0, total_emails: 0, total_phones: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contacts");
  const [sourceFilter, setSourceFilter] = useState("all");
  
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
      </div>

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {["all", "registration", "order", "reservation", "service_request"].map(s => (
                <button key={s} onClick={() => setSourceFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sourceFilter === s ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  {s === "all" ? "Toutes sources" : s === "registration" ? "Inscription" : s === "order" ? "Commande" : s === "reservation" ? "Réservation" : "Service"}
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
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border p-6 space-y-4">
          <h2 className="font-bold text-lg">Créer une campagne</h2>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={campaignType === "email"} onChange={() => setCampaignType("email")} />
              <Mail className="w-4 h-4" /> Email
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" checked={campaignType === "sms"} onChange={() => setCampaignType("sms")} />
              <Phone className="w-4 h-4" /> SMS
            </label>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Cible</label>
            <select value={campaignTarget} onChange={e => setCampaignTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10">
              <option value="all">Tous les contacts</option>
              <option value="emails_only">Contacts avec email uniquement</option>
              <option value="phones_only">Contacts avec téléphone uniquement</option>
            </select>
          </div>

          {campaignType === "email" && (
            <div>
              <label className="text-sm font-medium block mb-1">Sujet</label>
              <input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10" placeholder="Sujet de l'email" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">Message {campaignType === "sms" && `(${campaignMessage.length}/160)`}</label>
            <textarea value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10" rows={4}
              placeholder={campaignType === "email" ? "Contenu HTML de l'email..." : "Message SMS..."} />
          </div>

          <button onClick={sendCampaign} disabled={sending}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer la campagne
          </button>
        </div>
      )}
    </div>
  );
}
