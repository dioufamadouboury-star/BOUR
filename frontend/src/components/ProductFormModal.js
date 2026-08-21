import { useState, useCallback, memo, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { cn, getImageUrl } from "../lib/utils";
import {
  X,
  FileText,
  Image as ImageIcon,
  Palette,
  Ruler,
  Upload,
  Loader2,
  Sparkles,
  Search,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: "electronique", name: "Électronique" },
  { id: "electromenager", name: "Électroménager" },
  { id: "decoration", name: "Décoration & Mobilier" },
  { id: "beaute", name: "Mode & Beauté" },
  { id: "automobile", name: "Automobile" },
  { id: "immobilier", name: "Immobilier" },
  { id: "services", name: "Services" },
];

const SUBCATEGORIES = {
  electronique: [
    "Smartphones", "TV & Écrans", "Ordinateurs & PC", "Tablettes",
    "Audio & Casques", "Appareils Photo", "Gaming & Consoles",
    "Accessoires téléphone", "Câbles & Chargeurs", "Montres connectées", "Autres"
  ],
  electromenager: [
    "Climatiseur", "Réfrigérateur", "Congélateur", "Chauffage", 
    "Micro-ondes", "Ventilateur", "Machine à laver", "Sèche-linge",
    "Four", "Cuisinière", "Lave-vaisselle", "Aspirateur", 
    "Mixeur & Blender", "Fer à repasser", "Chauffe-eau", "Autres"
  ],
  decoration: [
    "Salons", "Chambres à coucher", "Literie & Matelas", "Table à manger",
    "Lustre", "Tableau", "Mobilier bureau", "Canapés", "Armoires & Rangements",
    "Tapis & Coussins", "Rideaux", "Miroirs", "Plantes & Vases", "Autres"
  ],
  beaute: [
    "Vêtements Femme", "Vêtements Homme", "Vêtements Enfant", "Chaussures",
    "Sacs & Maroquinerie", "Bijoux & Montres", "Parfums", "Cosmétiques & Maquillage",
    "Soins cheveux", "Soins corps", "Accessoires mode", "Autres"
  ],
  automobile: [
    "Voitures neuves", "Voitures d'occasion", "Motos & Scooters",
    "Pièces & Accessoires", "Pneus & Jantes", "Audio auto",
    "Location courte durée", "Location longue durée", "Covoiturage", "Autres"
  ],
  immobilier: [
    "Appartements", "Villas & Maisons", "Terrains", "Bureaux & Commerces",
    "Magasins", "Entrepôts", "Location courte durée", "Location longue durée", "Autres"
  ],
  services: [
    "Plomberie", "Électricité", "Climatisation", "Peinture", "Menuiserie",
    "Nettoyage", "Jardinage", "Déménagement", "Sécurité", "Informatique",
    "Couture", "Coiffure", "Autres"
  ],
};

const AVAILABLE_COLORS = [
  { id: "noir", name: "Noir", hex: "#1a1a1a" },
  { id: "blanc", name: "Blanc", hex: "#ffffff" },
  { id: "gris", name: "Gris", hex: "#808080" },
  { id: "argent", name: "Argent", hex: "#c0c0c0" },
  { id: "or", name: "Or", hex: "#ffd700" },
  { id: "rose", name: "Rose", hex: "#ffc0cb" },
  { id: "bleu", name: "Bleu", hex: "#0066cc" },
  { id: "bleu_ciel", name: "Bleu Ciel", hex: "#87ceeb" },
  { id: "rouge", name: "Rouge", hex: "#dc2626" },
  { id: "vert", name: "Vert", hex: "#22c55e" },
  { id: "violet", name: "Violet", hex: "#8b5cf6" },
  { id: "titane_noir", name: "Titane Noir", hex: "#3d3d3d" },
  { id: "titane_naturel", name: "Titane Naturel", hex: "#c4b8a8" },
  { id: "titane_blanc", name: "Titane Blanc", hex: "#f5f5f0" },
  { id: "titane_bleu", name: "Titane Bleu", hex: "#5a7d9a" },
];

