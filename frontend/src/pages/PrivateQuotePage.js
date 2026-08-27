import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Loader2,
  PenTool,
  MessageCircle,
  Download,
  ChevronRight,
  X,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PrivateQuotePage() {
  const { quoteNumber } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);

  useEffect(() => {
    if (quoteNumber && token) {
      fetchQuote();
    } else {
      setError("Lien invalide");
      setLoading(false);
    }
  }, [quoteNumber, token]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/private-quotes/view/${quoteNumber}?token=${token}`
      );
      setQuote(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setError("Accès non autorisé. Vérifiez votre lien.");
      } else if (error.response?.status === 404) {
        setError("Devis non trouvé.");
      } else {
        setError("Erreur lors du chargement du devis.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Erreur</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = quote.status === "expired";
  const isCancelled = quote.status === "cancelled";
  const isSigned = ["signed", "deposit_paid", "completed"].includes(quote.status);

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b">
        <div className="container-lumina py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              YAMA+
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span>Devis {quoteNumber}</span>
          </nav>
        </div>
      </div>

      <div className="container-lumina py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Status Banner */}
          {isExpired && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400">Ce devis a expiré le {formatDate(quote.expires_at)}</p>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <X className="w-5 h-5 text-red-500" />
              <p className="text-red-600 dark:text-red-400">Ce devis a été annulé</p>
            </div>
          )}

          {isSigned && !quote.deposit_paid_at && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-purple-600 dark:text-purple-400 font-medium">Devis signé !</p>
                <p className="text-sm text-purple-500/80">En attente du paiement de l'acompte. Nous vous contacterons sous peu.</p>
              </div>
            </div>
          )}

          {quote.deposit_paid_at && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-green-600 dark:text-green-400 font-medium">Acompte reçu - Commande confirmée !</p>
                <p className="text-sm text-green-500/80">Nous préparons votre commande. Vous serez contacté pour la suite.</p>
              </div>
            </div>
          )}

          {/* Quote Card */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border overflow-hidden">
            {/* Quote Header */}
            <div className="bg-gradient-to-r from-primary/10 to-amber-500/10 p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FileText className="w-4 h-4" />
                    Devis N° {quote.quote_number}
                  </div>
                  <h1 className="text-2xl font-bold">{quote.title}</h1>
                </div>
                <img
                  src="/assets/images/logo_yama_full.png"
                  alt="YAMA+"
                  className="h-10"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client & Dates */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Client</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {quote.client.name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {quote.client.phone}
                    </p>
                    {quote.client.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {quote.client.email}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Dates</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Créé le {formatDate(quote.created_at)}
                    </p>
                    <p className={`flex items-center gap-2 ${isExpired ? 'text-red-500' : ''}`}>
                      <Clock className="w-4 h-4" />
                      {isExpired ? "Expiré le" : "Valable jusqu'au"} {formatDate(quote.expires_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Détail</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-sm">
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium text-center">Qté</th>
                        <th className="px-4 py-3 font-medium text-right">Prix unit.</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {quote.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPrice(item.quantity * item.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full md:w-72 space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{formatPrice(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">{formatPrice(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 text-green-700 dark:text-green-400">
                    <span className="font-medium">Acompte demandé ({quote.deposit_percentage}%)</span>
                    <span className="font-bold">{formatPrice(quote.deposit_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-muted-foreground">
                    <span>Solde à la livraison</span>
                    <span>{formatPrice(quote.balance_due)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{quote.notes}</p>
                </div>
              )}

              {/* Terms */}
              <div className="text-sm text-muted-foreground">
                <h3 className="font-medium text-foreground mb-2">Conditions</h3>
                <p>{quote.terms}</p>
              </div>

              {/* Signature Section */}
              {isSigned && quote.signature && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-3">Signature électronique</h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={quote.signature.image}
                      alt="Signature"
                      className="h-16 border rounded-lg p-2 bg-white"
                    />
                    <div className="text-sm">
                      <p className="font-medium">{quote.signature.name}</p>
                      <p className="text-muted-foreground">Signé le {formatDate(quote.signed_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isExpired && !isCancelled && !isSigned && (
                <div className="border-t pt-6">
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full py-4 bg-gradient-to-r from-primary to-amber-500 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    <PenTool className="w-5 h-5" />
                    Signer et accepter ce devis
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    En signant, vous acceptez les conditions ci-dessus et vous engagez à payer l'acompte.
                  </p>
                </div>
              )}

              {/* Contact */}
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Des questions ? Contactez-nous par WhatsApp
                </p>
                <a
                  href="https://wa.me/221783827575"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-500 text-green-600 rounded-xl font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors mx-auto w-fit"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp: +221 78 382 75 75
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>GROUPE YAMA+ - Votre partenaire de croissance</p>
            <p className="mt-1">groupeyamaplus.com</p>
          </div>
        </motion.div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <SignatureModal
          quote={quote}
          token={token}
          onClose={() => setShowSignModal(false)}
          onSuccess={() => {
            setShowSignModal(false);
            fetchQuote();
          }}
        />
      )}
    </main>
  );
}

function SignatureModal({ quote, token, onClose, onSuccess }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [name, setName] = useState(quote.client.name);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature) {
      toast.error("Veuillez signer dans le cadre");
      return;
    }
    if (!acceptTerms) {
      toast.error("Veuillez accepter les conditions");
      return;
    }

    setLoading(true);

    try {
      const canvas = canvasRef.current;
      const signatureImage = canvas.toDataURL("image/png");

      await axios.post(
        `${API_URL}/api/private-quotes/sign/${quote.quote_number}?token=${token}`,
        {
          client_signature: signatureImage,
          client_name: name,
          accept_terms: acceptTerms,
        }
      );

      toast.success("Devis signé avec succès !");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la signature");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold">Signer le devis</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Montant total</p>
            <p className="text-2xl font-bold">{formatPrice(quote.subtotal)}</p>
            <p className="text-sm text-green-600 mt-1">
              Acompte à payer: {formatPrice(quote.deposit_amount)}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Votre nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-transparent"
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Votre signature</label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-sm text-primary hover:underline"
              >
                Effacer
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="border-2 border-dashed rounded-xl cursor-crosshair w-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Signez avec votre souris ou votre doigt
            </p>
          </div>

          {/* Accept Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-black/20 dark:border-white/20"
            />
            <span className="text-sm">
              J'accepte les conditions du devis et m'engage à payer l'acompte de{" "}
              <strong>{formatPrice(quote.deposit_amount)}</strong> pour confirmer ma commande.
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !hasSignature || !acceptTerms}
            className="w-full py-4 bg-gradient-to-r from-primary to-amber-500 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signature en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirmer et signer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
