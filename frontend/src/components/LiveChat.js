import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mail,
  Clock,
  ChevronRight,
  Smile,
  Paperclip,
  Bot,
  User
} from "lucide-react";
import { cn } from "../lib/utils";

const WHATSAPP_NUMBER = "221783827575";

// Quick replies for common questions
const QUICK_REPLIES = [
  { id: 1, text: "Suivi de commande", icon: "📦" },
  { id: 2, text: "Délai de livraison", icon: "🚚" },
  { id: 3, text: "Moyens de paiement", icon: "💳" },
  { id: 4, text: "Retour produit", icon: "↩️" },
  { id: 5, text: "Parler à un conseiller", icon: "👤" },
];

// Auto-responses for common questions
const AUTO_RESPONSES = {
  "suivi": "Pour suivre votre commande, rendez-vous dans 'Mon compte' > 'Mes commandes' ou utilisez notre page de suivi avec votre numéro de commande.",
  "livraison": "🚚 Délais de livraison :\n• Dakar : 24-48h\n• Régions : 3-5 jours\n\nLivraison gratuite dès 50 000 FCFA d'achat !",
  "paiement": "💳 Moyens de paiement acceptés :\n• Wave\n• Orange Money\n• Free Money\n• Carte bancaire\n• Paiement à la livraison (Dakar)",
  "retour": "↩️ Politique de retour :\n• 7 jours pour changer d'avis\n• Produit non utilisé, emballage intact\n• Contactez-nous pour organiser le retour",
};

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Bonjour ! 👋 Je suis l'assistant YAMA+. Comment puis-je vous aider ?",
      time: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (text = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: text.trim(),
      time: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setShowQuickReplies(false);

    // Check for auto-response
    const lowerText = text.toLowerCase();
    let autoResponse = null;

    if (lowerText.includes("suivi") || lowerText.includes("commande")) {
      autoResponse = AUTO_RESPONSES.suivi;
    } else if (lowerText.includes("livraison") || lowerText.includes("délai")) {
      autoResponse = AUTO_RESPONSES.livraison;
    } else if (lowerText.includes("paiement") || lowerText.includes("payer")) {
      autoResponse = AUTO_RESPONSES.paiement;
    } else if (lowerText.includes("retour") || lowerText.includes("rembours")) {
      autoResponse = AUTO_RESPONSES.retour;
    } else if (lowerText.includes("conseiller") || lowerText.includes("humain") || lowerText.includes("parler")) {
      autoResponse = "Je vous mets en relation avec un conseiller. Cliquez ci-dessous pour nous contacter sur WhatsApp 👇";
    }

    // Simulate typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      if (autoResponse) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: "bot",
          text: autoResponse,
          time: new Date()
        }]);

        // If asking for human, show WhatsApp button
        if (lowerText.includes("conseiller") || lowerText.includes("humain") || lowerText.includes("parler")) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now() + 2,
              type: "action",
              action: "whatsapp",
              time: new Date()
            }]);
          }, 500);
        }
      } else {
        // Default response for unknown questions
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: "bot",
          text: "Je ne suis pas sûr de comprendre votre question. Souhaitez-vous parler à un conseiller ?",
          time: new Date()
        }, {
          id: Date.now() + 2,
          type: "action",
          action: "whatsapp",
          time: new Date()
        }]);
      }
    }, 1000 + Math.random() * 500);
  };

  const handleQuickReply = (reply) => {
    if (reply.text === "Parler à un conseiller") {
      handleSend("Je souhaite parler à un conseiller");
    } else {
      handleSend(reply.text);
    }
  };

  const openWhatsApp = () => {
    const lastUserMessage = messages.filter(m => m.type === "user").pop();
    const text = lastUserMessage 
      ? `Bonjour, j'ai une question : ${lastUserMessage.text}`
      : "Bonjour, j'ai besoin d'aide";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          isOpen ? "scale-0" : "scale-100",
          "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)" }}
      >
        <MessageCircle className="w-6 h-6" />
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-48px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10"
            style={{ maxHeight: "calc(100vh - 100px)" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assistant YAMA+</h3>
                    <p className="text-xs text-blue-100 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      En ligne
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === "bot" && (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%]">
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1">{formatTime(message.time)}</p>
                      </div>
                    </div>
                  )}

                  {message.type === "user" && (
                    <div className="flex gap-2 justify-end">
                      <div className="flex-1 flex flex-col items-end">
                        <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 mr-1">{formatTime(message.time)}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {message.type === "action" && message.action === "whatsapp" && (
                    <div className="flex justify-center">
                      <button
                        onClick={openWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Contacter sur WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickReplies && (
              <div className="p-3 border-t border-black/5 dark:border-white/5 bg-white dark:bg-gray-900">
                <p className="text-xs text-muted-foreground mb-2">Questions fréquentes</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>{reply.icon}</span>
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-black/5 dark:border-white/5 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Réponse automatique • <button onClick={openWhatsApp} className="text-green-600 hover:underline">WhatsApp</button> pour un conseiller
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
