import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, Ship, Package, Calculator, Globe, MapPin, 
  Clock, CheckCircle, ArrowRight, Phone, Mail, 
  Truck, AlertCircle, Search, FileText, Send,
  ChevronDown, ChevronUp, ExternalLink, Copy
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Shipping rates display
const SHIPPING_METHODS = [
  {
    id: 'air_general',
    name: 'Avion - Marchandise Générale',
    icon: Plane,
    duration: '8-12 jours',
    color: 'blue',
    rates: [
      { range: '0-10 KG', price: '8 000 FCFA/KG' },
      { range: '10-50 KG', price: '7 000 FCFA/KG' },
      { range: '50-200 KG', price: '6 800 FCFA/KG' },
      { range: '+200 KG', price: '6 600 FCFA/KG' },
    ]
  },
  {
    id: 'air_sensitive',
    name: 'Avion - Marchandise Sensible',
    icon: Plane,
    duration: '12-16 jours',
    color: 'amber',
    rates: [
      { range: '0-10 KG', price: '8 000 FCFA/KG' },
      { range: '10-50 KG', price: '7 200 FCFA/KG' },
      { range: '50-200 KG', price: '7 000 FCFA/KG' },
      { range: '+200 KG', price: '6 800 FCFA/KG' },
    ],
    note: 'Téléphones: +300 FCFA/pièce'
  },
  {
    id: 'maritime',
    name: 'Maritime (par CBM)',
    icon: Ship,
    duration: '30-45 jours',
    color: 'cyan',
    rates: [
      { range: 'Par CBM', price: 'Sur devis' },
    ],
    note: '1 CBM = 167 KG'
  }
];

const STATUS_STEPS = [
  { id: 'pending', label: 'Demande reçue', icon: FileText },
  { id: 'quoted', label: 'Devis envoyé', icon: Calculator },
  { id: 'deposit_paid', label: 'Acompte payé', icon: CheckCircle },
  { id: 'ordered', label: 'Commandé', icon: Package },
  { id: 'in_transit_china', label: 'En transit Chine', icon: Truck },
  { id: 'arrived_warehouse', label: 'Entrepôt Chine', icon: MapPin },
  { id: 'shipping_to_senegal', label: 'En route Sénégal', icon: Plane },
  { id: 'customs', label: 'Douane', icon: AlertCircle },
  { id: 'delivered', label: 'Livré', icon: CheckCircle },
];

