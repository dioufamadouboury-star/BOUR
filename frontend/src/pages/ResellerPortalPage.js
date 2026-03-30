import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  TrendingUp,
  Link2,
  Copy,
  Wallet,
  Clock,
  LogOut,
  ShoppingBag,
  Eye,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ResellerPortalPage() {
  const navigate = useNavigate();
  const [reseller, setReseller] = useState(null);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("reseller_token");
    if (token) {
      fetchResellerData(token);
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, []);

  const fetchResellerData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/reseller/me`, { headers });
      setReseller(res.data.reseller);
      
      // Fetch dashboard data (stats, sales, commissions)
      const dashRes = await axios.get(`${API_URL}/api/reseller/dashboard`, { headers });
      setStats(dashRes.data.stats);
      setSales(dashRes.data.recent_orders || []);
      setCommissions(dashRes.data.commissions || []);
    } catch (e) {
      console.error("Auth error:", e);
      localStorage.removeItem("reseller_token");
      setShowLogin(true);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/reseller/login`, loginForm);
      localStorage.setItem("reseller_token", res.data.token);
      setReseller(res.data.reseller);
      setShowLogin(false);
      fetchResellerData(res.data.token);
      toast.success("Connexion réussie !");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Identifiants incorrects");
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("reseller_token");
    setReseller(null);
    setShowLogin(true);
  };

  const copyLink = () => {
    if (reseller?.reseller_code) {
      navigator.clipboard.writeText(`${window.location.origin}/r/${reseller.reseller_code}`);
      toast.success("Lien copié !");
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price || 0) + " FCFA";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img src="/assets/images/logo_yama_full.png" alt="YAMA+" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Portail Revendeurs</h1>
            <p className="text-muted-foreground mt-2">Connectez-vous pour accéder à votre espace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Mot de passe</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Pas encore revendeur ?{" "}
            <a href="/contact" className="text-blue-600 hover:underline">
              Contactez-nous
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/assets/images/logo_yama_full.png" alt="YAMA+" className="h-10" />
            <div className="hidden sm:block">
              <p className="font-semibold">{reseller?.name}</p>
              <p className="text-xs text-muted-foreground">{reseller?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Votre lien de parrainage</h2>
              <p className="text-blue-100 text-sm">
                Partagez ce lien pour gagner {reseller?.commission_rate || 10}% de commission sur chaque vente
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-3">
              <Link2 className="w-5 h-5" />
              <span className="font-mono text-sm">{window.location.origin}/r/{reseller?.reseller_code}</span>
              <button
                onClick={copyLink}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copier"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatPrice(reseller?.total_sales)}</p>
            <p className="text-sm text-muted-foreground">Ventes totales</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatPrice(reseller?.total_commission)}</p>
            <p className="text-sm text-muted-foreground">Commissions gagnées</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatPrice(reseller?.pending_commission)}</p>
            <p className="text-sm text-muted-foreground">À percevoir</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{reseller?.total_orders || 0}</p>
            <p className="text-sm text-muted-foreground">Commandes</p>
          </motion.div>
        </div>

        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold">Ventes récentes</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sales.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vente pour le moment</p>
                <p className="text-sm mt-2">Partagez votre lien pour commencer à gagner !</p>
              </div>
            ) : (
              sales.slice(0, 10).map((sale) => (
                <div key={sale.order_id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="font-medium">{sale.order_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(sale.total)}</p>
                    <p className="text-sm text-green-600">
                      +{formatPrice(sale.reseller_commission)} commission
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold">Historique des versements</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {commissions.filter((c) => c.type === "payment").length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun versement effectué</p>
              </div>
            ) : (
              commissions
                .filter((c) => c.type === "payment")
                .slice(0, 10)
                .map((payment) => (
                  <div key={payment.commission_id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatPrice(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString("fr-FR")} via{" "}
                        {payment.payment_method === "wave"
                          ? "Wave"
                          : payment.payment_method === "orange_money"
                          ? "Orange Money"
                          : payment.payment_method}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Versé
                    </span>
                  </div>
                ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
