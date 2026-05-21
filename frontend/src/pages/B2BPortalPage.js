import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Package, FileText, TrendingUp, Users, 
  ShoppingCart, Clock, CheckCircle, ArrowRight, 
  Phone, Mail, MapPin, Briefcase, LogIn, UserPlus,
  BarChart3, CreditCard, Truck, Eye, Download
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Wholesale tiers display
const WHOLESALE_TIERS = [
  { min: 1, max: 9, discount: 0, label: "Standard", color: "gray" },
  { min: 10, max: 24, discount: 5, label: "Bronze", color: "amber" },
  { min: 25, max: 49, discount: 10, label: "Argent", color: "slate" },
  { min: 50, max: 99, discount: 15, label: "Or", color: "yellow" },
  { min: 100, max: "∞", discount: 20, label: "Platine", color: "purple" },
];

export default function B2BPortalPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [partner, setPartner] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    password: '', business_type: 'retailer', ninea: '', rccm: '',
    address: '', city: 'Dakar', description: ''
  });

  // Check for existing token
  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    if (token) {
      fetchDashboard(token);
    }
  }, []);

  const fetchDashboard = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/b2b/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
        setPartner(data.partner);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('b2b_token');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/b2b/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('b2b_token', data.token);
        setPartner(data.partner);
        fetchDashboard(data.token);
      } else {
        setError(data.detail || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/b2b/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Demande envoyée! Vous serez contacté après validation de votre compte.');
        setActiveTab('login');
      } else {
        setError(data.detail || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('b2b_token');
    setIsLoggedIn(false);
    setPartner(null);
    setDashboard(null);
  };

  // Landing page for non-logged users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                Espace Professionnel B2B
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Développez votre business avec
                <span className="text-amber-400"> YAMA+</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Accédez aux prix de gros, devis personnalisés et un catalogue exclusif pour les professionnels
              </p>
            </motion.div>

            {/* Wholesale Tiers */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              {WHOLESALE_TIERS.map((tier, i) => (
                <motion.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl bg-gradient-to-br ${
                    tier.discount === 0 ? 'from-gray-800 to-gray-900' :
                    tier.discount === 5 ? 'from-amber-900/50 to-amber-950' :
                    tier.discount === 10 ? 'from-slate-700/50 to-slate-900' :
                    tier.discount === 15 ? 'from-yellow-800/50 to-yellow-950' :
                    'from-purple-800/50 to-purple-950'
                  } border border-white/10`}
                >
                  <div className="text-2xl font-bold text-white">-{tier.discount}%</div>
                  <div className="text-sm text-gray-400">{tier.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{tier.min}-{tier.max} unités</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="max-w-md mx-auto px-4 pb-20">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'login' 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Connexion
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'register' 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Inscription
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
              {success}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    value={registerForm.company_name}
                    onChange={(e) => setRegisterForm({...registerForm, company_name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom du contact *</label>
                  <input
                    type="text"
                    value={registerForm.contact_name}
                    onChange={(e) => setRegisterForm({...registerForm, contact_name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                    minLength={6}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Type d'activité</label>
                  <select
                    value={registerForm.business_type}
                    onChange={(e) => setRegisterForm({...registerForm, business_type: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="retailer">Revendeur / Détaillant</option>
                    <option value="wholesaler">Grossiste</option>
                    <option value="enterprise">Entreprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">NINEA</label>
                  <input
                    type="text"
                    value={registerForm.ninea}
                    onChange={(e) => setRegisterForm({...registerForm, ninea: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">RCCM</label>
                  <input
                    type="text"
                    value={registerForm.rccm}
                    onChange={(e) => setRegisterForm({...registerForm, rccm: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="Optionnel"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Demander un compte B2B'}
              </button>
            </form>
          )}
        </div>

        {/* Features */}
        <div className="bg-white/5 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Avantages Partenaires</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: TrendingUp, title: "Prix de gros", desc: "Jusqu'à -20% sur tous les produits" },
                { icon: FileText, title: "Devis personnalisés", desc: "Demandes de devis illimitées" },
                { icon: CreditCard, title: "Facilités de paiement", desc: "Paiement différé pour les partenaires approuvés" },
                { icon: Truck, title: "Livraison prioritaire", desc: "Traitement prioritaire de vos commandes" },
                { icon: Users, title: "Account manager dédié", desc: "Un interlocuteur unique pour vos besoins" },
                { icon: BarChart3, title: "Dashboard complet", desc: "Suivi de vos commandes et statistiques" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                  <feature.icon className="w-10 h-10 text-amber-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in partners
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building2 className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="font-bold text-lg">{partner?.company_name}</h1>
              <p className="text-sm text-gray-500">Espace B2B</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Commandes totales", value: dashboard?.stats?.total_orders || 0, icon: Package },
            { label: "Total dépensé", value: `${(dashboard?.stats?.total_spent || 0).toLocaleString()} F`, icon: CreditCard },
            { label: "Ce mois", value: `${(dashboard?.stats?.this_month_spent || 0).toLocaleString()} F`, icon: TrendingUp },
            { label: "En attente", value: dashboard?.stats?.pending_orders || 0, icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <stat.icon className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Commandes récentes</h2>
          {dashboard?.recent_orders?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_orders.map((order) => (
                <div key={order.order_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <div className="font-medium">{order.order_id}</div>
                    <div className="text-sm text-gray-500">{order.items?.length || 0} articles</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{order.total?.toLocaleString()} FCFA</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune commande pour le moment</p>
          )}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="/b2b/products"
            className="flex items-center justify-between p-6 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors"
          >
            <div>
              <h3 className="font-bold text-lg">Catalogue Produits</h3>
              <p className="text-amber-900">Voir tous les produits avec prix de gros</p>
            </div>
            <ArrowRight className="w-6 h-6" />
          </a>
          <a
            href="/b2b/quotes"
            className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-amber-500 transition-colors"
          >
            <div>
              <h3 className="font-bold text-lg">Demander un devis</h3>
              <p className="text-gray-500">Pour vos commandes en volume</p>
            </div>
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  );
}
