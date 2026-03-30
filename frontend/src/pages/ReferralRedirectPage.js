import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

/**
 * Referral redirect page - captures reseller code and redirects to homepage
 * URL: /r/:code
 */
export default function ReferralRedirectPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store reseller code in localStorage with expiry (30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      localStorage.setItem("reseller_code", code);
      localStorage.setItem("reseller_code_expiry", expiryDate.toISOString());
      
      console.log(`Referral code captured: ${code}`);
    }
    
    // Redirect to homepage after a brief moment
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-lg font-medium">Redirection en cours...</p>
        <p className="text-muted-foreground text-sm mt-2">
          Code partenaire: <span className="font-mono font-bold">{code}</span>
        </p>
      </div>
    </div>
  );
}
