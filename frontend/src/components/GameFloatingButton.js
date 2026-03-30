import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import axios from "axios";
import SpinWheelGame from "./SpinWheelGame";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function GameFloatingButton() {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameConfig, setGameConfig] = useState(null);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/game/config`);
        setGameConfig(response.data);
      } catch (err) {
        console.error("Error fetching game config:", err);
      }
    };
    fetchConfig();
  }, []);

  if (!gameConfig?.active) return null;

  return (
    <>
      {/* Floating Button - Gift icon */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsGameOpen(true);
          setShowPulse(false);
        }}
        className="fixed bottom-24 right-6 z-[80] w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 hover:from-amber-300 hover:via-orange-400 hover:to-red-400 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300"
        style={{
          boxShadow: "0 4px 25px rgba(251, 146, 60, 0.6)"
        }}
        aria-label="Tentez votre chance"
        data-testid="game-floating-button"
      >
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 animate-ping opacity-50" />
        )}
        <Gift className="w-7 h-7 relative z-10" />
        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-200 animate-pulse" />
        
        {/* Rotating stars */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-yellow-200 text-xs">✦</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-yellow-200 text-xs">✦</span>
        </motion.div>
      </motion.button>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-[7.5rem] right-24 z-[80] hidden md:block"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap flex items-center gap-2">
          <span className="animate-bounce">🎁</span>
          Tentez votre chance !
        </div>
      </motion.div>

      {/* Game Modal */}
      <SpinWheelGame 
        isOpen={isGameOpen} 
        onClose={() => setIsGameOpen(false)} 
      />
    </>
  );
}
