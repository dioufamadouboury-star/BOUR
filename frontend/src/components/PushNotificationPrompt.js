import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Gift, Zap, Truck, Sparkles } from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    // Don't show on unsupported browsers
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    // Check if already denied
    if (Notification.permission === 'denied') {
      return;
    }

    // Check if already subscribed
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
          return;
        }
      } catch (e) {
        console.error('Error checking subscription:', e);
      }
    }

    // Show prompt after short delay (be more proactive)
    const hasSeenPrompt = localStorage.getItem('push_prompt_seen_v2');
    
    if (!hasSeenPrompt) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        setShowPrompt(false);
        localStorage.setItem('push_prompt_seen_v2', 'true');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      await axios.post(`${API_URL}/api/notifications/subscribe`, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
        }
      });

      setIsSubscribed(true);
      setShowSuccess(true);
      localStorage.setItem('push_prompt_seen_v2', 'true');
      
      // Hide after showing success
      setTimeout(() => {
        setShowPrompt(false);
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_seen_v2', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
        onClick={dismiss}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[80] max-w-md w-full"
        data-testid="push-notification-prompt"
      >
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden">
          {showSuccess ? (
            /* Success State */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <Bell className="w-10 h-10 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Parfait !</h3>
              <p className="text-muted-foreground">
                Vous recevrez nos meilleures offres en exclusivité
              </p>
            </div>
          ) : (
            <>
              {/* Header with animated bell */}
              <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 px-6 py-8 text-white text-center overflow-hidden">
                {/* Animated circles background */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full"
                  />
                </div>
                
                {/* Close button */}
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Animated bell */}
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Bell className="w-8 h-8" />
                  </div>
                </motion.div>
                
                <h2 className="text-2xl font-bold relative z-10">
                  Ne ratez aucune promo !
                </h2>
              </div>

              {/* Benefits */}
              <div className="p-6 space-y-4">
                <p className="text-center text-muted-foreground mb-4">
                  Activez les notifications pour recevoir :
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Ventes Flash</p>
                      <p className="text-xs text-muted-foreground">Jusqu'à -70% en exclusivité</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Codes Promo</p>
                      <p className="text-xs text-muted-foreground">Réductions exclusives abonnés</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Suivi Commandes</p>
                      <p className="text-xs text-muted-foreground">Livraison en temps réel</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={subscribe}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Activation...
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5" />
                        Activer les notifications
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={dismiss}
                    className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    Non merci, peut-être plus tard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
