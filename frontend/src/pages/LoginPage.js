import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const VILLA_IMAGE = "https://customer-assets.emergentagent.com/job_e49cc0ee-265f-4de3-ae2c-8dfd157d7024/artifacts/rs1tzm1m_76276AFC-694E-43F8-A27E-1F01DBB175C9.png";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await login(formData.email, formData.password);
        toast.success("Connexion réussie");
      } else {
        user = await register(formData.name, formData.email, formData.password, formData.phone);
        toast.success("Compte créé avec succès");
      }
      if (user?.role === "admin") navigate("/admin", { replace: true });
      else navigate(from === "/" || from === "/login" ? "/" : from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <main className="min-h-screen flex overflow-hidden bg-[#080808]">
      {/* LEFT — Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={VILLA_IMAGE}
          alt="YAMA+ Immobilier"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

        {/* Branding */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/">
            <img src="/assets/images/logo_yama_full.png" alt="YAMA+" className="h-14 w-auto" />
          </Link>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <p className="text-[1A56C0] text-sm font-medium tracking-widest uppercase mb-4">
                Groupe YAMA+
              </p>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Le meilleur du<br />
                <span className="text-[1A56C0]">Sénégal,</span><br />
                réuni pour vous.
              </h2>
              <p className="text-white/60 text-base max-w-sm">
                Électronique, immobilier, automobile, décoration et beauté — tout en un seul endroit.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex gap-8 mt-10"
            >
              {[["500+", "Produits"], ["100+", "Clients"], ["5+", "Catégories"]].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-[1A56C0]">{num}</p>
                  <p className="text-white/50 text-sm">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Gold corner accent */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[1A56C0]/30 to-transparent" />
      </div>

      {/* RIGHT — Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0D0D] to-[#080808]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1A56C0 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img src="/assets/images/logo_yama_full.png" alt="YAMA+" className="h-12 w-auto mx-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <p className="text-[1A56C0] text-xs font-medium tracking-widest uppercase mb-3">
              {isLogin ? "Bon retour" : "Nouveau compte"}
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="text-white/40 text-sm">
              {isLogin ? "Accédez à votre espace personnel" : "Rejoignez la communauté YAMA+"}
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-[1A56C0]/50 transition-all duration-300 mb-6 group"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium text-sm">Continuer avec Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#0D0D0D] text-white/30 text-xs tracking-wider uppercase">
                ou par email
              </span>
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Nom complet" required={!isLogin}
                    className="w-full h-13 pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[1A56C0]/60 focus:bg-white/8 outline-none transition-all text-sm"
                    data-testid="name-input"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Adresse email" required
                  className="w-full h-13 pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[1A56C0]/60 focus:bg-white/8 outline-none transition-all text-sm"
                  data-testid="email-input"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                  placeholder="Mot de passe" required minLength={6}
                  className="w-full h-13 pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[1A56C0]/60 focus:bg-white/8 outline-none transition-all text-sm"
                  data-testid="password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="Téléphone (optionnel)"
                    className="w-full h-13 pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[1A56C0]/60 focus:bg-white/8 outline-none transition-all text-sm"
                    data-testid="phone-input"
                  />
                </div>
              )}

              {isLogin && (
                <div className="text-right pt-1">
                  <Link to="/forgot-password" className="text-xs text-[1A56C0] hover:text-[1A56C0]/80 transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: loading ? "#1A3A8A" : "linear-gradient(135deg, #1A56C0 0%, #1440A0 100%)", color: "#0D0D0D" }}
                  data-testid="submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Se connecter" : "Créer mon compte"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          {/* Toggle */}
          <p className="text-center mt-6 text-white/40 text-sm">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[1A56C0] font-medium hover:text-[1A56C0]/80 transition-colors"
              data-testid="toggle-auth-btn"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

          {/* Back to site */}
          <div className="text-center mt-6">
            <Link to="/" className="text-white/20 text-xs hover:text-white/40 transition-colors flex items-center justify-center gap-1">
              ← Retour au site
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
