import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Trophy, Truck, Loader2, PartyPopper, Play, Square, Zap, Star } from "lucide-react";
import axios from "axios";
import { cn } from "../lib/utils";
import confetti from 'canvas-confetti';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Wheel segments configuration
const WHEEL_SEGMENTS = [
  { type: "discount_5", label: "-5%", color: "#10B981", textColor: "#fff" },
  { type: "discount_10", label: "-10%", color: "#8B5CF6", textColor: "#fff" },
  { type: "free_shipping", label: "Livraison\nGratuite", color: "#EC4899", textColor: "#fff" },
  { type: "discount_5", label: "-5%", color: "#F59E0B", textColor: "#fff" },
  { type: "discount_20", label: "-20%", color: "#EF4444", textColor: "#fff" },
  { type: "discount_5", label: "-5%", color: "#3B82F6", textColor: "#fff" },
  { type: "discount_15", label: "-15%", color: "#F97316", textColor: "#fff" },
  { type: "discount_10", label: "-10%", color: "#14B8A6", textColor: "#fff" },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const TARGET_TIME = 10.00;
const TOLERANCE = 0.15;

// Premium Chrono Game Component
function ChronoGame({ onWin, onLose, attempts, maxAttempts }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const startChrono = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setHasStarted(true);
    setResult(null);
    startTimeRef.current = Date.now() - (time * 1000);
    
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTime(elapsed);
      
      if (elapsed >= 20) {
        stopChrono(elapsed);
      }
    }, 10);
  }, [isRunning, time]);

  const stopChrono = useCallback((finalTime = null) => {
    if (!isRunning) return;
    
    clearInterval(intervalRef.current);
    setIsRunning(false);
    
    const stoppedTime = finalTime || time;
    const diff = Math.abs(stoppedTime - TARGET_TIME);
    
    if (diff <= TOLERANCE) {
      setResult('win');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4']
      });
      setTimeout(() => onWin(), 1500);
    } else {
      setResult('lose');
      setTimeout(() => onLose(stoppedTime), 1500);
    }
  }, [isRunning, time, onWin, onLose]);

  const resetChrono = () => {
    clearInterval(intervalRef.current);
    setTime(0);
    setIsRunning(false);
    setHasStarted(false);
    setResult(null);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const formatTime = (t) => {
    const seconds = Math.floor(t);
    const hundredths = Math.floor((t % 1) * 100);
    return `${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!hasStarted) return "text-white/50";
    if (result === 'win') return "text-emerald-400";
    if (result === 'lose') return "text-red-400";
    
    const diff = Math.abs(time - TARGET_TIME);
    if (diff <= 0.5) return "text-emerald-400";
    if (diff <= 1) return "text-yellow-400";
    if (diff <= 2) return "text-orange-400";
    return "text-white";
  };

  const getBorderColor = () => {
    if (!hasStarted) return "border-white/20";
    if (result === 'win') return "border-emerald-500";
    if (result === 'lose') return "border-red-500";
    if (isRunning) return "border-amber-500";
    return "border-white/20";
  };

  return (
    <div className="flex flex-col items-center py-6">
      {/* Attempts indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[...Array(maxAttempts)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              i < attempts 
                ? "bg-red-500/50" 
                : "bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
            )}
          />
        ))}
        <span className="text-xs text-white/60 ml-2">
          {maxAttempts - attempts} essai{maxAttempts - attempts > 1 ? 's' : ''} restant{maxAttempts - attempts > 1 ? 's' : ''}
        </span>
      </div>

      {/* Target */}
      <motion.div 
        className="mb-6"
        animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0 }}
      >
        <div className="text-center">
          <span className="text-white/60 text-sm font-medium">OBJECTIF</span>
          <div className="mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-2xl font-mono font-black text-3xl shadow-lg shadow-emerald-500/30">
            {TARGET_TIME.toFixed(2)}
          </div>
        </div>
      </motion.div>

      {/* Chrono Display */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <motion.div 
          className={cn(
            "absolute -inset-4 rounded-3xl blur-2xl transition-all duration-500",
            isRunning ? "bg-amber-500/40" : result === 'win' ? "bg-emerald-500/40" : result === 'lose' ? "bg-red-500/40" : "bg-white/5"
          )}
          animate={isRunning ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        
        {/* Main display */}
        <motion.div 
          className={cn(
            "relative bg-gradient-to-br from-gray-900 to-black rounded-3xl px-10 py-8 border-4 transition-all duration-300 shadow-2xl",
            getBorderColor()
          )}
          animate={isRunning ? { boxShadow: ["0 0 30px rgba(251, 146, 60, 0.3)", "0 0 60px rgba(251, 146, 60, 0.5)", "0 0 30px rgba(251, 146, 60, 0.3)"] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {/* LED dots decoration */}
          <div className="absolute top-3 left-3 flex gap-1">
            <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-red-500 animate-pulse" : "bg-red-900")} />
            <div className={cn("w-2 h-2 rounded-full", hasStarted ? "bg-green-500" : "bg-green-900")} />
          </div>
          
          <motion.div 
            className={cn(
              "font-mono text-6xl sm:text-7xl font-black tracking-wider transition-colors duration-200",
              getTimeColor()
            )}
            style={{ textShadow: isRunning ? "0 0 20px currentColor" : "none" }}
          >
            {formatTime(time)}
          </motion.div>
          
          {/* Scanning line effect when running */}
          {isRunning && (
            <motion.div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>

      {/* Result message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
              "mb-6 px-6 py-4 rounded-2xl font-bold text-lg flex items-center gap-3",
              result === 'win' 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30" 
                : "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
            )}
          >
            {result === 'win' ? (
              <>
                <Trophy className="w-6 h-6" />
                <span>BRAVO ! Vous avez gagné !</span>
              </>
            ) : (
              <span>
                {time < TARGET_TIME ? `Trop tôt ! (${formatTime(time)})` : `Trop tard ! (${formatTime(time)})`}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <div className="flex gap-4">
        {!hasStarted ? (
          <motion.button
            onClick={startChrono}
            className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-emerald-500/30 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <Play className="w-7 h-7 relative z-10" fill="white" />
            <span className="relative z-10">DÉMARRER</span>
          </motion.button>
        ) : isRunning ? (
          <motion.button
            onClick={() => stopChrono()}
            className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-red-500/30 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: ["0 10px 40px rgba(239, 68, 68, 0.4)", "0 10px 60px rgba(239, 68, 68, 0.6)", "0 10px 40px rgba(239, 68, 68, 0.4)"]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Square className="w-7 h-7 relative z-10" fill="white" />
            <span className="relative z-10">STOP !</span>
          </motion.button>
        ) : result === 'lose' ? (
          <motion.button
            onClick={resetChrono}
            className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-violet-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-6 h-6" />
            Réessayer
          </motion.button>
        ) : null}
      </div>

      {/* Instructions */}
      {!hasStarted && (
        <motion.p 
          className="mt-6 text-center text-white/60 text-sm max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Appuyez sur <span className="text-emerald-400 font-semibold">DÉMARRER</span> puis sur <span className="text-red-400 font-semibold">STOP</span> pile sur <span className="text-amber-400 font-bold">10.00</span>
        </motion.p>
      )}
      
      {isRunning && (
        <motion.p 
          className="mt-6 text-amber-400 font-bold text-lg"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          Appuyez sur STOP !
        </motion.p>
      )}
    </div>
  );
}

// Spin Wheel Component
function SpinWheel({ onSpinComplete, isSpinning, setIsSpinning, prizeIndex }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning && prizeIndex !== null) {
      const baseRotations = 5;
      const targetAngle = 360 - (prizeIndex * SEGMENT_ANGLE) - (SEGMENT_ANGLE / 2);
      const totalRotation = (baseRotations * 360) + targetAngle + Math.random() * 20 - 10;
      
      setRotation(prev => prev + totalRotation);
      
      setTimeout(() => {
        setIsSpinning(false);
        onSpinComplete();
      }, 5000);
    }
  }, [isSpinning, prizeIndex]);

  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80">
      {/* Outer glow */}
      <motion.div 
        className="absolute -inset-4 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-60"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
        <div className="w-0 h-0 border-l-[16px] sm:border-l-[20px] border-r-[16px] sm:border-r-[20px] border-t-[28px] sm:border-t-[35px] border-l-transparent border-r-transparent border-t-amber-500 drop-shadow-xl" 
          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
        />
      </div>
      
      {/* Wheel */}
      <motion.div
        className="relative w-full h-full rounded-full border-8 border-white shadow-2xl overflow-hidden"
        style={{
          rotate: rotation,
          transition: isSpinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {WHEEL_SEGMENTS.map((segment, index) => {
            const startAngle = index * SEGMENT_ANGLE;
            const endAngle = startAngle + SEGMENT_ANGLE;
            
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 50 + 50 * Math.cos(startRad);
            const y1 = 50 + 50 * Math.sin(startRad);
            const x2 = 50 + 50 * Math.cos(endRad);
            const y2 = 50 + 50 * Math.sin(endRad);
            
            const textAngle = startAngle + SEGMENT_ANGLE / 2;
            const textRad = (textAngle - 90) * Math.PI / 180;
            const textX = 50 + 32 * Math.cos(textRad);
            const textY = 50 + 32 * Math.sin(textRad);
            
            return (
              <g key={index}>
                <path
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  stroke="#1f2937"
                  strokeWidth="0.5"
                />
                <text
                  x={textX}
                  y={textY}
                  fill={segment.textColor}
                  fontSize="5.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {segment.label.split('\n').map((line, i) => (
                    <tspan key={i} x={textX} dy={i === 0 ? 0 : 6}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
          {/* Center */}
          <circle cx="50" cy="50" r="10" fill="#1f2937" />
          <circle cx="50" cy="50" r="8" fill="#f59e0b" />
          <text x="50" y="50" fill="#1f2937" fontSize="3" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
            YAMA+
          </text>
        </svg>
      </motion.div>
    </div>
  );
}

export default function SpinWheelGame({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form");
  const [chronoAttempts, setChronoAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleStartGame = () => {
    if (!email) {
      setError("Veuillez entrer votre email");
      return;
    }
    setError("");
    setStep("chrono");
    setChronoAttempts(0);
  };

  const handleChronoWin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/game/spin`, { email, name });
      setResult(response.data);
      
      const prizeType = response.data.prize_type;
      const index = WHEEL_SEGMENTS.findIndex(s => s.type === prizeType);
      setPrizeIndex(index >= 0 ? index : 0);
      
      setStep("wheel");
      setIsSpinning(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
      setStep("form");
    }
    setLoading(false);
  };

  const handleChronoLose = (stoppedTime) => {
    const attempts = chronoAttempts + 1;
    setChronoAttempts(attempts);
    
    if (attempts >= MAX_ATTEMPTS) {
      setStep("gameover");
    }
  };

  const handleSpinComplete = () => {
    setLoading(false);
    setStep("result");
    
    if (result?.prize_type === "discount_20" || result?.prize_type === "discount_15") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A78BFA']
      });
    }
  };

  const handleClose = () => {
    setStep("form");
    setResult(null);
    setEmail("");
    setName("");
    setError("");
    setChronoAttempts(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[95vh] overflow-y-auto border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl" />
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-6 sm:p-8 text-center overflow-hidden">
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{ left: `${15 + i * 15}%`, top: "20%" }}
                  animate={{ 
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ 
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative z-10">
              <motion.div 
                className="flex items-center justify-center gap-3 mb-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-10 h-10 sm:w-12 sm:h-12" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">TENTEZ VOTRE CHANCE</h2>
              <p className="text-white/90 text-sm sm:text-base mt-2 font-medium">
                Gagnez des réductions exclusives !
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-4 sm:p-6">
            {step === "form" && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 px-5 py-2 rounded-full text-sm font-bold mb-4">
                    <Star className="w-4 h-4" />
                    100% Gagnant
                  </div>
                  <p className="text-white/60 text-sm">
                    Arrêtez le chrono sur <span className="text-amber-400 font-bold">10.00</span> pour débloquer la roue !
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="votre@email.com"
                    className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Nom (optionnel)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <motion.p 
                    className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  onClick={handleStartGame}
                  className="w-full py-5 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Gift className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">JOUER MAINTENANT</span>
                </motion.button>

                {/* Prizes preview */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-center font-bold text-white/80 mb-4">Prix à gagner</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["-5%", "-10%", "-15%", "-20%"].map((prize, i) => (
                      <motion.div 
                        key={prize}
                        className={cn(
                          "rounded-xl p-3 text-center",
                          i === 3 
                            ? "bg-gradient-to-br from-amber-500/30 to-red-500/30 border border-amber-500/30" 
                            : "bg-white/5 border border-white/10"
                        )}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className={cn(
                          "text-lg font-black",
                          i === 3 ? "text-amber-400" : "text-white"
                        )}>{prize}</span>
                        {i === 3 && <p className="text-[10px] text-amber-400/80 mt-1">JACKPOT</p>}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Truck className="w-4 h-4 text-pink-400" />
                      <span className="text-sm font-bold text-pink-400">Livraison Gratuite</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "chrono" && (
              <ChronoGame 
                onWin={handleChronoWin}
                onLose={handleChronoLose}
                attempts={chronoAttempts}
                maxAttempts={MAX_ATTEMPTS}
              />
            )}

            {step === "gameover" && (
              <div className="text-center py-10">
                <motion.div 
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mb-6 border border-white/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Gift className="w-12 h-12 text-white/30" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">Dommage !</h3>
                <p className="text-white/60 mb-8">
                  Vous avez utilisé vos {MAX_ATTEMPTS} tentatives.<br/>
                  <span className="text-amber-400">Revenez demain</span> pour réessayer !
                </p>
                <motion.button
                  onClick={handleClose}
                  className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-colors border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Fermer
                </motion.button>
              </div>
            )}

            {step === "wheel" && (
              <div className="flex flex-col items-center py-6">
                <motion.div 
                  className="mb-6 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Bravo ! Tournez la roue !
                  </span>
                </motion.div>
                <SpinWheel
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  prizeIndex={prizeIndex}
                  onSpinComplete={handleSpinComplete}
                />
                <motion.p 
                  className="mt-6 text-amber-400 font-semibold"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  La roue tourne...
                </motion.p>
              </div>
            )}

            {step === "result" && result && (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  {result.prize_type === "discount_20" ? (
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-5 shadow-xl shadow-amber-500/30">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mb-5 shadow-xl shadow-violet-500/30">
                      <PartyPopper className="w-12 h-12 text-white" />
                    </div>
                  )}
                </motion.div>

                <motion.h3 
                  className="text-2xl sm:text-3xl font-black text-white mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {result.prize_type === "discount_20" ? "JACKPOT !" : "Félicitations !"}
                </motion.h3>
                
                <motion.p 
                  className="text-lg text-white/80 mb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {result.message}
                </motion.p>

                <motion.div 
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-2xl p-5 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-white/50 mb-2">Votre code promo</p>
                  <p className="text-3xl font-mono font-black tracking-wider text-amber-400">
                    {result.prize_code}
                  </p>
                </motion.div>

                <p className="text-sm text-white/50 mb-5">
                  Utilisez ce code lors de votre prochaine commande
                </p>

                <motion.button
                  onClick={handleClose}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-xl shadow-orange-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Utiliser maintenant
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
