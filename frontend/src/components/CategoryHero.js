import { motion } from "framer-motion";

/**
 * Reusable dark hero section for category/section pages.
 * Props: image, gradient, accent, title, subtitle, filters, activeFilter, onFilterChange, badge
 */
export default function CategoryHero({ image, gradient, accent, title, subtitle, filters, activeFilter, onFilterChange, badge }) {
  return (
    <div className="relative w-full h-[380px] md:h-[460px] overflow-hidden">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient || "from-black/80 via-black/60 to-black/85"}`} />
      <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-16 py-10 pt-28">
        <div>
          {badge && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-block text-xs font-semibold tracking-widest uppercase mb-2 ${accent || "text-white/70"}`}
            >
              {badge}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold text-white mb-3 max-w-2xl leading-tight"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-white/60 text-sm md:text-base max-w-lg"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {filters && filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex gap-2 flex-wrap"
          >
            {filters.map(f => {
              const Icon = f.icon;
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onFilterChange && onFilterChange(f.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    active
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/10 backdrop-blur text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${active ? "text-black" : (accent || "text-white")}`} />}
                  {f.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
