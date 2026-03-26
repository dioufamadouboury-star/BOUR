import { useState } from "react";
import { 
  Facebook, 
  Youtube, 
  Search, 
  Target, 
  DollarSign, 
  Users, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  ExternalLink,
  Copy,
  Zap,
  Image as ImageIcon,
  FileText,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function AdsGuideAdmin() {
  const [activeTab, setActiveTab] = useState("facebook");

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié !");
  };

  const tabCls = (t) => `px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === t ? "bg-black dark:bg-white text-white dark:text-black" : "text-muted-foreground hover:bg-black/5"}`;

  return (
    <div className="space-y-6" data-testid="ads-guide-admin">
      <div>
        <h1 className="text-2xl font-bold">Guide Campagnes Publicitaires</h1>
        <p className="text-muted-foreground">Tutoriels Facebook Ads, Google Ads et YouTube Ads</p>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 border-b pb-4">
        <button className={tabCls("facebook")} onClick={() => setActiveTab("facebook")}>
          <Facebook className="w-5 h-5 text-blue-600" /> Facebook & Instagram
        </button>
        <button className={tabCls("google")} onClick={() => setActiveTab("google")}>
          <Search className="w-5 h-5 text-red-500" /> Google Ads
        </button>
        <button className={tabCls("youtube")} onClick={() => setActiveTab("youtube")}>
          <Youtube className="w-5 h-5 text-red-600" /> YouTube Ads
        </button>
      </div>

      {/* Facebook Ads Guide */}
      {activeTab === "facebook" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">2.9B</p>
              <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <Target className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold">98%</p>
              <p className="text-xs text-muted-foreground">Précision ciblage</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">5000 FCFA</p>
              <p className="text-xs text-muted-foreground">Budget min/jour</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
              <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-2xl font-bold">3-5x</p>
              <p className="text-xs text-muted-foreground">ROI moyen</p>
            </div>
          </div>

          {/* Step by Step */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><Facebook className="w-5 h-5" /> Créer une campagne Facebook Ads</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Accéder au Meta Business Suite</h3>
                  <p className="text-sm text-muted-foreground mb-3">Connectez-vous à votre compte Facebook et accédez au gestionnaire de publicités.</p>
                  <a href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <ExternalLink className="w-4 h-4" /> Ouvrir Ads Manager
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Choisir l'objectif de campagne</h3>
                  <p className="text-sm text-muted-foreground mb-3">Sélectionnez l'objectif qui correspond à vos besoins :</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <Zap className="w-5 h-5 text-yellow-500 mb-1" />
                      <p className="font-medium text-sm">Trafic</p>
                      <p className="text-xs text-muted-foreground">Amener du monde sur votre site</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200">
                      <Target className="w-5 h-5 text-green-500 mb-1" />
                      <p className="font-medium text-sm">Conversions</p>
                      <p className="text-xs text-muted-foreground">Ventes & inscriptions (Recommandé)</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Users className="w-5 h-5 text-blue-500 mb-1" />
                      <p className="font-medium text-sm">Notoriété</p>
                      <p className="text-xs text-muted-foreground">Faire connaître votre marque</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Définir votre audience (Sénégal)</h3>
                  <p className="text-sm text-muted-foreground mb-3">Paramètres de ciblage recommandés pour YAMA+ :</p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
                    <p><strong>Localisation :</strong> Sénégal (ou Dakar, Thiès, Saint-Louis...)</p>
                    <p><strong>Âge :</strong> 18-45 ans</p>
                    <p><strong>Intérêts :</strong> Shopping en ligne, Électronique, Mode, Immobilier, Automobile</p>
                    <p><strong>Comportements :</strong> Acheteurs en ligne, Utilisateurs de smartphones</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Budget et durée</h3>
                  <p className="text-sm text-muted-foreground mb-3">Recommandations budget pour le Sénégal :</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-lg font-bold text-green-600">5 000 FCFA</p>
                      <p className="text-xs text-muted-foreground">Test (3 jours)</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-lg font-bold text-blue-600">15 000 FCFA</p>
                      <p className="text-xs text-muted-foreground">Standard (7 jours)</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-lg font-bold text-purple-600">50 000 FCFA</p>
                      <p className="text-xs text-muted-foreground">Performance (14 jours)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">5</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Créer votre annonce</h3>
                  <p className="text-sm text-muted-foreground mb-3">Formats recommandés :</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <ImageIcon className="w-6 h-6 text-pink-500 mb-2" />
                      <p className="font-medium">Image unique</p>
                      <p className="text-xs text-muted-foreground">1080x1080px (carré) ou 1200x628px</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <FileText className="w-6 h-6 text-blue-500 mb-2" />
                      <p className="font-medium">Carrousel</p>
                      <p className="text-xs text-muted-foreground">2-10 images/vidéos</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-medium text-sm mb-2">Exemple de texte publicitaire :</p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm relative">
                      <p>🔥 PROMO EXCEPTIONNELLE chez GROUPE YAMA+ !</p>
                      <p className="mt-1">Découvrez nos produits de qualité à prix imbattables.</p>
                      <p className="mt-1">✅ Livraison rapide à Dakar</p>
                      <p>✅ Paiement sécurisé</p>
                      <p className="mt-1">👉 Commandez maintenant sur groupeyamaplus.com</p>
                      <button onClick={() => copyText("🔥 PROMO EXCEPTIONNELLE chez GROUPE YAMA+ !\n\nDécouvrez nos produits de qualité à prix imbattables.\n\n✅ Livraison rapide à Dakar\n✅ Paiement sécurisé\n\n👉 Commandez maintenant sur groupeyamaplus.com")}
                        className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded"><Copy className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel Info */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /> Pixel Facebook déjà configuré</h4>
                <p className="text-sm text-muted-foreground mt-1">Votre Pixel ID : <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">3225886221025264</code></p>
                <p className="text-sm text-muted-foreground">Les conversions sont automatiquement trackées sur groupeyamaplus.com</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Ads Guide */}
      {activeTab === "google" && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <Search className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-2xl font-bold">8.5B</p>
              <p className="text-xs text-muted-foreground">Recherches/jour</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <Target className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">92%</p>
              <p className="text-xs text-muted-foreground">Part de marché</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <DollarSign className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold">100-500 FCFA</p>
              <p className="text-xs text-muted-foreground">Coût par clic</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">5-8x</p>
              <p className="text-xs text-muted-foreground">ROI moyen</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-red-500 to-yellow-500 text-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><Search className="w-5 h-5" /> Créer une campagne Google Ads</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Créer un compte Google Ads</h3>
                  <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                    <ExternalLink className="w-4 h-4" /> Ouvrir Google Ads
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Choisir le type de campagne</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <Search className="w-5 h-5 text-blue-500 mb-1" />
                      <p className="font-medium text-sm">Réseau de recherche</p>
                      <p className="text-xs text-muted-foreground">Annonces textuelles (Recommandé)</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <ImageIcon className="w-5 h-5 text-green-500 mb-1" />
                      <p className="font-medium text-sm">Display</p>
                      <p className="text-xs text-muted-foreground">Bannières sur sites partenaires</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Mots-clés recommandés</h3>
                  <div className="flex flex-wrap gap-2">
                    {["acheter téléphone dakar", "boutique en ligne sénégal", "électroménager dakar", "immobilier sénégal", "voiture occasion dakar", "livraison dakar", "promo électronique"].map(kw => (
                      <span key={kw} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm cursor-pointer hover:bg-gray-200" onClick={() => copyText(kw)}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /> Google Analytics configuré</h4>
                <p className="text-sm text-muted-foreground mt-1">Votre ID GA4 : <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">G-MWD2FB6LEL</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Ads Guide */}
      {activeTab === "youtube" && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <Youtube className="w-6 h-6 text-red-600 mb-2" />
              <p className="text-2xl font-bold">2B</p>
              <p className="text-xs text-muted-foreground">Utilisateurs/mois</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <Clock className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">1B</p>
              <p className="text-xs text-muted-foreground">Heures vues/jour</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <DollarSign className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-2xl font-bold">50-200 FCFA</p>
              <p className="text-xs text-muted-foreground">Coût par vue</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">80%</p>
              <p className="text-xs text-muted-foreground">Taux de mémorisation</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-red-600 to-red-700 text-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><Youtube className="w-5 h-5" /> Créer une campagne YouTube</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Préparer votre vidéo</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Bumper Ad</p>
                      <p className="text-xs text-muted-foreground">6 secondes max</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200">
                      <p className="font-medium text-sm">TrueView</p>
                      <p className="text-xs text-muted-foreground">15-30 sec (skip après 5s)</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Non-skippable</p>
                      <p className="text-xs text-muted-foreground">15 sec (pas de skip)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Script vidéo recommandé (15 sec)</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm relative">
                    <p><strong>0-3s:</strong> Hook visuel + "GROUPE YAMA+" logo</p>
                    <p><strong>3-10s:</strong> Montrer les produits/services phares</p>
                    <p><strong>10-13s:</strong> Offre spéciale ou avantage clé</p>
                    <p><strong>13-15s:</strong> Call-to-action + groupeyamaplus.com</p>
                    <button onClick={() => copyText("0-3s: Hook visuel + logo YAMA+\n3-10s: Produits/services phares\n10-13s: Offre spéciale\n13-15s: CTA + groupeyamaplus.com")}
                      className="absolute top-2 right-2 p-1.5 hover:bg-gray-200 rounded"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">Lancer via Google Ads</h3>
                  <p className="text-sm text-muted-foreground mb-3">YouTube Ads se gère depuis Google Ads. Choisissez "Campagne vidéo".</p>
                  <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                    <ExternalLink className="w-4 h-4" /> Créer campagne vidéo
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-800">💡 Astuce YAMA+</h4>
            <p className="text-sm text-muted-foreground mt-1">Créez une vidéo simple avec votre smartphone montrant vos produits. Les vidéos authentiques performent souvent mieux que les productions professionnelles coûteuses.</p>
          </div>
        </div>
      )}
    </div>
  );
}
