import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone, User, Home, Car, Monitor, Sparkles, ShoppingBag, Wrench } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const LOGO = "/assets/images/logo_yama_full.png?v=4";
const BG = "/assets/images/login_bg.jpg";

const CATEGORIES = [
  { icon: Home, label: "Immobilier" },
  { icon: Monitor, label: "Électronique & Électroménager" },
  { icon: Sparkles, label: "Décoration & Mode & Beauté" },
  { icon: Car, label: "Automobile" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Wrench, label: "Services" },
];

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
      toast.error(error.response?.data?.detail || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputBase = "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all";

  return (
    <main className="min-h-screen flex overflow-hidden">

      {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        {/* Background image */}
        <img src={BG} alt="YAMA+" className="absolute inset-0 w-full h-full object-cover" />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1040]/85 via-[#1a1040]/65 to-[#0d0820]/90" />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Top — Logo + Tagline */}
          <div className="flex flex-col items-center text-center">
            <img src={LOGO} alt="GROUPE YAMA+" className="h-20 w-auto mb-6 drop-shadow-lg" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl xl:text-4xl font-bold text-white leading-snug max-w-md"
            >
              Tout ce dont vous avez besoin<br />
              <span className="text-blue-300">en un seul endroit !</span>
            </motion.h1>
          </div>

          {/* Bottom — Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-3 gap-x-6 gap-y-4"
          >
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium leading-tight">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 lg:p-10 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo - Plus grand sur mobile */}
          <div className="mb-7 text-center">
            <Link to="/">
              <img src={LOGO} alt="GROUPE YAMA+" className="h-20 md:h-16 w-auto mx-auto" />
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isLogin ? "Bienvenue sur YAMA+" : "Créer un compte"}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? "Accédez à tous vos services en un seul endroit" : "Rejoignez la communauté YAMA+"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              {!isLogin && (
                <div className={inputBase}>
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Nom complet" required={!isLogin}
                    className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                    data-testid="name-input"
                  />
                </div>
              )}

              <div className={inputBase}>
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Email ou numéro" required
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                  data-testid="email-input"
                />
              </div>

              <div className={inputBase}>
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                  placeholder="Mot de passe" required minLength={6}
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                  data-testid="password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 text-xs font-medium flex-shrink-0">
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>

              {!isLogin && (
                <div className={inputBase}>
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="Téléphone (optionnel)"
                    className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                    data-testid="phone-input"
                  />
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-blue-600 text-xs hover:underline font-medium">
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #1A6FD8 0%, #1443A8 100%)" }}
                data-testid="submit-btn"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? "Se connecter" : "Créer mon compte")}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-gray-400 text-xs">Ou connectez-vous avec</span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          {/* Toggle login/register */}
          <p className="text-center mt-6 text-gray-500 text-sm">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline" data-testid="toggle-auth-btn">
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>

          <div className="text-center mt-3">
            <Link to="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">← Retour au site</Link>
          </div>
        </motion.div>
      </div>

    </main>
  );
}
