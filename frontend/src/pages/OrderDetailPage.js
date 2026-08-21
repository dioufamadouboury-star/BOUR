import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  ChevronLeft,
  Package,
  FileText,
  MapPin,
  CreditCard,
  Phone,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { formatPrice, formatDate, getOrderStatusDisplay } from "../lib/utils";
import OrderTimeline from "../components/OrderTimeline";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [switchingToCOD, setSwitchingToCOD] = useState(false);

  // Check for payment result from URL params
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    if (paymentResult === "success") {
      toast.success("Paiement effectué avec succès !");
    } else if (paymentResult === "cancelled") {
      toast.info("Paiement annulé. Vous pouvez réessayer ou choisir le paiement à la livraison.");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Try to fetch order - works with or without auth for order tracking
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, config);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
        if (error.response?.status === 404) {
          setError("Commande non trouvée");
        } else if (error.response?.status === 401) {
          // If unauthorized and not logged in, redirect to login
          if (!isAuthenticated) {
            navigate("/login", { state: { from: `/order/${orderId}` } });
            return;
          }
          setError("Vous n&apos;avez pas accès à cette commande");
        } else {
          setError("Erreur lors du chargement de la commande");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, token, navigate]);

  // Check if order can be cancelled
  const canCancel = order && ["pending", "confirmed"].includes(order.order_status);
  
  // Check if payment can be retried or switched to COD
  const canRetryPayment = order && ["pending", "failed", "awaiting_payment"].includes(order.payment_status);

  // Handle retry payment
  const handleRetryPayment = async () => {
    setRetryingPayment(true);
    try {
      const response = await axios.post(`${API_URL}/api/payments/paydunya/retry/${orderId}`, {
        success_url: `${window.location.origin}/order/${orderId}?payment=success`,
        cancel_url: `${window.location.origin}/order/${orderId}?payment=cancelled`
      });
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast.error("Erreur lors de l&apos;initialisation du paiement");
      }
    } catch (error) {
      console.error("Error retrying payment:", error);
      toast.error(error.response?.data?.detail || "Erreur lors du paiement");
    } finally {
      setRetryingPayment(false);
    }
  };

  // Handle switch to Cash on Delivery
  const handleSwitchToCOD = async () => {
    setSwitchingToCOD(true);
    try {
      await axios.post(`${API_URL}/api/payments/paydunya/switch-to-cod/${orderId}`);
      toast.success("Commande confirmée ! Vous paierez à la livraison.");
      
      // Refresh order data
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, config);
      setOrder(response.data);
    } catch (error) {
      console.error("Error switching to COD:", error);
      toast.error(error.response?.data?.detail || "Erreur lors du changement");
    } finally {
      setSwitchingToCOD(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Veuillez indiquer la raison de l&apos;annulation");
      return;
    }

    setCancelling(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(
        `${API_URL}/api/orders/${orderId}/cancel`,
        { 
          reason: cancelReason,
          email: order.shipping?.email 
        },
        config
      );
      
      toast.success("Votre commande a été annulée avec succès");
      setShowCancelModal(false);
      
      // Refresh order data
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, config);
      setOrder(response.data);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de l&apos;annulation");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-20 bg-[#F5F5F7] dark:bg-[#0B0B0B]">
        <div className="container-lumina py-12">
          <div className="h-8 w-32 rounded skeleton mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl skeleton" />
              <div className="h-48 rounded-2xl skeleton" />
            </div>
            <div className="h-96 rounded-2xl skeleton" />
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-4">{error || "Commande non trouvée"}</h1>
          <Link to="/" className="btn-primary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const status = getOrderStatusDisplay(order.order_status);

  return (
    <main className="min-h-screen pt-20 bg-[#F5F5F7] dark:bg-[#0B0B0B]" data-testid="order-detail-page">
      {/* Header */}
      <section className="py-8 bg-white dark:bg-[#1C1C1E]">
        <div className="container-lumina">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux commandes
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Commande {order.order_id}</h1>
              <p className="text-muted-foreground">
                Passée le {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("badge-lumina", status.class)}>
                {status.label}
              </span>
              <a
                href={`${API_URL}/api/orders/${order.order_id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <FileText className="w-4 h-4" />
                Facture
              </a>
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  data-testid="cancel-order-btn"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="cancel-modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full shadow-xl"
            data-testid="cancel-modal"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" data-testid="cancel-modal-title">Annuler la commande ?</h3>
                <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Raison de l&apos;annulation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent"
                data-testid="cancel-reason-select"
              >
                <option value="">Sélectionnez une raison</option>
                <option value="Changement d&apos;avis">Changement d&apos;avis</option>
                <option value="Délai de livraison trop long">Délai de livraison trop long</option>
                <option value="Commande en double">Commande en double</option>
                <option value="Prix trouvé ailleurs moins cher">Prix trouvé ailleurs moins cher</option>
                <option value="Erreur de commande">Erreur de commande</option>
                <option value="Autre raison">Autre raison</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-black/10 dark:border-white/10 font-medium hover:bg-black/5 dark:hover:bg-white/5"
                data-testid="cancel-modal-keep-btn"
              >
                Non, garder
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="cancel-modal-confirm-btn"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Annulation...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Oui, annuler
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <section className="py-8">
        <div className="container-lumina">
          {/* Payment Pending Alert - Show for failed/pending payments */}
          {canRetryPayment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6"
              data-testid="payment-pending-alert"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                      Paiement en attente
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Votre commande n&apos;a pas encore été payée. Vous pouvez réessayer le paiement en ligne ou choisir de payer à la livraison.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 ml-0 md:ml-4">
                  <button
                    onClick={handleRetryPayment}
                    disabled={retryingPayment}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    data-testid="retry-payment-btn"
                  >
                    {retryingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Réessayer le paiement
                  </button>
                  
                  <button
                    onClick={handleSwitchToCOD}
                    disabled={switchingToCOD}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-xl font-medium hover:bg-orange-50 dark:hover:bg-orange-900/30 disabled:opacity-50 transition-colors"
                    data-testid="switch-to-cod-btn"
                  >
                    {switchingToCOD ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    Payer à la livraison
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Success Alert - Show when switched to COD */}
          {order.switched_to_cod && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-200">
                    Commande confirmée !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Vous avez choisi de payer à la livraison. Notre équipe vous contactera pour confirmer la livraison.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <OrderTimeline 
                  currentStatus={order.order_status}
                  statusHistory={order.status_history || []}
                  createdAt={order.created_at}
                />
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Articles ({order.items.length})
                </h3>
                
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-4 border-b border-black/5 dark:border-white/5 last:border-0"
                    >
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shipping Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </h3>
                
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.shipping?.full_name}</p>
                  <p className="text-muted-foreground">{order.shipping?.address}</p>
                  <p className="text-muted-foreground">
                    {order.shipping?.city}, {order.shipping?.region}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground mt-3">
                    <Phone className="w-4 h-4" />
                    {order.shipping?.phone}
                  </p>
                </div>
              </motion.div>

              {/* Payment Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiement
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Méthode</span>
                    <span className="font-medium capitalize">
                      {order.payment_method === "cash" ? "À la livraison" : order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <span className={cn(
                      "font-medium",
                      order.payment_status === "paid" ? "text-green-600" : 
                      order.payment_status === "cod_pending" ? "text-blue-600" :
                      order.payment_status === "failed" ? "text-red-600" :
                      "text-orange-500"
                    )}>
                      {order.payment_status === "paid" ? "Payé" : 
                       order.payment_status === "cod_pending" ? "À la livraison" :
                       order.payment_status === "failed" ? "Échoué" :
                       "En attente"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4">Récapitulatif</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{formatPrice(order.shipping_cost)}</span>
                  </div>
                  <div className="border-t border-black/10 dark:border-white/10 pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-lg">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Contact Support */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Besoin d&apos;aide ?</p>
                <a
                  href="https://wa.me/221783827575"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] font-medium text-sm hover:underline"
                >
                  Contactez-nous sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
