import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Trophy, Truck, Percent, Loader2, PartyPopper, Timer, Play, Square } from "lucide-react";
import axios from "axios";
import { cn } from "../lib/utils";
import confetti from 'canvas-confetti';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Wheel segments configuration
const WHEEL_SEGMENTS = [
  { type: "discount_5", label: "-5%", color: "#2DD4BF", textColor: "#000" },
  { type: "discount_10", label: "-10%", color: "#8B5CF6", textColor: "#fff" },
  { type: "free_shipping", label: "Livraison\nGratuite", color: "#F472B6", textColor: "#000" },
  { type: "discount_5", label: "-5%", color: "#FBBF24", textColor: "#000" },
  { type: "discount_20", label: "-20%", color: "#F97316", textColor: "#fff" },
  { type: "discount_5", label: "-5%", color: "#60A5FA", textColor: "#000" },
  { type: "discount_15", label: "-15%", color: "#EC4899", textColor: "#fff" },
  { type: "discount_10", label: "-10%", color: "#34D399", textColor: "#000" },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const TARGET_TIME = 10.00;
const TOLERANCE = 0.15; // +/- 0.15 seconds tolerance for winning

// Chrono Game Component
function ChronoGame({ onWin, onLose }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [result, setResult] = useState(null); // 'win' | 'lose' | null
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Very fast chrono - updates every 10ms for smooth display
  const startChrono = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setHasStarted(true);
    setResult(null);
    startTimeRef.current = Date.now() - (time * 1000);
    
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTime(elapsed);
      
      // Auto-stop at 20 seconds (lose condition)
      if (elapsed >= 20) {
        stopChrono(elapsed);
      }
    }, 10); // Update every 10ms for fast movement
  }, [isRunning, time]);

  const stopChrono = useCallback((finalTime = null) => {
    if (!isRunning) return;
    
    clearInterval(intervalRef.current);
    setIsRunning(false);
    
    const stoppedTime = finalTime || time;
    const diff = Math.abs(stoppedTime - TARGET_TIME);
    
    if (diff <= TOLERANCE) {
      setResult('win');
      // Celebration effect
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
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

  // Format time display (00.00)
  const formatTime = (t) => {
    const seconds = Math.floor(t);
    const hundredths = Math.floor((t % 1) * 100);
    return `${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  // Color based on proximity to target
  const getTimeColor = () => {
    if (!hasStarted) return "text-gray-400";
    if (result === 'win') return "text-green-500";
    if (result === 'lose') return "text-red-500";
    
    const diff = Math.abs(time - TARGET_TIME);
    if (diff <= 0.5) return "text-green-500";
    if (diff <= 1) return "text-yellow-500";
    if (diff <= 2) return "text-orange-500";
    return "text-foreground";
  };

  return (
    <div className="flex flex-col items-center py-4">
      {/* Target indicator */}
      <div className="mb-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Objectif</p>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full font-mono font-bold text-2xl">
          {TARGET_TIME.toFixed(2)}
        </div>
      </div>

      {/* Chrono display */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-3xl blur-xl transition-all duration-300",
          isRunning ? "bg-orange-500/50 animate-pulse" : "bg-gray-500/20"
        )} />
        
        {/* Main display */}
        <div className={cn(
          "relative bg-black dark:bg-gray-900 rounded-3xl px-8 py-6 border-4 transition-all duration-300",
          isRunning ? "border-orange-500" : result === 'win' ? "border-green-500" : result === 'lose' ? "border-red-500" : "border-gray-700"
        )}>
          <div className={cn(
            "font-mono text-6xl sm:text-7xl font-black tracking-wider transition-colors duration-200",
            getTimeColor()
          )}>
            {formatTime(time)}
          </div>
          
          {/* Running indicator */}
          {isRunning && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Result message */}
      {result && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "mb-4 px-6 py-3 rounded-xl font-bold text-lg",
            result === 'win' 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          )}
        >
          {result === 'win' ? (
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5" /> BRAVO ! Vous avez gagné un tour de roue !
            </span>
          ) : (
            <span>
              Raté ! Vous avez fait {formatTime(time)} 
              {time < TARGET_TIME ? " (trop tôt)" : " (trop tard)"}
            </span>
          )}
        </motion.div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3">
        {!hasStarted ? (
          <button
            onClick={startChrono}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6" fill="white" />
            DÉMARRER
          </button>
        ) : isRunning ? (
          <button
            onClick={() => stopChrono()}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 animate-pulse"
          >
            <Square className="w-6 h-6" fill="white" />
            STOP !
          </button>
        ) : result === 'lose' ? (
          <button
            onClick={resetChrono}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-bold text-lg hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
          >
            Réessayer
          </button>
        ) : null}
      </div>

      {/* Instructions */}
      {!hasStarted && (
        <p className="mt-4 text-center text-muted-foreground text-sm max-w-xs">
          Appuyez sur <strong>DÉMARRER</strong> puis sur <strong>STOP</strong> quand le chrono affiche exactement <strong>10.00</strong> !
        </p>
      )}
      
      {isRunning && (
        <p className="mt-4 text-center text-orange-500 font-semibold animate-pulse">
          Arrêtez le chrono sur 10.00 !
        </p>
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
    <div className="relative w-56 h-56 sm:w-72 sm:h-72">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
      
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
        <div className="w-0 h-0 border-l-[12px] sm:border-l-[18px] border-r-[12px] sm:border-r-[18px] border-t-[20px] sm:border-t-[30px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg" />
      </div>
      
      <motion.div
        className="relative w-full h-full rounded-full border-4 sm:border-8 border-white dark:border-gray-800 overflow-hidden shadow-2xl"
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
                  stroke="#333"
                  strokeWidth="0.5"
                />
                <text
                  x={textX}
                  y={textY}
                  fill={segment.textColor}
                  fontSize="6"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                >
                  {segment.label.split('\n').map((line, i) => (
                    <tspan key={i} x={textX} dy={i === 0 ? 0 : 7}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <circle cx="50" cy="50" r="8" fill="#000" />
          <text x="50" y="50" fill="#fff" fontSize="3" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
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
  const [step, setStep] = useState("form"); // form, chrono, wheel, result
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
    // Player stopped on 10.00 - give them a wheel spin
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
      // Max attempts reached - game over
      setStep("gameover");
    }
  };

  const handleSpinComplete = () => {
    setLoading(false);
    setStep("result");
    
    if (result?.prize_type === "discount_20" || result?.prize_type === "discount_15") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
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

  const handleRetry = () => {
    setStep("chrono");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white p-4 sm:p-6 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full blur-xl" />
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl" />
            </div>
            
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Timer className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">JEU DU CHRONO</h2>
              <p className="text-white/90 text-sm mt-1 font-medium">
                Arrêtez le chrono sur 10.00 et gagnez !
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {step === "form" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-3">
                    <Timer className="w-4 h-4" />
                    Jeu de réflexe
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Inscrivez-vous et testez vos réflexes !<br/>
                    Arrêtez le chrono pile sur <strong>10.00</strong> pour gagner un tour de roue !
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nom (optionnel)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  onClick={handleStartGame}
                  className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Timer className="w-6 h-6" />
                  JOUER MAINTENANT !
                </button>

                {/* Rules */}
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <p className="text-xs text-center font-semibold text-foreground mb-3">📋 Règles du jeu</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>1. Appuyez sur <strong>DÉMARRER</strong> pour lancer le chrono</p>
                    <p>2. Appuyez sur <strong>STOP</strong> quand vous voyez <strong>10.00</strong></p>
                    <p>3. Si vous êtes proche (±0.15s), vous gagnez un tour de roue !</p>
                    <p>4. La roue vous offre des réductions ou la livraison gratuite</p>
                  </div>
                </div>
              </div>
            )}

            {step === "chrono" && (
              <div>
                {chronoAttempts > 0 && chronoAttempts < MAX_ATTEMPTS && (
                  <div className="mb-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      Tentative {chronoAttempts + 1}/{MAX_ATTEMPTS}
                    </span>
                  </div>
                )}
                <ChronoGame 
                  onWin={handleChronoWin}
                  onLose={handleChronoLose}
                />
              </div>
            )}

            {step === "gameover" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Timer className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Dommage !</h3>
                <p className="text-muted-foreground mb-6">
                  Vous avez utilisé vos {MAX_ATTEMPTS} tentatives.<br/>
                  Revenez demain pour réessayer !
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold"
                >
                  Fermer
                </button>
              </div>
            )}

            {step === "wheel" && (
              <div className="flex flex-col items-center py-4">
                <div className="mb-4 text-center">
                  <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-bold">
                    🎉 Bravo ! Vous avez débloqué la roue !
                  </span>
                </div>
                <SpinWheel
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  prizeIndex={prizeIndex}
                  onSpinComplete={handleSpinComplete}
                />
                <p className="mt-4 text-muted-foreground animate-pulse">
                  La roue tourne...
                </p>
              </div>
            )}

            {step === "result" && result && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {result.prize_type === "discount_20" ? (
                    <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
                      <Trophy className="w-10 h-10 text-amber-600" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center mb-4">
                      <PartyPopper className="w-10 h-10 text-violet-600" />
                    </div>
                  )}
                </motion.div>

                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  {result.prize_type === "discount_20" ? "🎉 JACKPOT !" : "Félicitations !"}
                </h3>
                
                <p className="text-base mb-4">{result.message}</p>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Votre code promo</p>
                  <p className="text-2xl font-mono font-bold tracking-wider">
                    {result.prize_code}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Utilisez ce code lors de votre prochaine commande
                </p>

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  Utiliser maintenant
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