export default function SourcingPage() {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedMethod, setExpandedMethod] = useState(null);

  // Calculator state
  const [calcForm, setCalcForm] = useState({
    weight_kg: '',
    shipping_method: 'air_general',
    contains_phones: 0,
    length_cm: '',
    width_cm: '',
    height_cm: ''
  });
  const [calcResult, setCalcResult] = useState(null);

  // Request form state
  const [requestForm, setRequestForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_city: 'Dakar',
    product_link: '',
    product_name: '',
    product_description: '',
    quantity: 1,
    estimated_weight_kg: '',
    estimated_dimensions: '',
    shipping_method: 'air_general',
    is_sensitive: false,
    contains_phones: 0,
    notes: ''
  });

  // Tracking state
  const [trackingId, setTrackingId] = useState('');
  const [trackingEmail, setTrackingEmail] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  const calculateShipping = async () => {
    if (!calcForm.weight_kg) {
      setError('Veuillez entrer un poids');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/sourcing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calcForm,
          weight_kg: parseFloat(calcForm.weight_kg),
          length_cm: calcForm.length_cm ? parseFloat(calcForm.length_cm) : null,
          width_cm: calcForm.width_cm ? parseFloat(calcForm.width_cm) : null,
          height_cm: calcForm.height_cm ? parseFloat(calcForm.height_cm) : null,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCalcResult(data);
      } else {
        setError(data.detail || 'Erreur de calcul');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/sourcing/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          estimated_weight_kg: requestForm.estimated_weight_kg ? parseFloat(requestForm.estimated_weight_kg) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Demande envoyée! Votre numéro: ${data.request_id}. Vous recevrez un devis sous 24-48h.`);
        setRequestForm({
          customer_name: '', customer_email: '', customer_phone: '', customer_address: '',
          customer_city: 'Dakar', product_link: '', product_name: '', product_description: '',
          quantity: 1, estimated_weight_kg: '', estimated_dimensions: '',
          shipping_method: 'air_general', is_sensitive: false, contains_phones: 0, notes: ''
        });
      } else {
        setError(data.detail || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const trackRequest = async () => {
    if (!trackingId) {
      setError('Veuillez entrer un numéro de suivi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = trackingEmail 
        ? `${API_URL}/api/sourcing/track/${trackingId}?email=${encodeURIComponent(trackingEmail)}`
        : `${API_URL}/api/sourcing/track/${trackingId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTrackingResult(data);
      } else {
        setError(data.detail || 'Demande non trouvée');
        setTrackingResult(null);
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvZz48L3N2Zz4=')] opacity-10" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Import Chine 🇨🇳 → Sénégal 🇸🇳
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Commandez en Chine,
              <span className="text-red-500"> Recevez à Dakar</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Service complet de sourcing et livraison. Douane et taxes comprises.
              Entrepôt Chine → Entrepôt Dakar
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Plane className="w-5 h-5 text-blue-400" />
                <span>Avion: 8-16 jours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Ship className="w-5 h-5 text-cyan-400" />
                <span>Maritime: 30-45 jours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Douane incluse</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'info', label: 'Tarifs', icon: Calculator },
              { id: 'calculator', label: 'Calculateur', icon: Calculator },
              { id: 'request', label: 'Commander', icon: Send },
              { id: 'track', label: 'Suivi', icon: Search },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
            {success}
          </div>
        )}

        {/* Info/Rates Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Tarifs Transport Chine → Sénégal</h2>
            
            {SHIPPING_METHODS.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r from-${method.color}-900/30 to-${method.color}-950/30 border border-${method.color}-500/30 rounded-2xl overflow-hidden`}
              >
                <button
                  onClick={() => setExpandedMethod(expandedMethod === method.id ? null : method.id)}
                  className="w-full p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-${method.color}-500/20 rounded-xl`}>
                      <method.icon className={`w-6 h-6 text-${method.color}-400`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{method.name}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {method.duration}
                      </p>
                    </div>
                  </div>
                  {expandedMethod === method.id ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedMethod === method.id && (
                  <div className="px-6 pb-6">
                    <div className="grid gap-2">
                      {method.rates.map((rate, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                          <span className="text-gray-400">{rate.range}</span>
                          <span className="font-bold text-white">{rate.price}</span>
                        </div>
                      ))}
                    </div>
                    {method.note && (
                      <p className="mt-4 text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg">
                        {method.note}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Additional Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-8">
              <h3 className="font-bold text-lg mb-4">Informations importantes</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  Transport entrepôt Chine → entrepôt Dakar, douane et taxe comprises
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  Le poids facturé dépend de la mesure des colis reçus
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  Colis volumineux: 1 CBM = 167 KG
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  Douane formelle en Chine: minimum 100 KG
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  Changement de voie de transport: 3 000 FCFA/fois
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Calculateur de frais</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Poids estimé (KG) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcForm.weight_kg}
                  onChange={(e) => setCalcForm({...calcForm, weight_kg: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-red-500"
                  placeholder="Ex: 5.5"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Méthode de transport</label>
                <select
                  value={calcForm.shipping_method}
                  onChange={(e) => setCalcForm({...calcForm, shipping_method: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-red-500"
                >
                  <option value="air_general">Avion - Marchandise Générale (8-12j)</option>
                  <option value="air_sensitive">Avion - Marchandise Sensible (12-16j)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de téléphones</label>
                <input
                  type="number"
                  min="0"
                  value={calcForm.contains_phones}
                  onChange={(e) => setCalcForm({...calcForm, contains_phones: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400 mb-3">Dimensions (optionnel - pour calcul volumétrique)</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={calcForm.length_cm}
                    onChange={(e) => setCalcForm({...calcForm, length_cm: e.target.value})}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                    placeholder="L (cm)"
                  />
                  <input
                    type="number"
                    value={calcForm.width_cm}
                    onChange={(e) => setCalcForm({...calcForm, width_cm: e.target.value})}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                    placeholder="l (cm)"
                  />
                  <input
                    type="number"
                    value={calcForm.height_cm}
                    onChange={(e) => setCalcForm({...calcForm, height_cm: e.target.value})}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                    placeholder="H (cm)"
                  />
                </div>
              </div>

              <button
                onClick={calculateShipping}
                disabled={loading}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calcul...' : 'Calculer'}
              </button>
            </div>

            {/* Result */}
            {calcResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-r from-green-900/30 to-green-950/30 border border-green-500/30 rounded-2xl p-6"
              >
                <h3 className="font-bold text-lg mb-4 text-green-400">Estimation des frais</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Poids réel:</span>
                    <span>{calcResult.actual_weight_kg} KG</span>
                  </div>
                  {calcResult.volumetric_weight_kg && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Poids volumétrique:</span>
                      <span>{calcResult.volumetric_weight_kg?.toFixed(2)} KG</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Poids facturé:</span>
                    <span>{calcResult.billable_weight_kg?.toFixed(2)} KG</span>
                  </div>
                  
                  <div className="border-t border-white/10 pt-3 mt-3">
                    {Object.entries(calcResult.calculations || {}).map(([key, calc]) => (
                      <div key={key} className="flex justify-between items-center py-2">
                        <span className="text-gray-400">{calc.method_name}</span>
                        <span className="font-bold text-xl text-white">
                          {calc.total_shipping_cost?.toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  * Prix indicatif. Le prix final sera confirmé après réception du colis.
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Request Form Tab */}
        {activeTab === 'request' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Demander un import</h2>
            
            <form onSubmit={submitRequest} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  Vos informations
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={requestForm.customer_name}
                      onChange={(e) => setRequestForm({...requestForm, customer_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={requestForm.customer_phone}
                      onChange={(e) => setRequestForm({...requestForm, customer_phone: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Email *</label>
                    <input
                      type="email"
                      value={requestForm.customer_email}
                      onChange={(e) => setRequestForm({...requestForm, customer_email: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-400" />
                  Informations produit
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Lien du produit * (AliExpress, 1688, Taobao...)</label>
                    <input
                      type="url"
                      value={requestForm.product_link}
                      onChange={(e) => setRequestForm({...requestForm, product_link: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Nom du produit</label>
                      <input
                        type="text"
                        value={requestForm.product_name}
                        onChange={(e) => setRequestForm({...requestForm, product_name: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quantité *</label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.quantity}
                        onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Poids estimé (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={requestForm.estimated_weight_kg}
                        onChange={(e) => setRequestForm({...requestForm, estimated_weight_kg: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                        placeholder="Optionnel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Nb de téléphones</label>
                      <input
                        type="number"
                        min="0"
                        value={requestForm.contains_phones}
                        onChange={(e) => setRequestForm({...requestForm, contains_phones: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-400" />
                  Transport
                </h3>
                <select
                  value={requestForm.shipping_method}
                  onChange={(e) => setRequestForm({...requestForm, shipping_method: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                >
                  <option value="air_general">Avion - Marchandise Générale (8-12 jours)</option>
                  <option value="air_sensitive">Avion - Marchandise Sensible (12-16 jours)</option>
                  <option value="maritime">Maritime (30-45 jours)</option>
                </select>
                <label className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={requestForm.is_sensitive}
                    onChange={(e) => setRequestForm({...requestForm, is_sensitive: e.target.checked})}
                    className="rounded"
                  />
                  Contient des marchandises sensibles (batteries, liquides, etc.)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes / Instructions</label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white h-24"
                  placeholder="Couleur, taille, variante souhaitée..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Envoi...' : 'Envoyer ma demande'}
              </button>
            </form>
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === 'track' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Suivi de commande</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Numéro de demande *</label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  placeholder="IMP-XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email (optionnel)</label>
                <input
                  type="email"
                  value={trackingEmail}
                  onChange={(e) => setTrackingEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  placeholder="Pour plus de détails"
                />
              </div>
              <button
                onClick={trackRequest}
                disabled={loading}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>

            {/* Tracking Result */}
            {trackingResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg">{trackingResult.request_id}</h3>
                    <p className="text-sm text-gray-400">{trackingResult.product?.name || 'Produit'} x{trackingResult.product?.quantity}</p>
                  </div>
                  {trackingResult.pricing?.total && (
                    <div className="text-right">
                      <div className="font-bold text-xl">{trackingResult.pricing.total.toLocaleString()} FCFA</div>
                      {trackingResult.pricing.deposit_paid && (
                        <span className="text-xs text-green-400">Acompte payé</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Steps */}
                <div className="relative">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIndex = getStatusIndex(trackingResult.status);
                    const isCompleted = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    
                    return (
                      <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0">
                        <div className={`relative z-10 p-2 rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-700'
                        } ${isCurrent ? 'ring-4 ring-green-500/30' : ''}`}>
                          <step.icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-6 ${
                            i < currentIndex ? 'bg-green-500' : 'bg-gray-700'
                          }`} />
                        )}
                        <div>
                          <div className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                            {step.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Numbers */}
                {(trackingResult.tracking?.china_tracking || trackingResult.tracking?.international_tracking) && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="font-bold mb-3">Numéros de suivi</h4>
                    {trackingResult.tracking.china_tracking && (
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-2">
                        <span className="text-gray-400">Chine:</span>
                        <span className="font-mono">{trackingResult.tracking.china_tracking}</span>
                      </div>
                    )}
                    {trackingResult.tracking.international_tracking && (
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">International:</span>
                        <span className="font-mono">{trackingResult.tracking.international_tracking}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-white/5 border-t border-white/10 py-12 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Besoin d'aide?</h2>
          <p className="text-gray-400 mb-6">Notre équipe est disponible pour répondre à vos questions</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/221783827575"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-400 transition-colors"
            >
              <Phone className="w-5 h-5" />
              WhatsApp
            </a>
            <a
              href="mailto:contact@groupeyamaplus.com"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing import
const Users = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
