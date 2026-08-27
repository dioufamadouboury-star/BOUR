import { Link, useLocation } from "react-router-dom";
import { Home, Search, Grid3X3, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { cn } from "../lib/utils";

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();
  
  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  const navItems = [
    { href: "/", icon: Home, label: "Accueil" },
    { href: "/search", icon: Search, label: "Recherche" },
    { href: "/categories-browse", icon: Grid3X3, label: "Explorer" },
    { href: "/cart", icon: ShoppingBag, label: "Panier", badge: cartCount },
    { href: isAuthenticated ? "/account" : "/login", icon: User, label: "Compte" },
  ];
  
  // Hide on admin pages
  if (location.pathname.startsWith("/admin")) {
    return null;
  }
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-black/5 dark:border-white/[0.06] md:hidden safe-area-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const isActive = location.pathname === href || 
            (href === "/" && location.pathname === "/") ||
            (href !== "/" && location.pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full relative",
                "transition-colors duration-200 active:scale-95",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-primary text-white rounded-full px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
