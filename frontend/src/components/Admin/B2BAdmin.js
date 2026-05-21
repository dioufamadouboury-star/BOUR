import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, FileText, CheckCircle, XCircle,
  Clock, Eye, Edit, TrendingUp, Package, Search
} from 'lucide-react';
import { formatPrice, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function B2BAdmin() {
  const [activeTab, setActiveTab] = useState('partners');
  const [partners, setPartners] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [partnersRes, quotesRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/b2b/partners`, { headers }),
        fetch(`${API_URL}/api/admin/b2b/quotes`, { headers }),
        fetch(`${API_URL}/api/admin/b2b/orders`, { headers })
      ]);

      if (partnersRes.ok) setPartners((await partnersRes.json()).partners || []);
      if (quotesRes.ok) setQuotes((await quotesRes.json()).quotes || []);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = async (partnerId, data) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/b2b/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Partenaire mis à jour');
        fetchData();
      }
    } catch (err) {
      toast.error('Erreur de mise à jour');
    }
  };

  const updateQuote = async (quoteId, data) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/b2b/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Devis mis à jour');
        fetchData();
        setSelectedItem(null);
      }
    } catch (err) {
      toast.error('Erreur de mise à jour');
    }
  };

  const stats = {
    totalPartners: partners.length,
    pendingPartners: partners.filter(p => p.status === 'pending').length,
    activePartners: partners.filter(p => p.is_active).length,
    pendingQuotes: quotes.filter(q => q.status === 'pending').length,
    totalOrders: orders.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion B2B</h1>
          <p className="text-muted-foreground">Partenaires professionnels et devis</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Building2 className="w-6 h-6 text-amber-500 mb-2" />
          <div className="text-2xl font-bold">{stats.totalPartners}</div>
          <div className="text-sm text-muted-foreground">Partenaires</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Clock className="w-6 h-6 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold">{stats.pendingPartners}</div>
          <div className="text-sm text-muted-foreground">En attente</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <div className="text-2xl font-bold">{stats.activePartners}</div>
          <div className="text-sm text-muted-foreground">Actifs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <FileText className="w-6 h-6 text-blue-500 mb-2" />
          <div className="text-2xl font-bold">{stats.pendingQuotes}</div>
          <div className="text-sm text-muted-foreground">Devis en attente</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Package className="w-6 h-6 text-purple-500 mb-2" />
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <div className="text-sm text-muted-foreground">Commandes B2B</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'partners', label: 'Partenaires', icon: Users },
          { id: 'quotes', label: 'Devis', icon: FileText },
          { id: 'orders', label: 'Commandes', icon: Package },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div className="space-y-4">
              {partners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucun partenaire</div>
              ) : (
                partners.map((partner) => (
                  <div key={partner.partner_id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{partner.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{partner.contact_name} • {partner.email}</p>
                        <p className="text-sm text-muted-foreground">{partner.phone}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                            partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {partner.status}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {partner.business_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {partner.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePartner(partner.partner_id, { status: 'approved', is_active: true })}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updatePartner(partner.partner_id, { status: 'rejected', is_active: false })}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {partner.is_active && (
                          <button
                            onClick={() => updatePartner(partner.partner_id, { is_active: false })}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            Désactiver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {quotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucun devis</div>
              ) : (
                quotes.map((quote) => (
                  <div key={quote.quote_id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{quote.quote_id}</h3>
                        <p className="text-sm text-muted-foreground">{quote.company_name}</p>
                        <p className="text-sm">{quote.items?.length || 0} articles • Estimé: {formatPrice(quote.subtotal)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          quote.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          quote.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                          quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedItem(quote)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {quote.status === 'pending' && (
                          <button
                            onClick={() => updateQuote(quote.quote_id, { 
                              status: 'quoted',
                              final_total: quote.subtotal,
                              valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            })}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          >
                            Envoyer devis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucune commande B2B</div>
              ) : (
                orders.map((order) => (
                  <div key={order.order_id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{order.order_id}</h3>
                        <p className="text-sm text-muted-foreground">{order.company_name}</p>
                        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Quote Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Modifier le devis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prix final (FCFA)</label>
                <input
                  type="number"
                  defaultValue={selectedItem.final_total || selectedItem.subtotal}
                  className="w-full px-3 py-2 border rounded-lg"
                  id="final_total"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frais de livraison</label>
                <input
                  type="number"
                  defaultValue={selectedItem.shipping_estimate || 0}
                  className="w-full px-3 py-2 border rounded-lg"
                  id="shipping_estimate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes admin</label>
                <textarea
                  defaultValue={selectedItem.admin_notes || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  id="admin_notes"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  updateQuote(selectedItem.quote_id, {
                    final_total: parseInt(document.getElementById('final_total').value),
                    shipping_estimate: parseInt(document.getElementById('shipping_estimate').value),
                    admin_notes: document.getElementById('admin_notes').value,
                    status: 'quoted',
                    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  });
                }}
                className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
