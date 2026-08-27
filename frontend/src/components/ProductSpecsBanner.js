import { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Battery,
  Palette,
  HardDrive,
  Cpu,
  Smartphone,
  Thermometer,
  Wind,
  Zap,
  Shield,
  Tv,
  Monitor,
  Wifi,
  Square,
  Car,
  Home,
  Ruler,
} from "lucide-react";

// Icon mapping for different characteristics
const ICON_MAP = {
  // Vehicles
  annee: Calendar,
  année: Calendar,
  year: Calendar,
  kilometrage: Gauge,
  kilométrage: Gauge,
  km: Gauge,
  carburant: Fuel,
  fuel: Fuel,
  transmission: Cog,
  gearbox: Cog,
  // Phones
  stockage: HardDrive,
  storage: HardDrive,
  capacité: HardDrive,
  memoire: Cpu,
  mémoire: Cpu,
  ram: Cpu,
  batterie: Battery,
  battery: Battery,
  etat: Shield,
  état: Shield,
  condition: Shield,
  couleur: Palette,
  color: Palette,
  // Climatiseur
  puissance: Zap,
  power: Zap,
  surface: Square,
  refroidissement: Wind,
  cooling: Wind,
  economie: Zap,
  économie: Zap,
  garantie: Shield,
  warranty: Shield,
  // TV
  dimensions: Ruler,
  taille: Monitor,
  size: Monitor,
  resolution: Tv,
  résolution: Tv,
  smart: Wifi,
  android: Smartphone,
  connectivite: Wifi,
  connectivité: Wifi,
  // Default
  default: Zap,
};

// Get icon component for a characteristic
const getIconForSpec = (key) => {
  const normalizedKey = key.toLowerCase().replace(/[_\s]/g, "");
  for (const [iconKey, IconComponent] of Object.entries(ICON_MAP)) {
    if (normalizedKey.includes(iconKey)) {
      return IconComponent;
    }
  }
  return ICON_MAP.default;
};

// Format the label for display
const formatLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function ProductSpecsBanner({ specs, vehicleSpecs, category }) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();
  
  // Combine specs from different sources based on category
  const getCharacteristics = () => {
    const items = [];
    
    // Vehicle specs (for automobile category)
    if (category === "automobile" && vehicleSpecs) {
      if (vehicleSpecs.annee) items.push({ key: "Année", value: vehicleSpecs.annee, icon: Calendar });
      if (vehicleSpecs.kilometrage) items.push({ key: "Kilométrage", value: vehicleSpecs.kilometrage, icon: Gauge });
      if (vehicleSpecs.carburant) items.push({ key: "Carburant", value: vehicleSpecs.carburant, icon: Fuel });
      if (vehicleSpecs.transmission) items.push({ key: "Transmission", value: vehicleSpecs.transmission, icon: Cog });
      if (vehicleSpecs.puissance) items.push({ key: "Puissance", value: vehicleSpecs.puissance, icon: Zap });
      if (vehicleSpecs.etat) items.push({ key: "État", value: vehicleSpecs.etat, icon: Shield });
      if (vehicleSpecs.places) items.push({ key: "Places", value: vehicleSpecs.places, icon: Car });
      if (vehicleSpecs.couleur) items.push({ key: "Couleur", value: vehicleSpecs.couleur, icon: Palette });
    }
    
    // Product specs (general)
    if (specs && typeof specs === "object") {
      Object.entries(specs).forEach(([key, value]) => {
        if (value && value !== "" && value !== "Non" && !key.startsWith("_")) {
          const Icon = getIconForSpec(key);
          // Format boolean values
          const displayValue = value === "Oui" || value === true ? "Oui" : value;
          items.push({
            key: formatLabel(key),
            value: displayValue,
            icon: Icon,
          });
        }
      });
    }
    
    return items;
  };

  const characteristics = getCharacteristics();
  
  // Don't render if no characteristics
  if (characteristics.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...characteristics, ...characteristics, ...characteristics];

  return (
    <div 
      ref={containerRef}
      className="relative mt-4 rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
    >
      {/* Gradient Background - Groupe Yama Plus Blue */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a365d] via-[#2563eb] to-[#1a365d]" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
      
      {/* Content */}
      <div className="relative py-3 px-2 overflow-hidden">
        <motion.div
          className="flex gap-3"
          animate={{
            x: isPaused ? 0 : [0, -50 * characteristics.length],
          }}
          transition={{
            x: {
              duration: characteristics.length * 4,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            },
          }}
          style={{ willChange: "transform" }}
        >
          {duplicatedItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.key}-${index}`}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/25 transition-colors cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{item.key}</p>
                  <p className="text-sm font-semibold whitespace-nowrap">{item.value}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
      
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#1a365d] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#1a365d] to-transparent pointer-events-none" />
    </div>
  );
}
