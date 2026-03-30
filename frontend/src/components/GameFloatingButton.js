import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Sparkles } from "lucide-react";
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

  // Don't show if game is not active
  if (!gameConfig?.active) return null;

  return (
    <>
      {/* Floating Button - Orange/Pink gradient for chrono game */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsGameOpen(true);
          setShowPulse(false);
        }}
        className="fixed bottom-24 right-6 z-[80] w-16 h-16 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 hover:from-orange-400 hover:via-pink-400 hover:to-purple-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300"
        style={{
          boxShadow: "0 4px 20px rgba(249, 115, 22, 0.5)"
        }}
        aria-label="Jouer au chrono"
        data-testid="game-floating-button"
      >
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 animate-ping opacity-50" />
        )}
        <Timer className="w-7 h-7 relative z-10" />
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
      </motion.button>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-[7.5rem] right-24 z-[80] hidden md:block"
      >
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          ⏱️ Arrêtez le chrono !
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
