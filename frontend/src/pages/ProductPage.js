import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  MessageCircle,
  Minus,
  Plus,
  ChevronDown,
  Bell,
  TrendingDown,
  Calendar,
  Tv,
  Thermometer,
  Wifi,
  Bluetooth,
  Zap,
  Monitor,
  Smartphone,
  HardDrive,
  Palette,
  Ruler,
  Home,
  Bed,
  Car,
  Fuel,
  Gauge,
  MapPin,
  Bath,
  Square,
  Wind,
  Snowflake,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import {
  formatPrice,
  calculateDiscount,
  getCategoryName,
  generateWhatsAppLink,
  generateOrderMessage,
  getImageUrl,
} from "../lib/utils";
import { cn } from "../lib/utils";
import ProductSpecsBanner from "../components/ProductSpecsBanner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import ProductReviews from "../components/ProductReviews";
import SimilarProducts from "../components/SimilarProducts";
import FrequentlyBoughtTogether from "../components/FrequentlyBoughtTogether";
import SEO from "../components/SEO";
import AppointmentModal from "../components/AppointmentModal";
import ShareButtons from "../components/ShareButtons";
import Analytics from "../lib/analytics";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const WHATSAPP_NUMBER = "+221783827575";

// Categories that allow visit appointments (only for high-value items requiring physical visit)
const APPOINTMENT_CATEGORIES = ["automobile", "automobiles", "immobilier"];

