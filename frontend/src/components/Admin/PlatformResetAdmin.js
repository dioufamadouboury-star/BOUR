import { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, RotateCcw, Database, Download, Loader2, History } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PlatformResetAdmin({ token }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [resetting, setResetting] = useState(false);
  const [options, setOptions] = useState({
    orders: false,
    users: false,
    analytics: false,
    carts: false,
    reservations: false,
    marketing: false,
    sms_history: false
  });

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/platform/backups`, authHeader);
      setBackups(res.data.backups || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleReset = async () => {
    if (confirmCode !== "RESET-YAMA-2026") {
      toast.error("Code de confirmation incorrect");
      return;
    }
    
    const selectedOptions = Object.entries(options).filter(([k, v]) => v).map(([k]) => k);
    if (selectedOptions.length === 0) {
      toast.error("Sélectionnez au moins une option");
      return;
    }

    setResetting(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/platform/reset`, {
        confirm_code: confirmCode,
        options
      }, authHeader);
      toast.success(`Réinitialisation effectuée. Backup: ${res.data.backup_id}`);
      setShowResetModal(false);
      setConfirmCode("");
      fetchBackups();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur");
    }
    setResetting(false);
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm("Restaurer ce backup ? Les données actuelles seront remplacées.")) return;
    try {
      const res = await axios.post(`${API_URL}/api/admin/platform/restore/${backupId}`, {}, authHeader);
      toast.success(`Restauration effectuée: ${res.data.restored_collections.join(", ")}`);
    } catch (e) {
      toast.error("Erreur de restauration");
    }
  };

  const toggleOption = (key) => setOptions(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6" data-testid="platform-reset-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réinitialisation Plateforme</h1>
          <p className="text-muted-foreground">Reset des données avec backup automatique</p>
        </div>
        <button onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700">
          <RotateCcw className="w-4 h-4" /> Réinitialiser
        </button>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-200">Attention</p>
          <p className="text-sm text-amber-700 dark:text-amber-300">La réinitialisation supprime définitivement les données sélectionnées. Un backup est automatiquement créé avant chaque reset.</p>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border">
        <div className="p-4 border-b flex items-center gap-2">
          <History className="w-5 h-5" />
          <h2 className="font-semibold">Historique des backups</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Aucun backup</div>
        ) : (
          <div className="divide-y">
            {backups.map(b => (
              <div key={b.backup_id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm">{b.backup_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.created_at?.split("T")[0]} • {b.collections?.join(", ")} • Par {b.created_by}
                  </p>
                </div>
                <button onClick={() => handleRestore(b.backup_id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm hover:bg-blue-200">
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowResetModal(false)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Réinitialisation</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">Sélectionnez les données à supprimer. Un backup sera créé automatiquement.</p>
            
            <div className="space-y-2 mb-4">
              {[
                { key: "orders", label: "Commandes" },
                { key: "users", label: "Utilisateurs (sauf admin)" },
                { key: "analytics", label: "Analytics & statistiques" },
                { key: "carts", label: "Paniers" },
                { key: "reservations", label: "Réservations" },
                { key: "marketing", label: "Contacts marketing" },
                { key: "sms_history", label: "Historique SMS" }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" checked={options[opt.key]} onChange={() => toggleOption(opt.key)} className="rounded" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">Code de confirmation</label>
              <input type="text" value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 font-mono"
                placeholder="RESET-YAMA-2026" />
              <p className="text-xs text-muted-foreground mt-1">Tapez exactement: RESET-YAMA-2026</p>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleReset} disabled={resetting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 flex items-center gap-2">
                {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
