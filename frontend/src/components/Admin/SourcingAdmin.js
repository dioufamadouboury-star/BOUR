import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Package, Plane, Ship, Clock, CheckCircle,
  Eye, Edit, TrendingUp, Search, ExternalLink, Send
} from 'lucide-react';
import { formatPrice, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'yellow' },
  { value: 'quoted', label: 'Devis envoyé', color: 'blue' },
  { value: 'deposit_paid', label: 'Acompte payé', color: 'green' },
  { value: 'ordered', label: 'Commandé', color: 'purple' },
  { value: 'in_transit_china', label: 'En transit Chine', color: 'orange' },
  { value: 'arrived_warehouse', label: 'Entrepôt Chine', color: 'cyan' },
  { value: 'shipping_to_senegal', label: 'En route Sénégal', color: 'blue' },
  { value: 'customs', label: 'Douane', color: 'amber' },
  { value: 'delivered', label: 'Livré', color: 'green' },
  { value: 'cancelled', label: 'Annulé', color: 'red' },
];

export default function SourcingAdmin() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [requestsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/sourcing/requests`, { headers }),
        fetch(`${API_URL}/api/admin/sourcing/stats`, { headers })
      ]);

      if (requestsRes.ok) setRequests((await requestsRes.json()).requests || []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (requestId, data) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/sourcing/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Demande mise à jour');
        fetchData();
        setSelectedRequest(null);
      }
    } catch (err) {
      toast.error('Erreur de mise à jour');
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Chine</h1>
          <p className="text-muted-foreground">Gestion des demandes d'import international</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Package className="w-6 h-6 text-red-500 mb-2" />
          <div className="text-2xl font-bold">{stats.total || 0}</div>
          <div className="text-sm text-muted-foreground">Total demandes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Clock className="w-6 h-6 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold">{stats.pending || 0}</div>
          <div className="text-sm text-muted-foreground">En attente</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Send className="w-6 h-6 text-blue-500 mb-2" />
          <div className="text-2xl font-bold">{stats.quoted || 0}</div>
          <div className="text-sm text-muted-foreground">Devis envoyés</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <Plane className="w-6 h-6 text-purple-500 mb-2" />
          <div className="text-2xl font-bold">{stats.in_progress || 0}</div>
          <div className="text-sm text-muted-foreground">En cours</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <div className="text-2xl font-bold">{stats.delivered || 0}</div>
          <div className="text-sm text-muted-foreground">Livrés</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
            filter === 'all' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          Tous ({requests.length})
        </button>
        {STATUS_OPTIONS.slice(0, 6).map((status) => (
          <button
            key={status.value}
            onClick={() => setFilter(status.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              filter === status.value ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {status.label} ({requests.filter(r => r.status === status.value).length})
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucune demande</div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <motion.div
              key={request.request_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold">{request.request_id}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-700`}>
                      {STATUS_OPTIONS.find(s => s.value === request.status)?.label || request.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {request.customer?.name} • {request.customer?.phone}
                  </p>
                  <p className="text-sm mb-2">
                    {request.product?.name || 'Produit'} x{request.product?.quantity}
                  </p>
                  {request.product?.link && (
                    <a
                      href={request.product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir le produit
                    </a>
                  )}
                  {request.pricing?.total && (
                    <p className="text-lg font-bold mt-2">{formatPrice(request.pricing.total)}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full my-8">
            <h3 className="font-bold text-lg mb-4">Modifier {selectedRequest.request_id}</h3>
            
            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="font-medium">{selectedRequest.customer?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest.customer?.phone}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest.customer?.email}</p>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  defaultValue={selectedRequest.status}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
                  id="status"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix produit (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={selectedRequest.pricing?.product_cost || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="product_cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frais transport (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={selectedRequest.pricing?.shipping_cost || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="shipping_cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Commission (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={selectedRequest.pricing?.commission || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="commission"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={selectedRequest.pricing?.total || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="total"
                  />
                </div>
              </div>

              {/* Deposit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Acompte requis (FCFA)</label>
                  <input
                    type="number"
                    defaultValue={selectedRequest.pricing?.deposit_required || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="deposit_required"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRequest.pricing?.deposit_paid}
                      id="deposit_paid"
                      className="rounded"
                    />
                    <span className="text-sm">Acompte payé</span>
                  </label>
                </div>
              </div>

              {/* Tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tracking Chine</label>
                  <input
                    type="text"
                    defaultValue={selectedRequest.tracking?.china_tracking || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="china_tracking"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tracking International</label>
                  <input
                    type="text"
                    defaultValue={selectedRequest.tracking?.international_tracking || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    id="international_tracking"
                  />
                </div>
              </div>

              {/* Actual Weight */}
              <div>
                <label className="block text-sm font-medium mb-1">Poids réel (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedRequest.shipping?.actual_weight_kg || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  id="actual_weight_kg"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes admin</label>
                <textarea
                  defaultValue={selectedRequest.admin_notes || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  id="admin_notes"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const data = {
                    status: document.getElementById('status').value,
                    product_cost: parseInt(document.getElementById('product_cost').value) || null,
                    shipping_cost: parseInt(document.getElementById('shipping_cost').value) || null,
                    commission: parseInt(document.getElementById('commission').value) || null,
                    total: parseInt(document.getElementById('total').value) || null,
                    deposit_required: parseInt(document.getElementById('deposit_required').value) || null,
                    deposit_paid: document.getElementById('deposit_paid').checked,
                    china_tracking: document.getElementById('china_tracking').value || null,
                    international_tracking: document.getElementById('international_tracking').value || null,
                    actual_weight_kg: parseFloat(document.getElementById('actual_weight_kg').value) || null,
                    admin_notes: document.getElementById('admin_notes').value,
                  };
                  updateRequest(selectedRequest.request_id, data);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
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