// Categories that should NOT have add to cart (high-value items requiring consultation)
const NO_CART_CATEGORIES = ["automobile", "automobiles", "immobilier"];

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Variant states for phones
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Price Alert state
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [priceAlertEmail, setPriceAlertEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [priceAlertLoading, setPriceAlertLoading] = useState(false);

  const { addToCart, loading: cartLoading } = useCart();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();

  // Phone capacity labels
  const CAPACITY_LABELS = {
    "64go": "64 Go",
    "128go": "128 Go",
    "256go": "256 Go",
    "512go": "512 Go",
    "1to": "1 To"
  };

  // Color labels and hex values
  const COLOR_INFO = {
    noir: { name: "Noir", hex: "#1a1a1a" },
    blanc: { name: "Blanc", hex: "#ffffff" },
    gris: { name: "Gris", hex: "#808080" },
    argent: { name: "Argent", hex: "#c0c0c0" },
    or: { name: "Or", hex: "#ffd700" },
    rose: { name: "Rose", hex: "#ffc0cb" },
    bleu: { name: "Bleu", hex: "#0066cc" },
    bleu_ciel: { name: "Bleu Ciel", hex: "#87ceeb" },
    rouge: { name: "Rouge", hex: "#dc2626" },
    vert: { name: "Vert", hex: "#22c55e" },
    violet: { name: "Violet", hex: "#8b5cf6" },
    titane_noir: { name: "Titane Noir", hex: "#3d3d3d" },
    titane_naturel: { name: "Titane Naturel", hex: "#c4b8a8" },
    titane_blanc: { name: "Titane Blanc", hex: "#f5f5f0" },
    titane_bleu: { name: "Titane Bleu", hex: "#5a7d9a" },
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/products/${productId}`);
        const prod = response.data;
        setProduct(prod);
        
        // Initialize variant selection for phones
        if (prod.has_variants && prod.variants?.length > 0) {
          // Get unique capacities
          const capacities = [...new Set(prod.variants.map(v => v.capacity))];
          if (capacities.length > 0) {
            setSelectedCapacity(capacities[0]);
            // Find first variant with this capacity
            const firstVariant = prod.variants.find(v => v.capacity === capacities[0]);
            if (firstVariant) {
              setSelectedVariant(firstVariant);
              setSelectedColor(firstVariant.color);
            }
          }
        }
        
        // Track product view
        Analytics.viewProduct(prod);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Update selected variant when capacity or color changes
  useEffect(() => {
    if (product?.has_variants && product.variants?.length > 0 && selectedCapacity) {
      const variant = product.variants.find(
        v => v.capacity === selectedCapacity && (selectedColor ? v.color === selectedColor : true)
      );
      if (variant) {
        setSelectedVariant(variant);
        // Update image if variant has a specific image
        if (variant.image && product.images) {
          const imgIndex = product.images.indexOf(variant.image);
          if (imgIndex >= 0) setSelectedImage(imgIndex);
        }
      }
    }
  }, [selectedCapacity, selectedColor, product]);

  // Get current price based on variant or base price
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product?.price || 0;
  };

  // Get current stock based on variant
  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    return product?.stock || 0;
  };

  // Get available colors for selected capacity
  const getAvailableColors = () => {
    if (!product?.has_variants || !product.variants || !selectedCapacity) return [];
    return product.variants
      .filter(v => v.capacity === selectedCapacity)
      .map(v => v.color);
  };

  // Get unique capacities from variants
  const getUniqueCapacities = () => {
    if (!product?.has_variants || !product.variants) return [];
    return [...new Set(product.variants.map(v => v.capacity))];
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-20">
        <div className="container-lumina py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square rounded-3xl skeleton" />
            <div className="space-y-6">
              <div className="h-8 w-32 rounded skeleton" />
              <div className="h-12 w-3/4 rounded skeleton" />
              <div className="h-6 w-full rounded skeleton" />
              <div className="h-6 w-2/3 rounded skeleton" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Produit non trouvé</h1>
          <Link to="/" className="btn-primary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const discount = calculateDiscount(product.original_price, getCurrentPrice());
  const inWishlist = isInWishlist(product.product_id);
  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();

  const handleAddToCart = () => {
    // For products with variants, check variant selection
    if (product.has_variants && product.variants?.length > 0) {
      if (!selectedVariant) {
        toast.error("Veuillez sélectionner une variante");
        return;
      }
      if (selectedVariant.stock <= 0) {
        toast.error("Cette variante est en rupture de stock");
        return;
      }
      // Add to cart with variant info
      addToCart(product.product_id, quantity, { 
        color: COLOR_INFO[selectedColor]?.name || selectedColor,
        capacity: CAPACITY_LABELS[selectedCapacity] || selectedCapacity,
        variant_id: selectedVariant.id,
        variant_price: selectedVariant.price
      });
      return;
    }
    
    // Validate color/size selection if required
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Veuillez sélectionner une couleur");
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Veuillez sélectionner une taille");
      return;
    }
    addToCart(product.product_id, quantity, { color: selectedColor, size: selectedSize });
  };

  const handleWhatsAppOrder = () => {
    let productName = product.name;
    if (selectedCapacity) productName += ` — ${CAPACITY_LABELS[selectedCapacity] || selectedCapacity}`;
    if (selectedColor) productName += ` — ${COLOR_INFO[selectedColor]?.name || selectedColor}`;
    if (selectedSize) productName += ` - Taille ${selectedSize}`;
    
    const items = [
      {
        name: productName,
        price: currentPrice,
        quantity: quantity,
      },
    ];
    const message = generateOrderMessage(items, product.price * quantity, null);
    window.open(generateWhatsAppLink(WHATSAPP_NUMBER, message), "_blank");
  };

  const handleNotifyStock = async (e) => {
    e.preventDefault();
    if (!notifyEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    
    setNotifyLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/products/${productId}/notify-stock`, {
        email: notifyEmail,
        product_id: productId
      });
      
      if (response.data.already_subscribed) {
        toast.info("Vous êtes déjà inscrit pour ce produit");
      } else {
        toast.success("Vous serez notifié dès que le produit sera disponible !");
      }
      setShowNotifyModal(false);
      setNotifyEmail("");
    } catch (error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setNotifyLoading(false);
    }
  };

  const handlePriceAlert = async (e) => {
    e.preventDefault();
    if (!priceAlertEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    
    setPriceAlertLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/products/${productId}/price-alert`, {
        email: priceAlertEmail,
        product_id: productId,
        target_price: targetPrice ? parseInt(targetPrice) : null
      });
      
      if (response.data.already_subscribed) {
        toast.info(response.data.message);
      } else {
        toast.success(response.data.message);
      }
      setShowPriceAlertModal(false);
      setPriceAlertEmail("");
      setTargetPrice("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setPriceAlertLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20" data-testid="product-page">
      <SEO 
        title={product.name}
        description={product.short_description || product.description?.slice(0, 160)}
        image={getImageUrl(product.images?.[0])}
        url={`/product/${product.product_id}`}
        type="product"
        product={product}
      />
      {/* Breadcrumb */}
      <div className="bg-[#F5F5F7] dark:bg-[#1C1C1E] py-4">
        <div className="container-lumina">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Accueil
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link
              to={`/category/${product.category}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {getCategoryName(product.category)}
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <section className="py-12 md:py-16">
        <div className="container-lumina">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square rounded-3xl overflow-hidden bg-[#F5F5F7] dark:bg-[#1C1C1E]"
              >
                <img
                  src={getImageUrl(product.images?.[selectedImage], "/placeholder.jpg")}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                        selectedImage === index
                          ? "border-black dark:border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Animated Specs Banner */}
              <ProductSpecsBanner 
                specs={product.specs} 
                vehicleSpecs={product.vehicle_specs}
                category={product.category}
              />
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {product.is_new && <span className="badge-new">Nouveau</span>}
                {product.is_promo && discount > 0 && (
                  <span className="badge-promo">-{discount}%</span>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
                data-testid="product-name"
              >
                {product.name}
              </h1>

              {/* Short Description & Share */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <p className="text-body-lg">{product.short_description}</p>
                <ShareButtons product={product} />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-3xl font-semibold price-fcfa"
                  data-testid="product-price"
                >
                  {formatPrice(currentPrice)}
                </span>
                {product.original_price && product.original_price > currentPrice && (
                  <span className="text-xl text-muted-foreground line-through price-fcfa">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>

              {/* Customs Status for Vehicles */}
              {product.category === "automobile" && product.vehicle_specs?.customs_status && (
                <div 
                  data-testid="vehicle-customs-status"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-4 ${
                  product.vehicle_specs.customs_status === "dedouane" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                }`}>
                  {product.vehicle_specs.customs_status === "dedouane" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Prix dédouané (prêt à immatriculer)
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Prix sous douane (frais de dédouanement non inclus)
                    </>
                  )}
                </div>
              )}

              {/* Variant Selection for Phones */}
              {product.has_variants && product.variants?.length > 0 && (
                <div className="space-y-6 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  {/* Capacity Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Capacité {selectedCapacity && <span className="text-orange-600">: {CAPACITY_LABELS[selectedCapacity] || selectedCapacity}</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueCapacities().map((capacity) => {
                        const variantForCapacity = product.variants.find(v => v.capacity === capacity);
                        return (
                          <button
                            key={capacity}
                            onClick={() => {
                              setSelectedCapacity(capacity);
                              // Reset color selection and find first available color
                              const colorsForCapacity = product.variants
                                .filter(v => v.capacity === capacity)
                                .map(v => v.color);
                              if (colorsForCapacity.length > 0) {
                                setSelectedColor(colorsForCapacity[0]);
                              }
                            }}
                            className={cn(
                              "px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                              selectedCapacity === capacity
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                                : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                            )}
                          >
                            <div className="font-semibold">{CAPACITY_LABELS[capacity] || capacity}</div>
                            {variantForCapacity && (
                              <div className="text-xs mt-1 text-muted-foreground">
                                {formatPrice(variantForCapacity.price)}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selection for Variant */}
                  {getAvailableColors().length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Couleur {selectedColor && <span className="text-orange-600">: {COLOR_INFO[selectedColor]?.name || selectedColor}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableColors().map((color) => {
                          const colorInfo = COLOR_INFO[color] || { name: color, hex: "#ccc" };
                          const variantForColor = product.variants.find(
                            v => v.capacity === selectedCapacity && v.color === color
                          );
                          const isOutOfStock = variantForColor && variantForColor.stock <= 0;
                          
                          return (
                            <button
                              key={color}
                              onClick={() => !isOutOfStock && setSelectedColor(color)}
                              disabled={isOutOfStock}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                                selectedColor === color
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                  : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30",
                                isOutOfStock && "opacity-50 cursor-not-allowed line-through"
                              )}
                            >
                              <span 
                                className="w-5 h-5 rounded-full border border-gray-300 shadow-inner"
                                style={{ backgroundColor: colorInfo.hex }}
                              />
                              <span>{colorInfo.name}</span>
                              {isOutOfStock && <span className="text-xs text-red-500">(Épuisé)</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock info for selected variant */}
                  {selectedVariant && (
                    <div className={cn(
                      "text-sm px-3 py-2 rounded-lg",
                      selectedVariant.stock > 5 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : selectedVariant.stock > 0 
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {selectedVariant.stock > 5 
                        ? `✓ En stock (${selectedVariant.stock} disponibles)`
                        : selectedVariant.stock > 0 
                          ? `⚠ Stock limité (${selectedVariant.stock} restants)`
                          : "✗ Rupture de stock"}
                    </div>
                  )}
                </div>
              )}

              {/* On Order Badge */}
              {product.is_on_order && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-orange-700 dark:text-orange-300">Disponible sur commande</p>
                      {product.order_delivery_days && (
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          Livraison estimée : {product.order_delivery_days} jours
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Alert Button */}
              {(currentStock > 0 || product.is_on_order) && (
                <button
                  onClick={() => setShowPriceAlertModal(true)}
                  className="mb-8 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                  data-testid="price-alert-btn"
                >
                  <TrendingDown className="w-4 h-4" />
                  Alerte baisse de prix
                </button>
              )}

              {/* Color Selection - Only for products WITHOUT variants */}
              {!product.has_variants && product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    Couleur {selectedColor && <span className="text-muted-foreground">: {selectedColor}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          selectedColor === color
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                            : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {!product.has_variants && product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    Taille {selectedSize && <span className="text-muted-foreground">: {selectedSize}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center",
                          selectedSize === size
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                            : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Quantité</label>
                <div className="flex items-center border border-black/10 dark:border-white/10 rounded-xl w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn rounded-l-xl"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(currentStock, quantity + 1))
                    }
                    disabled={quantity >= currentStock}
                    className="quantity-btn rounded-r-xl"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {!product.has_variants && currentStock <= 5 && currentStock > 0 && (
                  <p className="text-sm text-orange-500 mt-2">
                    Plus que {currentStock} en stock
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mb-8">
                {/* Add to Cart - NOT for vehicles/immobilier */}
                {!NO_CART_CATEGORIES.includes(product.category?.toLowerCase()) && (
                  currentStock === 0 && !product.is_on_order ? (
                    <button
                      onClick={() => setShowNotifyModal(true)}
                      className="btn-primary w-full justify-center py-4 text-base bg-orange-500 border-orange-500 hover:bg-orange-600"
                      data-testid="notify-stock-btn"
                    >
                      <Bell className="w-5 h-5" />
                      Prévenez-moi quand disponible
                    </button>
                  ) : product.is_on_order ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      className="btn-primary w-full justify-center py-4 text-base bg-orange-500 border-orange-500 hover:bg-orange-600"
                      data-testid="add-to-cart-btn"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Commander ce produit
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      className="btn-primary w-full justify-center py-4 text-base"
                      data-testid="add-to-cart-btn"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Ajouter au panier
                    </button>
                  )
                )}

                {/* Appointment Button - PROMINENT for vehicles/immobilier */}
                {APPOINTMENT_CATEGORIES.includes(product.category?.toLowerCase()) && (
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="btn-primary w-full justify-center py-4 text-base bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                    data-testid="appointment-btn"
                  >
                    <Calendar className="w-5 h-5" />
                    Prendre rendez-vous pour une visite
                  </button>
                )}

                <button
                  onClick={handleWhatsAppOrder}
                  className="btn-secondary w-full justify-center py-4 text-base bg-[#25D366] border-[#25D366] text-white hover:bg-[#25D366]/90"
                  data-testid="whatsapp-order-btn"
                >
                  <MessageCircle className="w-5 h-5" />
                  Commander via WhatsApp
                </button>

                <button
                  onClick={() => toggleWishlist(product.product_id)}
                  disabled={wishlistLoading}
                  className={cn(
                    "btn-secondary w-full justify-center py-4 text-base",
                    inWishlist && "bg-red-50 border-red-200 text-red-600"
                  )}
                  data-testid="wishlist-btn"
                >
                  <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
                  {inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                </button>
              </div>

              {/* Stock Status & Delivery Info */}
              <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                {/* Stock Status */}
                <div className="flex items-center gap-3 mb-3">
                  {currentStock > 5 ? (
                    <>
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        En stock ({currentStock} disponibles)
                      </span>
                    </>
                  ) : currentStock > 0 ? (
                    <>
                      <span className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        Stock limité - Plus que {currentStock} !
                      </span>
                    </>
                  ) : product.is_on_order ? (
                    <>
                      <span className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Disponible sur commande
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Rupture de stock
                      </span>
                    </>
                  )}
                </div>
                
                {/* Delivery Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4" />
                  {currentStock > 0 ? (
                    <span>Livraison sous <strong className="text-foreground">24 à 48 heures</strong> à Dakar</span>
                  ) : product.is_on_order ? (
                    <span>Livraison sous <strong className="text-foreground">{product.order_delivery_days || 7}-{(product.order_delivery_days || 7) + 3} jours</strong></span>
                  ) : (
                    <span>Prévenez-moi quand disponible</span>
                  )}
                </div>
                
                {/* Regional delivery */}
                {currentStock > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Livraison 3-5 jours pour les autres régions du Sénégal
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-black/10 dark:border-white/10 mb-8">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Livraison rapide</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Garantie</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Retour facile</p>
                </div>
              </div>

              {/* Visual Specs Cards - Like Real Estate Style */}
              {product.specs && Object.keys(product.specs).filter(k => product.specs[k] && product.specs[k] !== "").length > 0 && (
                <div className="mb-8" data-testid="visual-specs-section">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Caractéristiques
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="specs-cards-grid">
                    {/* TV Specs */}
                    {product.specs.screen_size && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800" data-testid="spec-card-screen-size">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Écran</p>
                          <p className="font-semibold">{product.specs.screen_size}&quot;</p>
                        </div>
                      </div>
                    )}
                    {product.specs.resolution && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800" data-testid="spec-card-resolution">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Tv className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Résolution</p>
                          <p className="font-semibold">{product.specs.resolution}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.smart_tv === "Oui" && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800" data-testid="spec-card-smart-tv">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Smart TV</p>
                          <p className="font-semibold">Connectée</p>
                        </div>
                      </div>
                    )}
                    {product.specs.wifi === "Oui" && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800" data-testid="spec-card-wifi">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Wi-Fi</p>
                          <p className="font-semibold">Intégré</p>
                        </div>
                      </div>
                    )}
                    {product.specs.bluetooth === "Oui" && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Bluetooth className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bluetooth</p>
                          <p className="font-semibold">Oui</p>
                        </div>
                      </div>
                    )}
                    {product.specs.hdmi_ports && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">HDMI</p>
                          <p className="font-semibold">{product.specs.hdmi_ports} ports</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Climatiseur Specs */}
                    {product.specs.puissance && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800" data-testid="spec-card-puissance">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Snowflake className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Puissance</p>
                          <p className="font-semibold">{product.specs.puissance}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.inverter === "Oui" && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-100 dark:border-green-800" data-testid="spec-card-inverter">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Technologie</p>
                          <p className="font-semibold">Inverter</p>
                        </div>
                      </div>
                    )}
                    {product.specs.surface && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800" data-testid="spec-card-surface">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Square className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Surface</p>
                          <p className="font-semibold">{product.specs.surface}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Matelas Specs */}
                    {product.specs.dimension && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-100 dark:border-violet-800" data-testid="spec-card-dimension">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dimensions</p>
                          <p className="font-semibold">{product.specs.dimension}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.epaisseur && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                          <Bed className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Épaisseur</p>
                          <p className="font-semibold">{product.specs.epaisseur}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.fermete && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <Gauge className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fermeté</p>
                          <p className="font-semibold">{product.specs.fermete}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Phone Specs */}
                    {product.specs.storage && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800" data-testid="spec-card-storage">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Stockage</p>
                          <p className="font-semibold">{product.specs.storage}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.color && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-100 dark:border-pink-800" data-testid="spec-card-color">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                          <Palette className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Couleur</p>
                          <p className="font-semibold">{product.specs.color}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.display && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-100 dark:border-teal-800" data-testid="spec-card-display">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Écran</p>
                          <p className="font-semibold">{product.specs.display}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Automobile/Immobilier Specs */}
                    {product.specs.kilometrage && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800" data-testid="spec-card-kilometrage">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Gauge className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Kilométrage</p>
                          <p className="font-semibold">{product.specs.kilometrage}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.carburant && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800" data-testid="spec-card-carburant">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Fuel className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carburant</p>
                          <p className="font-semibold">{product.specs.carburant}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.chambres && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800" data-testid="spec-card-chambres">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Bed className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Chambres</p>
                          <p className="font-semibold">{product.specs.chambres}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.salles_bain && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 rounded-xl border border-sky-100 dark:border-sky-800" data-testid="spec-card-salles-bain">
                        <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                          <Bath className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Salles de bain</p>
                          <p className="font-semibold">{product.specs.salles_bain}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.superficie && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 rounded-xl border border-lime-100 dark:border-lime-800" data-testid="spec-card-superficie">
                        <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center">
                          <Square className="w-5 h-5 text-lime-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Superficie</p>
                          <p className="font-semibold">{product.specs.superficie}</p>
                        </div>
                      </div>
                    )}
                    {product.specs.localisation && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-100 dark:border-red-800">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Localisation</p>
                          <p className="font-semibold">{product.specs.localisation}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Warranty - Common */}
                    {product.specs.warranty && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Garantie</p>
                          <p className="font-semibold">{product.specs.warranty}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description & Specs */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger className="text-base font-medium">
                    Description
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {product.specs && Object.keys(product.specs).length > 0 && (
                  <AccordionItem value="specs">
                    <AccordionTrigger className="text-base font-medium">
                      Caractéristiques techniques
                    </AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-3">
                        {Object.entries(product.specs).filter(([_, value]) => value && value !== "").map(([key, value]) => {
                          // French labels for specs
                          const labels = {
                            screen_size: "Taille d'écran",
                            resolution: "Résolution",
                            smart_tv: "Smart TV",
                            android_tv: "Android TV",
                            google_tv: "Google TV",
                            wifi: "Wi-Fi",
                            bluetooth: "Bluetooth",
                            netflix: "Netflix",
                            youtube: "YouTube",
                            hdmi_ports: "Ports HDMI",
                            usb_ports: "Ports USB",
                            warranty: "Garantie",
                            puissance: "Puissance",
                            inverter: "Inverter",
                            surface: "Surface recommandée",
                            dimension: "Dimensions",
                            epaisseur: "Épaisseur",
                            fermete: "Fermeté",
                            matiere: "Matière"
                          };
                          const label = labels[key] || key.replace(/_/g, " ");
                          const displayValue = value === "Oui" ? "✅ Oui" : value === "Non" ? "❌ Non" : value;
                          return (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <dt className="text-muted-foreground capitalize">{label}</dt>
                              <dd className="font-medium">{key === "screen_size" ? `${displayValue}"` : displayValue}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="shipping">
                  <AccordionTrigger className="text-base font-medium">
                    Livraison & Retours
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Livraison Dakar :</strong>{" "}
                        24-48h - 2 500 FCFA
                      </p>
                      <p>
                        <strong className="text-foreground">Livraison Régions :</strong>{" "}
                        3-5 jours - 3 500 FCFA
                      </p>
                      <p>
                        <strong className="text-foreground">Retours :</strong> 7 jours
                        pour retourner votre produit
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        <div className="container-lumina">
          {/* Frequently Bought Together - DISABLED: Needs manual product selection */}
          {/* TODO: Enable when admin can manually select related products */}
          {/* <FrequentlyBoughtTogether productId={productId} currentProduct={product} /> */}
        </div>

        {/* Similar Products Section */}
        <div className="container-lumina mt-8">
          <SimilarProducts productId={productId} category={product?.category} />
        </div>

        {/* Reviews Section */}
        <div className="container-lumina pb-24 lg:pb-16">
          <ProductReviews productId={productId} />
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-[#1C1C1E] border-t border-black/10 dark:border-white/10 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
            <p className="font-bold text-lg">{formatPrice(product.price)}</p>
          </div>
          <button
            onClick={() => toggleWishlist(product.product_id)}
            className={cn(
              "p-3 rounded-xl border transition-colors flex-shrink-0",
              inWishlist
                ? "border-red-500 text-red-500"
                : "border-black/10 dark:border-white/10"
            )}
          >
            <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
          </button>
          {product.stock === 0 ? (
            <button
              onClick={() => setShowNotifyModal(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 bg-orange-500 border-orange-500"
            >
              <Bell className="w-5 h-5" />
              Prévenez-moi
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Stock Notification Modal */}
      {showNotifyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowNotifyModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-4">
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prévenez-moi</h3>
              <p className="text-muted-foreground text-sm">
                Entrez votre email pour être notifié dès que <strong>{product.name}</strong> sera de nouveau disponible.
              </p>
            </div>

            <form onSubmit={handleNotifyStock} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:border-orange-500 outline-none transition-colors"
                  data-testid="notify-email-input"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="flex-1 py-3 rounded-xl border border-black/10 dark:border-white/10 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                  data-testid="notify-submit-btn"
                >
                  {notifyLoading ? "Envoi..." : "Me notifier"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Price Alert Modal */}
      {showPriceAlertModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPriceAlertModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <TrendingDown className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Alerte baisse de prix</h3>
              <p className="text-muted-foreground text-sm">
                Recevez une notification quand <strong>{product.name}</strong> baisse de prix ou passe en promotion.
              </p>
            </div>

            <form onSubmit={handlePriceAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Votre email</label>
                <input
                  type="email"
                  value={priceAlertEmail}
                  onChange={(e) => setPriceAlertEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:border-blue-500 outline-none transition-colors"
                  data-testid="price-alert-email-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix cible (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={`Actuel: ${product.price} FCFA`}
                    className="w-full h-12 px-4 pr-16 rounded-xl border border-black/10 dark:border-white/10 bg-transparent focus:border-blue-500 outline-none transition-colors"
                    data-testid="price-alert-target-input"
                    max={product.price - 1}
                    min={1}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    FCFA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Laissez vide pour être notifié de toute baisse de prix
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPriceAlertModal(false)}
                  className="flex-1 py-3 rounded-xl border border-black/10 dark:border-white/10 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={priceAlertLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  data-testid="price-alert-submit-btn"
                >
                  {priceAlertLoading ? "Envoi..." : "Créer l'alerte"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        product={product}
        appointmentType={product?.category === "automobile" ? "automobile" : "general"}
      />
    </main>
  );
}