const PHONE_CAPACITIES = [
  { id: "64go", name: "64 Go" },
  { id: "128go", name: "128 Go" },
  { id: "256go", name: "256 Go" },
  { id: "512go", name: "512 Go" },
  { id: "1to", name: "1 To" },
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "128GB", "256GB", "512GB", "1TB"];

const ProductFormModal = memo(({ 
  isOpen, 
  onClose, 
  editingProduct, 
  token, 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  
  const getInitialForm = useCallback(() => ({
    name: editingProduct?.name || "",
    description: editingProduct?.description || "",
    short_description: editingProduct?.short_description || "",
    price: editingProduct?.price?.toString() || "",
    original_price: editingProduct?.original_price?.toString() || "",
    category: editingProduct?.category || "electronique",
    subcategory: editingProduct?.subcategory || "",
    images: editingProduct?.images || [],
    stock: editingProduct?.stock?.toString() || "",
    featured: editingProduct?.featured || false,
    is_new: editingProduct?.is_new || false,
    is_promo: editingProduct?.is_promo || false,
    brand: editingProduct?.brand || "",
    colors: editingProduct?.colors || [],
    sizes: editingProduct?.sizes || [],
    specs: editingProduct?.specs || {},
    is_on_order: editingProduct?.is_on_order || false,
    order_delivery_days: editingProduct?.order_delivery_days?.toString() || "",
    requires_appointment: editingProduct?.requires_appointment || false,
    no_cart: editingProduct?.no_cart || false,
    meta_title: editingProduct?.meta_title || "",
    meta_description: editingProduct?.meta_description || "",
    // Phone variants support
    has_variants: editingProduct?.has_variants || false,
    variants: editingProduct?.variants || [],
  }), [editingProduct]);

  const [form, setForm] = useState(getInitialForm);

  // Reset form when editingProduct changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Force complete state reset with a fresh object
      const newForm = {
        name: editingProduct?.name || "",
        description: editingProduct?.description || "",
        short_description: editingProduct?.short_description || "",
        price: editingProduct?.price?.toString() || "",
        original_price: editingProduct?.original_price?.toString() || "",
        category: editingProduct?.category || "electronique",
        subcategory: editingProduct?.subcategory || "",
        images: editingProduct?.images ? [...editingProduct.images] : [],
        stock: editingProduct?.stock?.toString() || "",
        featured: editingProduct?.featured || false,
        is_new: editingProduct?.is_new || false,
        is_promo: editingProduct?.is_promo || false,
        brand: editingProduct?.brand || "",
        colors: editingProduct?.colors ? [...editingProduct.colors] : [],
        sizes: editingProduct?.sizes ? [...editingProduct.sizes] : [],
        specs: editingProduct?.specs ? {...editingProduct.specs} : {},
        is_on_order: editingProduct?.is_on_order || false,
        order_delivery_days: editingProduct?.order_delivery_days?.toString() || "",
        requires_appointment: editingProduct?.requires_appointment || false,
        no_cart: editingProduct?.no_cart || false,
        meta_title: editingProduct?.meta_title || "",
        meta_description: editingProduct?.meta_description || "",
        has_variants: editingProduct?.has_variants || false,
        variants: editingProduct?.variants ? [...editingProduct.variants] : [],
      };
      setForm(newForm);
      setActiveTab("general");
      setLoading(false);
      setUploadingImage(false);
      setAnalyzingImage(false);
    }
  }, [isOpen, editingProduct]);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    const newImages = [...form.images];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/api/upload/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          // Keep relative URL as-is - getImageUrl will handle display
          // This ensures portability across environments (preview vs production)
          let imageUrl = response.data.url;
          newImages.push(imageUrl);
        }
      } catch (error) {
        toast.error(`Erreur upload: ${error.response?.data?.detail || 'Erreur'}`);
      }
    }

    setForm(prev => ({ ...prev, images: newImages }));
    setUploadingImage(false);
  };

  const handleRemoveImage = (index) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, images: newImages }));
  };

  const handleAIAnalyze = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setAnalyzingImage(true);
    toast.info("🤖 Analyse IA en cours...");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/admin/analyze-product-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const product = response.data.product;
        
        setForm(prev => ({
          ...prev,
          name: product.name || prev.name,
          description: product.description || prev.description,
          short_description: product.short_description || prev.short_description,
          category: product.category || prev.category,
          brand: product.brand || prev.brand,
          price: product.estimated_price?.toString() || prev.price,
          colors: product.colors?.length > 0 ? product.colors : prev.colors,
          is_new: product.is_new ?? prev.is_new,
        }));

        // Upload the analyzed image
        const imageFormData = new FormData();
        imageFormData.append('file', file);
        
        try {
          const uploadResponse = await axios.post(`${API_URL}/api/upload/image`, imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });

          if (uploadResponse.data.success) {
            // Keep relative URL as-is - getImageUrl will handle display
            let imageUrl = uploadResponse.data.url;
            setForm(prev => ({
              ...prev,
              images: [...prev.images, imageUrl]
            }));
          }
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
        }

        toast.success(`🎯 Produit analysé avec succès !`);
      } else {
        toast.error(response.data.error || "Erreur d'analyse");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'analyse IA");
    } finally {
      setAnalyzingImage(false);
    }
  };

  const toggleColor = (color) => {
    const newColors = form.colors.includes(color)
      ? form.colors.filter(c => c !== color)
      : [...form.colors, color];
    setForm(prev => ({ ...prev, colors: newColors }));
  };

  const toggleSize = (size) => {
    const newSizes = form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size];
    setForm(prev => ({ ...prev, sizes: newSizes }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.name?.trim()) {
        toast.error("Le nom du produit est obligatoire");
        setLoading(false);
        return;
      }

      if (!form.price || parseInt(form.price) <= 0) {
        toast.error("Le prix doit être supérieur à 0");
        setLoading(false);
        return;
      }

      const images = form.images.length > 0 
        ? form.images 
        : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"];

      const productData = {
        name: form.name.trim(),
        description: form.description?.trim() || form.name.trim(),
        short_description: form.short_description?.trim() || "",
        price: parseInt(form.price) || 0,
        original_price: form.original_price ? parseInt(form.original_price) : null,
        category: form.category || "electronique",
        subcategory: form.subcategory || null,
        images,
        stock: parseInt(form.stock) || 0,
        featured: form.featured || false,
        is_new: form.is_new || false,
        is_promo: form.is_promo || false,
        brand: form.brand?.trim() || null,
        colors: form.colors || [],
        sizes: form.sizes || [],
        specs: form.specs || {},
        is_on_order: form.is_on_order || false,
        order_delivery_days: form.order_delivery_days ? parseInt(form.order_delivery_days) : null,
        requires_appointment: form.requires_appointment || false,
        no_cart: form.no_cart || false,
        meta_title: form.meta_title?.trim() || null,
        meta_description: form.meta_description?.trim() || null,
        has_variants: form.has_variants || false,
        variants: form.variants || [],
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (editingProduct) {
        await axios.put(
          `${API_URL}/api/products/${editingProduct.product_id}`,
          productData,
          { headers }
        );
        toast.success("Produit modifié avec succès");
      } else {
        await axios.post(
          `${API_URL}/api/products`,
          productData,
          { headers }
        );
        toast.success("Produit créé avec succès");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Product submit error:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "general", label: "Général", icon: FileText },
    { id: "media", label: "Images", icon: ImageIcon },
    { id: "variants", label: "Options", icon: Palette },
    { id: "specs", label: "Spécifications", icon: Ruler },
    { id: "seo", label: "SEO", icon: Search },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl mx-4 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Remplissez les informations du produit
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editingProduct && (
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAIAnalyze}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={analyzingImage}
                />
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  analyzingImage 
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                    : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                )}>
                  {analyzingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      IA Auto-remplir
                    </>
                  )}
                </div>
              </label>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/5 dark:border-white/5 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-black dark:border-white text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Catégorie *</label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => { updateField('category', e.target.value); updateField('subcategory', ''); }}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sous-catégorie</label>
                    <select
                      value={form.subcategory}
                      onChange={(e) => updateField('subcategory', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                    >
                      <option value="">-- Sélectionner --</option>
                      {(SUBCATEGORIES[form.category] || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Marque</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                    placeholder="Ex: Apple, Samsung, Nike..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description courte</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) => updateField('short_description', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                    placeholder="Résumé en une phrase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description complète</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none resize-none"
                    placeholder="Description détaillée du produit..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix (FCFA) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ancien prix</label>
                    <input
                      type="number"
                      value={form.original_price}
                      onChange={(e) => updateField('original_price', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => updateField('stock', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_new}
                      onChange={(e) => updateField('is_new', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">Nouveau</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_promo}
                      onChange={(e) => updateField('is_promo', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">En promotion</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => updateField('featured', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">Mis en avant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_on_order}
                      onChange={(e) => updateField('is_on_order', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">Sur commande</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requires_appointment}
                      onChange={(e) => updateField('requires_appointment', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">Nécessite un rendez-vous</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.no_cart}
                      onChange={(e) => updateField('no_cart', e.target.checked)}
                      className="w-5 h-5 rounded border-black/20 dark:border-white/20"
                    />
                    <span className="text-sm font-medium">Sans panier (contact uniquement)</span>
                  </label>
                </div>

                {form.is_on_order && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <label className="block text-sm font-medium mb-2 text-orange-700 dark:text-orange-300">
                      Délai de livraison estimé (en jours) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required={form.is_on_order}
                      value={form.order_delivery_days}
                      onChange={(e) => updateField('order_delivery_days', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-orange-300 dark:border-orange-700 bg-white dark:bg-[#1C1C1E] focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Ex: 7, 14, 21..."
                    />
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Ce produit sera affiché comme &quot;Disponible sur commande&quot; avec le délai indiqué.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Media Tab */}
            {activeTab === "media" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-3">Images du produit</label>
                  <div className="grid grid-cols-3 gap-3">
                    {form.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 cursor-pointer flex flex-col items-center justify-center transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Ajouter</span>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    La première image sera l&apos;image principale. Formats: JPG, PNG, WebP
                  </p>
                </div>
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === "variants" && (
              <div className="space-y-6">
                {/* Phone variants toggle - for smartphones */}
                {(form.category === "electronique" && (form.subcategory === "Smartphones" || form.subcategory?.toLowerCase()?.includes("téléphone"))) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.has_variants}
                        onChange={(e) => updateField('has_variants', e.target.checked)}
                        className="w-5 h-5 rounded border-blue-300"
                      />
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-200">Activer les variantes (Capacité/Couleur)</span>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          Permet de définir différents prix/stocks pour chaque capacité et couleur
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Climatiseur variants - CV/Puissance */}
                {(form.category === "electromenager" && form.subcategory === "Climatiseur") && (
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.has_variants}
                        onChange={(e) => updateField('has_variants', e.target.checked)}
                        className="w-5 h-5 rounded border-cyan-300"
                      />
                      <div>
                        <span className="font-medium text-cyan-800 dark:text-cyan-200">Activer les variantes (Puissance CV)</span>
                        <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">
                          Définir différents prix selon la puissance (1 CV, 1.5 CV, 2 CV, etc.)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Matelas variants - Dimensions */}
                {(form.category === "decoration" && (form.subcategory === "Literie & Matelas" || form.subcategory?.toLowerCase()?.includes("matelas"))) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.has_variants}
                        onChange={(e) => updateField('has_variants', e.target.checked)}
                        className="w-5 h-5 rounded border-purple-300"
                      />
                      <div>
                        <span className="font-medium text-purple-800 dark:text-purple-200">Activer les variantes (Dimensions)</span>
                        <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                          Définir différents prix selon les dimensions (90×190, 140×190, 160×200, etc.)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Variants Management */}
                {form.has_variants && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Variantes du produit</label>
                      <button
                        type="button"
                        onClick={() => {
                          // Create variant based on product type
                          let newVariant = {
                            id: `var-${Date.now()}`,
                            price: parseInt(form.price) || 0,
                            stock: 0,
                            image: form.images[0] || ""
                          };
                          
                          // Climatiseur - CV variants
                          if (form.category === "electromenager" && form.subcategory === "Climatiseur") {
                            newVariant.puissance = "1";
                            newVariant.unit = "CV";
                          }
                          // Matelas - Dimension variants
                          else if (form.category === "decoration" && (form.subcategory === "Literie & Matelas" || form.subcategory?.toLowerCase()?.includes("matelas"))) {
                            newVariant.dimension = "90x190";
                          }
                          // Phone - Capacity/Color variants
                          else {
                            newVariant.capacity = "128go";
                            newVariant.color = "noir";
                          }
                          
                          updateField('variants', [...form.variants, newVariant]);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Ajouter une variante
                      </button>
                    </div>

                    {form.variants.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-muted-foreground text-sm">
                          Aucune variante. Cliquez sur &quot;Ajouter une variante&quot; pour commencer.
                        </p>
                      </div>
                    )}

                    {form.variants.map((variant, index) => (
                      <div key={variant.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium">Variante {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = form.variants.filter((_, i) => i !== index);
                              updateField('variants', newVariants);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Climatiseur - Puissance CV */}
                          {form.category === "electromenager" && form.subcategory === "Climatiseur" && (
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1">Puissance (CV)</label>
                              <select
                                value={variant.puissance || "1"}
                                onChange={(e) => {
                                  const newVariants = [...form.variants];
                                  newVariants[index].puissance = e.target.value;
                                  updateField('variants', newVariants);
                                }}
                                className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-700"
                              >
                                <option value="1">1 CV</option>
                                <option value="1.5">1.5 CV</option>
                                <option value="2">2 CV</option>
                                <option value="2.5">2.5 CV</option>
                                <option value="3">3 CV</option>
                                <option value="4">4 CV</option>
                                <option value="5">5 CV</option>
                              </select>
                            </div>
                          )}

                          {/* Matelas - Dimensions */}
                          {form.category === "decoration" && (form.subcategory === "Literie & Matelas" || form.subcategory?.toLowerCase()?.includes("matelas")) && (
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1">Dimensions (cm)</label>
                              <select
                                value={variant.dimension || "90x190"}
                                onChange={(e) => {
                                  const newVariants = [...form.variants];
                                  newVariants[index].dimension = e.target.value;
                                  updateField('variants', newVariants);
                                }}
                                className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-700"
                              >
                                <option value="90x190">90 × 190 cm (1 place)</option>
                                <option value="120x190">120 × 190 cm (1.5 place)</option>
                                <option value="140x190">140 × 190 cm (2 places)</option>
                                <option value="160x200">160 × 200 cm (Queen)</option>
                                <option value="180x200">180 × 200 cm (King)</option>
                                <option value="200x200">200 × 200 cm (Super King)</option>
                              </select>
                            </div>
                          )}

                          {/* Phone - Capacity */}
                          {form.category === "electronique" && (form.subcategory === "Smartphones" || form.subcategory?.toLowerCase()?.includes("téléphone")) && (
                            <>
                              <div>
                                <label className="block text-xs font-medium mb-1">Capacité</label>
                                <select
                                  value={variant.capacity || "128go"}
                                  onChange={(e) => {
                                    const newVariants = [...form.variants];
                                    newVariants[index].capacity = e.target.value;
                                    updateField('variants', newVariants);
                                  }}
                                  className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-700"
                                >
                                  <option value="64go">64 Go</option>
                                  <option value="128go">128 Go</option>
                                  <option value="256go">256 Go</option>
                                  <option value="512go">512 Go</option>
                                  <option value="1to">1 To</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Couleur</label>
                                <select
                                  value={variant.color || "noir"}
                                  onChange={(e) => {
                                    const newVariants = [...form.variants];
                                    newVariants[index].color = e.target.value;
                                    updateField('variants', newVariants);
                                  }}
                                  className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-700"
                                >
                                  <option value="noir">Noir</option>
                                  <option value="blanc">Blanc</option>
                                  <option value="bleu">Bleu</option>
                                  <option value="rouge">Rouge</option>
                                  <option value="vert">Vert</option>
                                  <option value="or">Or</option>
                                  <option value="argent">Argent</option>
                                  <option value="violet">Violet</option>
                                  <option value="rose">Rose</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Price - Common for all variants */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Prix (FCFA)</label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => {
                                const newVariants = [...form.variants];
                                newVariants[index] = { ...variant, price: parseInt(e.target.value) || 0 };
                                updateField('variants', newVariants);
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900"
                            />
                          </div>

                          {/* Stock - Common for all variants */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) => {
                                const newVariants = [...form.variants];
                                newVariants[index] = { ...variant, stock: parseInt(e.target.value) || 0 };
                                updateField('variants', newVariants);
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>

                        {/* Variant Image */}
                        <div className="mt-3">
                          <label className="block text-xs font-medium mb-1">Image de la variante (optionnel)</label>
                          <select
                            value={variant.image || ""}
                            onChange={(e) => {
                              const newVariants = [...form.variants];
                              newVariants[index] = { ...variant, image: e.target.value };
                              updateField('variants', newVariants);
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900"
                          >
                            <option value="">Image principale</option>
                            {form.images.map((img, imgIndex) => (
                              <option key={imgIndex} value={img}>Image {imgIndex + 1}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Summary Table */}
                    {form.variants.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <h4 className="text-sm font-medium mb-3">Récapitulatif des prix</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="pb-2">Capacité</th>
                              <th className="pb-2">Couleur</th>
                              <th className="pb-2 text-right">Prix</th>
                              <th className="pb-2 text-right">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.variants.map((v, i) => (
                              <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="py-2">{PHONE_CAPACITIES.find(c => c.id === v.capacity)?.name}</td>
                                <td className="py-2">{AVAILABLE_COLORS.find(c => c.id === v.color)?.name}</td>
                                <td className="py-2 text-right font-medium">{v.price?.toLocaleString()} FCFA</td>
                                <td className="py-2 text-right">{v.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Simple colors for non-variant products */}
                {!form.has_variants && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-3">Couleurs disponibles</label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_COLORS.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => toggleColor(color.name)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2",
                              form.colors.includes(color.name)
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                            )}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Tailles disponibles</label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                              form.sizes.includes(size)
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                {/* TV Specifications */}
                {(form.category === "electronique" && (form.subcategory === "TV & Écrans" || form.subcategory?.toLowerCase()?.includes("tv"))) && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-1">Caractéristiques Téléviseur</h4>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300">
                        Remplissez les spécifications techniques du téléviseur
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Taille en pouces */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Taille (pouces)</label>
                        <select
                          value={form.specs?.screen_size || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, screen_size: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="32">32 pouces</option>
                          <option value="40">40 pouces</option>
                          <option value="43">43 pouces</option>
                          <option value="50">50 pouces</option>
                          <option value="55">55 pouces</option>
                          <option value="58">58 pouces</option>
                          <option value="65">65 pouces</option>
                          <option value="70">70 pouces</option>
                          <option value="75">75 pouces</option>
                          <option value="85">85 pouces</option>
                        </select>
                      </div>

                      {/* Résolution */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Résolution</label>
                        <select
                          value={form.specs?.resolution || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, resolution: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="HD">HD (720p)</option>
                          <option value="Full HD">Full HD (1080p)</option>
                          <option value="4K">4K UHD</option>
                          <option value="8K">8K UHD</option>
                        </select>
                      </div>

                      {/* Smart TV */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Smart TV</label>
                        <select
                          value={form.specs?.smart_tv || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, smart_tv: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Android TV */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Android TV</label>
                        <select
                          value={form.specs?.android_tv || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, android_tv: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Google TV */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Google TV</label>
                        <select
                          value={form.specs?.google_tv || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, google_tv: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Wi-Fi */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Wi-Fi</label>
                        <select
                          value={form.specs?.wifi || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, wifi: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Bluetooth */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Bluetooth</label>
                        <select
                          value={form.specs?.bluetooth || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, bluetooth: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Netflix */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Netflix</label>
                        <select
                          value={form.specs?.netflix || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, netflix: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* YouTube */}
                      <div>
                        <label className="block text-sm font-medium mb-1">YouTube</label>
                        <select
                          value={form.specs?.youtube || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, youtube: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>

                      {/* Ports HDMI */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Ports HDMI</label>
                        <select
                          value={form.specs?.hdmi_ports || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, hdmi_ports: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="1">1 port</option>
                          <option value="2">2 ports</option>
                          <option value="3">3 ports</option>
                          <option value="4">4 ports</option>
                        </select>
                      </div>

                      {/* Ports USB */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Ports USB</label>
                        <select
                          value={form.specs?.usb_ports || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, usb_ports: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="1">1 port</option>
                          <option value="2">2 ports</option>
                          <option value="3">3 ports</option>
                        </select>
                      </div>

                      {/* Garantie */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Garantie</label>
                        <select
                          value={form.specs?.warranty || ""}
                          onChange={(e) => updateField("specs", { ...form.specs, warranty: e.target.value })}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          <option value="6 mois">6 mois</option>
                          <option value="1 an">1 an</option>
                          <option value="2 ans">2 ans</option>
                          <option value="3 ans">3 ans</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default message for other categories */}
                {!(form.category === "electronique" && (form.subcategory === "TV & Écrans" || form.subcategory?.toLowerCase()?.includes("tv"))) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Les spécifications détaillées sont disponibles pour certaines catégories (TV, Climatiseurs, etc.)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Optimisation SEO</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Améliorez la visibilité de votre produit dans les moteurs de recherche.
                  </p>
                </div>

                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Title
                    <span className="text-muted-foreground font-normal ml-2">
                      ({form.meta_title?.length || 0}/60 caractères)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.meta_title}
                    onChange={(e) => updateField("meta_title", e.target.value)}
                    placeholder={form.name || "Titre optimisé pour les moteurs de recherche"}
                    maxLength={60}
                    className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Idéalement entre 50-60 caractères. Si vide, le nom du produit sera utilisé.
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Description
                    <span className="text-muted-foreground font-normal ml-2">
                      ({form.meta_description?.length || 0}/160 caractères)
                    </span>
                  </label>
                  <textarea
                    value={form.meta_description}
                    onChange={(e) => updateField("meta_description", e.target.value)}
                    placeholder="Description courte et attrayante pour les résultats de recherche..."
                    maxLength={160}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Idéalement entre 120-160 caractères. Si vide, la description courte sera utilisée.
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium mb-2">Aperçu Google</label>
                  <div className="bg-white dark:bg-gray-900 border rounded-xl p-4">
                    <p className="text-blue-600 dark:text-blue-400 text-lg font-medium truncate">
                      {form.meta_title || form.name || "Titre du produit"}
                    </p>
                    <p className="text-green-700 dark:text-green-500 text-sm">
                      www.groupeyamaplus.com › produit › {form.name?.toLowerCase().replace(/\s+/g, '-') || 'slug'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {form.meta_description || form.short_description || form.description?.substring(0, 160) || "Description du produit..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-black/5 dark:border-white/5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-black/10 dark:border-white/10 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProduct ? "Enregistrer" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ProductFormModal.displayName = 'ProductFormModal';

export default ProductFormModal;
