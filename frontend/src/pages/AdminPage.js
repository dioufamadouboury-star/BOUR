import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import ProductFormModal from "../components/ProductFormModal";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Menu,
  X,
  FileText,
  Download,
  Zap,
  Mail,
  Upload,
  Image as ImageIcon,
  Loader2,
  BarChart3,
  Tag,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Palette,
  Ruler,
  Building2,
  ChevronDown,
  GripVertical,
  Sparkles,
  Briefcase,
  ClipboardList,
  Gift,
  Home,
  Car,
  MessageSquare,
  Smartphone,
  Calendar,
  Target,
  Globe,
} from "lucide-react";
import { formatPrice, formatDate, getOrderStatusDisplay, getPaymentStatusDisplay, getCategoryName, getImageUrl } from "../lib/utils";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import EmailCampaignsPage from "./EmailCampaignsPage";
import FlashSalesAdminPage from "./FlashSalesAdminPage";
import AnalyticsDashboard from "./AnalyticsDashboard";
import PromoCodesAdminPage from "./PromoCodesAdminPage";
import AbandonedCartsAdminPage from "./AbandonedCartsAdminPage";
import { ServiceProvidersAdmin, ServiceRequestsAdmin } from "./ServiceAdminComponents";
import { CommercialDashboard } from "./CommercialDashboard";
import GiftBoxAdmin from "../components/Admin/GiftBoxAdmin";
import ImmobilierAdmin from "../components/Admin/ImmobilierAdmin";
import CovoiturageAdmin from "../components/Admin/CovoiturageAdmin";
import ReservationsAdmin from "../components/Admin/ReservationsAdmin";
import MarketingAdmin from "../components/Admin/MarketingAdmin";
import PlatformResetAdmin from "../components/Admin/PlatformResetAdmin";
import AdsGuideAdmin from "../components/Admin/AdsGuideAdmin";
import ResellersAdmin from "../components/Admin/ResellersAdmin";
import B2BAdmin from "../components/Admin/B2BAdmin";
import SourcingAdmin from "../components/Admin/SourcingAdmin";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const menuItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/admin" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { id: "commercial", label: "Gestion Commerciale", icon: FileText, href: "/admin/commercial" },
  { id: "products", label: "Produits", icon: Package, href: "/admin/products" },
  { id: "flash-sales", label: "Ventes Flash", icon: Zap, href: "/admin/flash-sales" },
  { id: "gift-boxes", label: "Coffrets Cadeaux", icon: Gift, href: "/admin/gift-boxes" },
  { id: "orders", label: "Commandes", icon: ShoppingCart, href: "/admin/orders" },
  { id: "reservations", label: "Réservations", icon: Calendar, href: "/admin/reservations" },
  { id: "appointments", label: "Rendez-vous", icon: Clock, href: "/admin/appointments" },
  { id: "service-providers", label: "Prestataires", icon: Briefcase, href: "/admin/service-providers" },
  { id: "service-requests", label: "Demandes Services", icon: ClipboardList, href: "/admin/service-requests" },
  { id: "users", label: "Utilisateurs", icon: Users, href: "/admin/users" },
  { id: "marketing", label: "Marketing", icon: TrendingUp, href: "/admin/marketing" },
  { id: "ads-guide", label: "Guide Publicités", icon: Target, href: "/admin/ads-guide" },
  { id: "promo-codes", label: "Codes Promo", icon: Tag, href: "/admin/promo-codes" },
  { id: "abandoned-carts", label: "Paniers abandonnés", icon: ShoppingBag, href: "/admin/abandoned-carts" },
  { id: "immobilier", label: "Immobilier", icon: Home, href: "/admin/immobilier" },
  { id: "automobile", label: "Automobile", icon: Car, href: "/admin/automobile" },
  { id: "sms", label: "SMS", icon: Smartphone, href: "/admin/sms" },
  { id: "whatsapp", label: "WhatsApp Bot", icon: MessageSquare, href: "/admin/whatsapp" },
  { id: "email", label: "Campagnes Email", icon: Mail, href: "/admin/email" },
  { id: "resellers", label: "Revendeurs", icon: Users, href: "/admin/resellers" },
  { id: "b2b", label: "Partenaires B2B", icon: Building2, href: "/admin/b2b" },
  { id: "sourcing", label: "Import Chine", icon: Globe, href: "/admin/sourcing" },
  { id: "reset", label: "Réinitialisation", icon: AlertCircle, href: "/admin/reset" },
];

const categories = [
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
    "Réfrigérateurs", "Congélateurs", "Machine à laver", "Sèche-linge",
    "Climatiseur", "Ventilateur", "Chauffage", "Micro-ondes", "Four",
    "Hotte aspirante", "Lave-vaisselle", "Mixeur & Blender", "Fer à repasser",
    "Aspirateur", "Cuisinière", "Chauffe-eau", "Autres"
  ],
  decoration: [
    "Salons & Canapés", "Chambres & Lits", "Lustres & Lampes", "Cadres & Art",
    "Plantes & Vases", "Coussins & Tapis", "Rideaux", "Miroirs",
    "Tables & Chaises", "Rangements", "Cuisine & Salle de bain", "Autres"
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

const defaultColors = [
  { name: "Noir", value: "#000000" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Gris", value: "#808080" },
  { name: "Rouge", value: "#FF0000" },
  { name: "Bleu", value: "#0000FF" },
  { name: "Vert", value: "#00FF00" },
  { name: "Jaune", value: "#FFFF00" },
  { name: "Rose", value: "#FFC0CB" },
  { name: "Or", value: "#FFD700" },
  { name: "Argent", value: "#C0C0C0" },
];

const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export default function AdminPage() {
  const { user, token, logout, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fixingImages, setFixingImages] = useState(false);
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("general");
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    short_description: "",
    price: "",
    original_price: "",
    category: "electronique",
    subcategory: "",
    images: [],
    stock: "",
    featured: false,
    is_new: false,
    is_promo: false,
    brand: "",
    colors: [],
    sizes: [],
    specs: {},
    is_on_order: false,
    order_delivery_days: "",
    meta_title: "",
    meta_description: "",
  });

  // Stable form field update function to prevent re-renders
  const updateFormField = useCallback((field, value) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const currentPage = location.pathname.split("/").pop() || "admin";

  // Reset form
  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      short_description: "",
      price: "",
      original_price: "",
      category: "electronique",
      subcategory: "",
      images: [],
      stock: "",
      featured: false,
      is_new: false,
      is_promo: false,
      brand: "",
      colors: [],
      sizes: [],
      specs: {},
      is_on_order: false,
      order_delivery_days: "",
    });
    setEditingProduct(null);
    setActiveFormTab("general");
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages = [...productForm.images];

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
          let imageUrl = response.data.url;
          newImages.push(imageUrl);
        }
      } catch (error) {
        toast.error(`Erreur upload: ${error.response?.data?.detail || 'Erreur'}`);
      }
    }

    setProductForm({ ...productForm, images: newImages });
    setUploadingImage(false);
  };

  // Remove image from list
  const handleRemoveImage = (index) => {
    const newImages = productForm.images.filter((_, i) => i !== index);
    setProductForm({ ...productForm, images: newImages });
  };

  // AI Image Analysis for product creation
  const handleAIAnalyzeImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop grande (max 10MB)");
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
        
        // Update form with AI-extracted data
        setProductForm(prev => ({
          ...prev,
          name: product.name || prev.name,
          description: product.description || prev.description,
          short_description: product.short_description || prev.short_description,
          category: product.category || prev.category,
          subcategory: product.subcategory || prev.subcategory,
          brand: product.brand || prev.brand,
          price: product.estimated_price?.toString() || prev.price,
          colors: product.colors?.length > 0 ? product.colors : prev.colors,
          is_new: product.is_new ?? prev.is_new,
          weight: product.weight || prev.weight,
          dimensions: product.dimensions || prev.dimensions,
          material: product.material || prev.material,
          features: product.features || prev.features,
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
            // Convert relative URL to absolute URL
            let imageUrl = uploadResponse.data.url;
            if (imageUrl.startsWith('/api/')) {
              imageUrl = `${API_URL}${imageUrl}`;
            }
            setProductForm(prev => ({
              ...prev,
              images: [...prev.images, imageUrl]
            }));
          }
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
        }

        const confidenceEmoji = product.confidence === 'high' ? '🎯' : product.confidence === 'medium' ? '✅' : '⚠️';
        toast.success(`${confidenceEmoji} Produit analysé avec succès !`);
        
        if (product.suggested_tags?.length > 0) {
          toast.info(`Tags suggérés: ${product.suggested_tags.join(', ')}`);
        }
      } else {
        toast.error(response.data.error || "Erreur d'analyse");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de l'analyse IA");
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Toggle color selection
  const handleColorToggle = (colorName) => {
    const newColors = productForm.colors.includes(colorName)
      ? productForm.colors.filter(c => c !== colorName)
      : [...productForm.colors, colorName];
    setProductForm({ ...productForm, colors: newColors });
  };

  // Toggle size selection
  const handleSizeToggle = (size) => {
    const newSizes = productForm.sizes.includes(size)
      ? productForm.sizes.filter(s => s !== size)
      : [...productForm.sizes, size];
    setProductForm({ ...productForm, sizes: newSizes });
  };

  // Add custom spec
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  
  const handleAddSpec = () => {
    if (newSpecKey && newSpecValue) {
      setProductForm({
        ...productForm,
        specs: { ...productForm.specs, [newSpecKey]: newSpecValue }
      });
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const handleRemoveSpec = (key) => {
    const newSpecs = { ...productForm.specs };
    delete newSpecs[key];
    setProductForm({ ...productForm, specs: newSpecs });
  };

  // Open form for editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      short_description: product.short_description || "",
      price: product.price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      category: product.category || "electronique",
      subcategory: product.subcategory || "",
      images: product.images || [],
      stock: product.stock?.toString() || "",
      featured: product.featured || false,
      is_new: product.is_new || false,
      is_promo: product.is_promo || false,
      brand: product.brand || "",
      colors: product.colors || [],
      sizes: product.sizes || [],
      specs: product.specs || {},
      is_on_order: product.is_on_order || false,
      order_delivery_days: product.order_delivery_days?.toString() || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
    });
    setShowProductForm(true);
    setActiveFormTab("general");
  };

  // Open form for new product
  const handleNewProduct = () => {
    resetProductForm();
    setShowProductForm(true);
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!isAdmin) {
      navigate("/");
      toast.error("Accès non autorisé");
      return;
    }

    fetchData();
  }, [isAuthenticated, isAdmin, authLoading, navigate, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (currentPage === "admin" || currentPage === "") {
        const response = await axios.get(`${API_URL}/api/admin/stats`, { headers });
        setStats(response.data);
        // Fetch appointment stats for dashboard
        try {
          const appointmentStatsRes = await axios.get(`${API_URL}/api/admin/appointments/stats`, { headers });
          setAppointmentStats(appointmentStatsRes.data);
        } catch (e) {
          console.log("Appointments stats not available");
        }
      }

      if (currentPage === "products" || currentPage === "admin") {
        const response = await axios.get(`${API_URL}/api/products?limit=500`);
        setProducts(response.data || []);
      }

      if (currentPage === "orders" || currentPage === "admin") {
        const response = await axios.get(`${API_URL}/api/admin/orders`, { headers });
        // Handle both array and object response formats
        const ordersData = Array.isArray(response.data) ? response.data : (response.data.orders || []);
        setOrders(ordersData);
      }

      if (currentPage === "users") {
        const response = await axios.get(`${API_URL}/api/admin/users`, { headers });
        // Handle both array and object response formats
        const usersData = Array.isArray(response.data) ? response.data : (response.data.users || []);
        setUsers(usersData);
      }

      if (currentPage === "appointments") {
        const typeParam = appointmentFilter ? `?appointment_type=${appointmentFilter}` : "";
        const response = await axios.get(`${API_URL}/api/admin/appointments${typeParam}`, { headers });
        setAppointments(Array.isArray(response.data) ? response.data : []);
        const statsRes = await axios.get(`${API_URL}/api/admin/appointments/stats`, { headers });
        setAppointmentStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductFormLoading(true);

    try {
      // Validate minimum required fields
      if (!productForm.name || !productForm.name.trim()) {
        toast.error("Le nom du produit est obligatoire");
        setProductFormLoading(false);
        return;
      }

      if (!productForm.price || parseInt(productForm.price) <= 0) {
        toast.error("Le prix doit être supérieur à 0");
        setProductFormLoading(false);
        return;
      }

      // Add default image if no images provided
      const images = productForm.images.length > 0 
        ? productForm.images 
        : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"];

      const productData = {
        name: productForm.name.trim(),
        description: productForm.description?.trim() || productForm.name.trim(),
        short_description: productForm.short_description?.trim() || "",
        price: parseInt(productForm.price) || 0,
        original_price: productForm.original_price ? parseInt(productForm.original_price) : null,
        category: productForm.category || "electronique",
        subcategory: productForm.subcategory || null,
        images,
        stock: parseInt(productForm.stock) || 0,
        featured: productForm.featured || false,
        is_new: productForm.is_new || false,
        is_promo: productForm.is_promo || false,
        brand: productForm.brand?.trim() || null,
        colors: productForm.colors || [],
        sizes: productForm.sizes || [],
        specs: productForm.specs || {},
        is_on_order: productForm.is_on_order || false,
        order_delivery_days: productForm.order_delivery_days ? parseInt(productForm.order_delivery_days) : null,
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

      setShowProductForm(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      console.error("Product submit error:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setProductFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/admin/products/${productId}`, { headers });
      toast.success("Produit supprimé");
      // Mise à jour immédiate de l'état local
      setProducts(prevProducts => prevProducts.filter(p => p.product_id !== productId));
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        { order_status: newStatus },
        { headers }
      );
      toast.success("Statut mis à jour avec succès");
      fetchData();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleAppointmentUpdate = async (appointmentId, status, extraData = {}) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(
        `${API_URL}/api/admin/appointments/${appointmentId}`,
        { status, ...extraData },
        { headers }
      );
      toast.success("Rendez-vous mis à jour");
      
      // If WhatsApp link is returned, open it
      if (response.data.whatsapp_link) {
        window.open(response.data.whatsapp_link, '_blank');
      }
      
      fetchData();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Confirmation modal state for appointments
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmForm, setConfirmForm] = useState({
    confirmed_date: "",
    confirmed_time: "",
    meeting_address: "",
    meeting_contact: "",
    send_whatsapp: true,
  });

  const openConfirmModal = (apt) => {
    setConfirmModal(apt);
    setConfirmForm({
      confirmed_date: apt.preferred_date || "",
      confirmed_time: apt.preferred_time || "",
      meeting_address: apt.meeting_address || "",
      meeting_contact: apt.meeting_contact || "",
      send_whatsapp: apt.contact_method === "whatsapp",
      send_email: true,
      send_sms: false,
    });
  };

  const handleConfirmSubmit = () => {
    if (!confirmModal) return;
    handleAppointmentUpdate(confirmModal.appointment_id, "confirmed", {
      confirmed_date: confirmForm.confirmed_date,
      confirmed_time: confirmForm.confirmed_time,
      meeting_address: confirmForm.meeting_address,
      meeting_contact: confirmForm.meeting_contact,
      send_whatsapp: confirmForm.send_whatsapp,
      send_email: confirmForm.send_email !== false,
      send_sms: confirmForm.send_sms || false,
    });
    setConfirmModal(null);
  };

  const [appointmentFilter, setAppointmentFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");

  // Fix all image URLs in database
  const handleFixImages = async () => {
    if (!confirm("Voulez-vous corriger toutes les URLs d'images ? Cette opération est sûre et ne supprime rien.")) return;
    
    setFixingImages(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/admin/fix-image-urls`, {}, { headers });
      
      if (response.data.success) {
        toast.success(`${response.data.products_fixed} produit(s) corrigé(s) sur ${response.data.products_checked}`);
        // Refresh products to show corrected images
        fetchData();
      } else {
        toast.error("Erreur lors de la correction");
      }
    } catch (error) {
      console.error("Error fixing images:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la correction des images");
    } finally {
      setFixingImages(false);
    }
  };

  // Download Monthly PDF Report
  const handleDownloadMonthlyReport = async () => {
    try {
      toast.info("Génération du rapport en cours...");
      const headers = { Authorization: `Bearer ${token}` };
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const response = await axios.get(
        `${API_URL}/api/admin/reports/monthly?month=${month}&year=${year}`,
        { 
          headers,
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const monthNames = ["", "janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
      link.setAttribute('download', `rapport_yama_${monthNames[month]}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Rapport téléchargé avec succès !");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Erreur lors de la génération du rapport");
    }
  };

  // Filter products by search AND category
  const filteredProducts = products.filter(
    (p) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    }
  );

  // Render sidebar
  const Sidebar = () => (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#1C1C1E] border-r border-black/5 dark:border-white/5 transform transition-transform duration-300 lg:translate-x-0",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-black/5 dark:border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/images/logo_yama_full.png" 
              alt="YAMA+" 
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-xs text-muted-foreground mt-2">Administration</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id || 
              (currentPage === "admin" && item.id === "dashboard");
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 mb-3">
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );

  // Stats Card Component
  const StatsCard = ({ icon: Icon, title, value, change, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-black/5 dark:border-white/5"
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-green-500" : "text-red-500"
          )}>
            {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold mt-4">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </motion.div>
  );

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={DollarSign}
          title="Chiffre d'affaires"
          value={formatPrice(stats?.total_revenue || 0)}
          change="+12%"
          trend="up"
          color="bg-green-500"
        />
        <StatsCard
          icon={ShoppingCart}
          title="Commandes"
          value={stats?.total_orders || 0}
          change="+8%"
          trend="up"
          color="bg-blue-500"
        />
        <StatsCard
          icon={Package}
          title="Produits"
          value={stats?.total_products || 0}
          color="bg-purple-500"
        />
        <StatsCard
          icon={Users}
          title="Clients"
          value={stats?.total_users || 0}
          change="+5%"
          trend="up"
          color="bg-orange-500"
        />
        <StatsCard
          icon={Clock}
          title="RDV en attente"
          value={appointmentStats?.pending || 0}
          color="bg-yellow-500"
        />
      </div>

      {/* Pending Appointments Alert */}
      {appointmentStats?.pending > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {appointmentStats.pending} demande(s) de rendez-vous en attente
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Cliquez pour les traiter
                </p>
              </div>
            </div>
            <Link
              to="/admin/appointments"
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
            >
              Voir les RDV
            </Link>
          </div>
        </div>
      )}

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Commandes récentes</h2>
            <Link to="/admin/orders" className="text-sm text-primary font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {(Array.isArray(orders) ? orders : []).slice(0, 5).map((order) => (
              <div key={order.order_id} className="p-4 flex items-center gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  order.status === "delivered" ? "bg-green-100 text-green-600" :
                  order.status === "processing" ? "bg-blue-100 text-blue-600" :
                  order.status === "shipped" ? "bg-purple-100 text-purple-600" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {order.status === "delivered" ? <CheckCircle className="w-5 h-5" /> :
                   order.status === "processing" ? <Clock className="w-5 h-5" /> :
                   <Package className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping?.full_name || order.customer_name || 'Client'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
              </div>
            ))}
            {(Array.isArray(orders) ? orders : []).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucune commande récente
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <button
              onClick={handleNewProduct}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Ajouter un produit</span>
            </button>
            <Link
              to="/admin/orders"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Gérer les commandes</span>
            </Link>
            <Link
              to="/admin/appointments"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">Rendez-vous</span>
            </Link>
            <Link
              to="/admin/flash-sales"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span className="font-medium">Ventes Flash</span>
            </Link>
            
            {/* Image Fix Button - Important for production */}
            <button
              onClick={handleFixImages}
              disabled={fixingImages}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {fixingImages ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
              <span className="font-medium">
                {fixingImages ? "Correction en cours..." : "Réparer les images"}
              </span>
            </button>
            
            {/* Monthly Report PDF Button */}
            <button
              onClick={handleDownloadMonthlyReport}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Rapport mensuel PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Products
  const renderProducts = () => {
    // Count products per category
    const categoryCounts = {
      all: products.length,
      electronique: products.filter(p => p.category === "electronique").length,
      electromenager: products.filter(p => p.category === "electromenager").length,
      decoration: products.filter(p => p.category === "decoration").length,
      beaute: products.filter(p => p.category === "beaute").length,
      automobile: products.filter(p => p.category === "automobile").length,
      immobilier: products.filter(p => p.category === "immobilier").length,
      services: products.filter(p => p.category === "services").length,
    };

    const categoryTabs = [
      { id: "all", label: "Tous", count: categoryCounts.all },
      { id: "electronique", label: "Électronique", count: categoryCounts.electronique },
      { id: "electromenager", label: "Électroménager", count: categoryCounts.electromenager },
      { id: "decoration", label: "Décoration", count: categoryCounts.decoration },
      { id: "beaute", label: "Mode & Beauté", count: categoryCounts.beaute },
      { id: "automobile", label: "Automobile", count: categoryCounts.automobile },
      { id: "immobilier", label: "Immobilier", count: categoryCounts.immobilier },
      { id: "services", label: "Services", count: categoryCounts.services },
    ];

    return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-muted-foreground">{filteredProducts.length} produits {productCategoryFilter !== "all" && `dans ${getCategoryName(productCategoryFilter)}`}</p>
        </div>
        <button
          onClick={handleNewProduct}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setProductCategoryFilter(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              productCategoryFilter === tab.id
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            data-testid={`product-tab-${tab.id}`}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              productCategoryFilter === tab.id
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                : "bg-black/10 dark:bg-white/10"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Produit</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Prix</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Stock</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product.product_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        <img
                          src={getImageUrl(product.images?.[0], "/placeholder.jpg")}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-medium">
                      {getCategoryName(product.category)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                      {product.original_price && product.original_price > product.price && (
                        <p className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      product.stock > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      product.stock > 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {product.stock} en stock
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.is_new && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                          NEW
                        </span>
                      )}
                      {product.is_promo && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">
                          PROMO
                        </span>
                      )}
                      {product.colors?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold">
                          {product.colors.length} couleurs
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/product/${product.product_id}`}
                        className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.product_id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Aucun produit trouvé
          </div>
        )}
      </div>
    </div>
  );
  };

  // Render Orders
  const renderOrders = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-muted-foreground">{orders.length} commandes au total</p>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Commande</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Client</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Paiement</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {orders.map((order) => (
                <tr key={order.order_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-mono text-sm font-medium">{order.order_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-sm">{order.shipping?.full_name || order.customer_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{order.shipping?.phone || order.customer_email || '-'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.order_status || order.status || 'pending'}
                      onChange={(e) => handleOrderStatusUpdate(order.order_id, e.target.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer",
                        (order.order_status || order.status) === "delivered" ? "bg-green-100 text-green-700" :
                        (order.order_status || order.status) === "shipped" ? "bg-purple-100 text-purple-700" :
                        (order.order_status || order.status) === "processing" ? "bg-blue-100 text-blue-700" :
                        (order.order_status || order.status) === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      )}
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En préparation</option>
                      <option value="shipped">Expédié</option>
                      <option value="delivered">Livré</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      order.payment_status === "paid" ? "bg-green-100 text-green-700" :
                      order.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {getPaymentStatusDisplay(order.payment_status)?.label || order.payment_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{formatDate(order.created_at)}</p>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/order/${order.order_id}`}
                      className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors inline-flex"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Aucune commande
          </div>
        )}
      </div>
    </div>
  );

  // Render Users
  const renderUsers = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground">{users.length} utilisateurs inscrits</p>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Utilisateur</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Rôle</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                        <span className="text-white dark:text-black font-bold text-sm">
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <p className="font-medium">{u.name}</p>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold",
                      u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {u.role === "admin" ? "Admin" : "Client"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Appointments
  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous & Visites</h1>
          <p className="text-muted-foreground">
            {appointmentStats?.pending || 0} en attente · {appointmentStats?.confirmed || 0} confirmé(s)
          </p>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "", label: "Tous" },
          { id: "immobilier", label: "Immobilier" },
          { id: "automobile", label: "Automobile" },
          { id: "general", label: "Général" },
        ].map(f => (
          <button key={f.id} onClick={() => { setAppointmentFilter(f.id); }}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              appointmentFilter === f.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-100 dark:bg-gray-800"
            )} data-testid={`filter-apt-${f.id || "all"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
          <p className="text-yellow-600 text-sm font-medium">En attente</p>
          <p className="text-2xl font-bold text-yellow-700">{appointmentStats?.pending || 0}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-green-600 text-sm font-medium">Confirmés</p>
          <p className="text-2xl font-bold text-green-700">{appointmentStats?.confirmed || 0}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-blue-600 text-sm font-medium">Terminés</p>
          <p className="text-2xl font-bold text-blue-700">{appointmentStats?.completed || 0}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-gray-600 text-sm font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-700">{appointmentStats?.total || 0}</p>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Client</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Bien/Produit</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Adresse RDV</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {appointments.map((apt) => {
                const typeBadge = apt.appointment_type === "immobilier"
                  ? { label: "Immobilier", cls: "bg-emerald-100 text-emerald-700" }
                  : apt.appointment_type === "automobile"
                  ? { label: "Automobile", cls: "bg-gray-200 text-gray-700" }
                  : { label: "Général", cls: "bg-blue-100 text-blue-700" };
                return (
                <tr key={apt.appointment_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  data-testid={`apt-row-${apt.appointment_id}`}>
                  <td className="p-4">
                    <span className={cn("px-2 py-1 rounded-lg text-xs font-bold", typeBadge.cls)}>
                      {typeBadge.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-sm">{apt.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{apt.customer?.phone}</p>
                    <p className="text-xs text-muted-foreground">{apt.customer?.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{apt.product_name || apt.property_title || 'Non spécifié'}</p>
                    <p className="text-xs text-muted-foreground">{apt.category || ''}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">{apt.confirmed_date || apt.preferred_date}</p>
                    <p className="text-xs text-muted-foreground">{apt.confirmed_time || apt.preferred_time}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{apt.meeting_address || apt.location || '-'}</p>
                    {apt.meeting_contact && <p className="text-xs text-muted-foreground">{apt.meeting_contact}</p>}
                  </td>
                  <td className="p-4">
                    <select
                      value={apt.status}
                      onChange={(e) => handleAppointmentUpdate(apt.appointment_id, e.target.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer",
                        apt.status === "confirmed" ? "bg-green-100 text-green-700" :
                        apt.status === "completed" ? "bg-blue-100 text-blue-700" :
                        apt.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {apt.status === "pending" && (
                        <button
                          onClick={() => openConfirmModal(apt)}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                          data-testid={`confirm-btn-${apt.appointment_id}`}
                        >
                          Confirmer
                        </button>
                      )}
                      {apt.customer?.phone && (
                        <a
                          href={`https://wa.me/${apt.customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '221')}?text=Bonjour ${apt.customer.name}, concernant votre demande de rendez-vous...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Contacter sur WhatsApp"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        {appointments.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Aucune demande de rendez-vous
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmModal(null)} data-testid="confirm-modal-overlay">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()} data-testid="confirm-modal">
            <h3 className="text-lg font-bold">Confirmer le rendez-vous</h3>
            <p className="text-sm text-muted-foreground">Client: {confirmModal.customer?.name} - {confirmModal.product_name || confirmModal.property_title || "Non spécifié"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Date confirmée</label>
                <input type="date" value={confirmForm.confirmed_date}
                  onChange={e => setConfirmForm(p => ({...p, confirmed_date: e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  data-testid="confirm-date" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Heure confirmée</label>
                <input type="time" value={confirmForm.confirmed_time}
                  onChange={e => setConfirmForm(p => ({...p, confirmed_time: e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  data-testid="confirm-time" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Adresse du rendez-vous *</label>
              <input type="text" value={confirmForm.meeting_address}
                onChange={e => setConfirmForm(p => ({...p, meeting_address: e.target.value}))}
                placeholder="Adresse complète du lieu de visite"
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm"
                data-testid="confirm-address" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Contact sur place</label>
              <input type="text" value={confirmForm.meeting_contact}
                onChange={e => setConfirmForm(p => ({...p, meeting_contact: e.target.value}))}
                placeholder="Nom et téléphone du contact"
                className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm"
                data-testid="confirm-contact" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirmForm.send_whatsapp}
                onChange={e => setConfirmForm(p => ({...p, send_whatsapp: e.target.checked}))}
                className="rounded" />
              Envoyer la confirmation par WhatsApp
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirmForm.send_email !== false}
                onChange={e => setConfirmForm(p => ({...p, send_email: e.target.checked}))}
                className="rounded" />
              Envoyer la confirmation par Email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirmForm.send_sms || false}
                onChange={e => setConfirmForm(p => ({...p, send_sms: e.target.checked}))}
                className="rounded" />
              Envoyer la confirmation par SMS
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
              <button onClick={handleConfirmSubmit}
                className="px-5 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600"
                data-testid="confirm-submit">Confirmer et envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Store address constant
  const STORE_ADDRESS = "Fass Paillote, Dakar, Sénégal";

  // Product Form Modal
  const renderProductFormModal = () => (
    <ProductFormModal
      isOpen={showProductForm}
      onClose={() => {
        setShowProductForm(false);
        // Delay clearing editingProduct to prevent race conditions
        setTimeout(() => setEditingProduct(null), 100);
      }}
      editingProduct={editingProduct}
      token={token}
      onSuccess={() => {
        // Refresh data after successful product creation/update
        fetchData();
      }}
    />
  );

  // Render content based on current page  // Render content based on current page
  const renderContent = () => {
  // ============ Automobile / Covoiturage Admin Section ============
  const renderAutomobile = () => (
    <CovoiturageAdmin token={token} />
  );

  // ============ SMS Admin Section — Workflows ============
  const SMSAdminSection = () => {
    const [activeTab, setActiveTab] = useState("promo");
    const [smsPhone, setSmsPhone] = useState("");
    const [smsMessage, setSmsMessage] = useState("");
    const [smsSending, setSmsSending] = useState(false);
    const [providers, setProviders] = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [bulkMessage, setBulkMessage] = useState("");
    const [bulkSending, setBulkSending] = useState(false);
    const [smsHistory, setSmsHistory] = useState([]);

    const SMS_TEMPLATES = {
      rdv_confirm: "Bonjour {{nom}}, votre rendez-vous du {{date}} à {{heure}} est confirmé. GROUPE YAMA+ - 78 382 75 75",
      rdv_rappel: "Rappel : votre rendez-vous YAMA+ est demain {{date}} à {{heure}}. Contactez-nous au 78 382 75 75 pour toute modification.",
      rdv_cancel: "Votre rendez-vous du {{date}} a été annulé. Pour replanifier : 78 382 75 75. GROUPE YAMA+",
      presta_mission: "Bonjour {{nom}}, une nouvelle mission vous a été assignée. Connectez-vous sur votre espace YAMA+ pour les détails. Répondez OUI pour confirmer.",
      presta_paiement: "Bonjour {{nom}}, votre paiement de {{montant}} FCFA a été effectué. Merci pour votre collaboration. GROUPE YAMA+",
      promo_general: "YAMA+ : Profitez de nos offres exclusives ! Jusqu'à -30% sur une sélection de produits. Commandez sur groupeyamaplus.com",
      promo_flash: "FLASH SALE YAMA+ : Offre valable 24h seulement ! -{{reduction}}% sur {{produit}}. Ne ratez pas cette opportunité !",
    };

    const fetchProviders = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/sms/providers`, { headers: { Authorization: `Bearer ${token}` } });
        setProviders(res.data.providers || []);
      } catch (e) { console.error(e); }
    };

    useEffect(() => { if (activeTab === "prestataires") fetchProviders(); }, [activeTab]);

    const sendSingle = async () => {
      if (!smsPhone || !smsMessage) { toast.error("Remplissez le numéro et le message"); return; }
      setSmsSending(true);
      try {
        await axios.post(`${API_URL}/api/admin/send-sms`, { phone: smsPhone, message: smsMessage }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("SMS envoyé !");
        setSmsMessage(""); setSmsPhone("");
      } catch (e) { toast.error(e.response?.data?.detail || "Erreur d'envoi SMS"); }
      setSmsSending(false);
    };

    const sendBulk = async (phones) => {
      if (!bulkMessage || phones.length === 0) { toast.error("Message et destinataires requis"); return; }
      setBulkSending(true);
      try {
        const res = await axios.post(`${API_URL}/api/admin/sms/bulk`, { phones, message: bulkMessage }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`${res.data.sent}/${res.data.total} SMS envoyés`);
        setBulkMessage(""); setSelectedProviders([]);
      } catch (e) { toast.error("Erreur envoi bulk"); }
      setBulkSending(false);
    };

    const tabCls = (t) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t ? "bg-black dark:bg-white text-white dark:text-black" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"}`;
    const inputCls = "w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm focus:border-blue-500 outline-none";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Centre SMS</h1>
          <p className="text-muted-foreground">Workflows et campagnes SMS automatiques</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button className={tabCls("promo")} onClick={() => setActiveTab("promo")}>Promotions</button>
          <button className={tabCls("rdv")} onClick={() => setActiveTab("rdv")}>Confirmations RDV</button>
          <button className={tabCls("prestataires")} onClick={() => setActiveTab("prestataires")}>Prestataires</button>
          <button className={tabCls("manuel")} onClick={() => setActiveTab("manuel")}>SMS Manuel</button>
        </div>

        {/* ─── TAB PROMO ─── */}
        {activeTab === "promo" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6 space-y-4">
              <h2 className="font-bold text-lg">Campagne Promotionnelle</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Templates prédéfinis</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "promo_general", label: "Promo générale" },
                    { key: "promo_flash", label: "Flash Sale" },
                  ].map(t => (
                    <button key={t.key} onClick={() => setBulkMessage(SMS_TEMPLATES[t.key])}
                      className="px-3 py-2 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-left hover:bg-blue-100 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Message ({bulkMessage.length}/160 caractères)</label>
                <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={4}
                  className={`${inputCls} resize-none`} placeholder="Votre message promotionnel..." maxLength={320} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Destinataires (un numéro par ligne)</label>
                <textarea rows={3} className={`${inputCls} resize-none`} placeholder="+221771234567&#10;+221781234567"
                  id="bulk-phones-promo" />
              </div>
              <button disabled={bulkSending} onClick={() => {
                const phones = document.getElementById("bulk-phones-promo").value.split("\n").map(p => p.trim()).filter(Boolean);
                sendBulk(phones);
              }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
                {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Envoyer la campagne
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB RDV ─── */}
        {activeTab === "rdv" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6 space-y-4">
              <h2 className="font-bold text-lg">Confirmation & Rappel Rendez-vous</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Templates RDV</label>
                <div className="grid gap-2">
                  {[
                    { key: "rdv_confirm", label: "Confirmation RDV", color: "green" },
                    { key: "rdv_rappel", label: "Rappel RDV (veille)", color: "blue" },
                    { key: "rdv_cancel", label: "Annulation RDV", color: "red" },
                  ].map(t => (
                    <button key={t.key} onClick={() => setSmsMessage(SMS_TEMPLATES[t.key])}
                      className={`px-4 py-3 text-xs rounded-xl text-left hover:opacity-80 transition-opacity ${
                        t.color === "green" ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" :
                        t.color === "blue" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300" :
                        "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                      }`}>
                      <span className="font-semibold block mb-1">{t.label}</span>
                      <span className="opacity-80">{SMS_TEMPLATES[t.key]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Numéro du client</label>
                  <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} className={inputCls} placeholder="+221 77 123 45 67" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Personnaliser le message</label>
                  <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} rows={2}
                    className={`${inputCls} resize-none`} placeholder="Message..." />
                </div>
              </div>
              <button onClick={sendSingle} disabled={smsSending} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
                {smsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Envoyer la confirmation
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB PRESTATAIRES ─── */}
        {activeTab === "prestataires" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6 space-y-4">
              <h2 className="font-bold text-lg">Notifications Prestataires</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Templates prestataires</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "presta_mission", label: "Nouvelle mission" },
                    { key: "presta_paiement", label: "Paiement effectué" },
                  ].map(t => (
                    <button key={t.key} onClick={() => setBulkMessage(SMS_TEMPLATES[t.key])}
                      className="px-3 py-2 text-xs rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-left hover:bg-purple-100 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Sélectionner les prestataires</label>
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun prestataire avec numéro de téléphone.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {providers.map(p => (
                      <label key={p.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <input type="checkbox"
                          checked={selectedProviders.includes(p.phone)}
                          onChange={e => setSelectedProviders(prev => e.target.checked ? [...prev, p.phone] : prev.filter(ph => ph !== p.phone))}
                          className="rounded" />
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.phone}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Message ({bulkMessage.length}/160)</label>
                <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={3}
                  className={`${inputCls} resize-none`} placeholder="Message pour les prestataires sélectionnés..." />
              </div>
              <button onClick={() => sendBulk(selectedProviders)} disabled={bulkSending}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
                {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Envoyer aux prestataires ({selectedProviders.length})
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB MANUEL ─── */}
        {activeTab === "manuel" && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6 space-y-4">
            <h2 className="font-bold text-lg">Envoyer un SMS Manuel</h2>
            <div>
              <label className="text-sm font-medium block mb-1">Numéro de téléphone</label>
              <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} className={inputCls} placeholder="+221 77 123 45 67" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Message ({smsMessage.length}/160)</label>
              <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} rows={4}
                className={`${inputCls} resize-none`} placeholder="Votre message..." />
            </div>
            <button onClick={sendSingle} disabled={smsSending} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
              {smsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Envoyer le SMS
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============ WhatsApp Bot Admin Section ============
  const renderWhatsAppBot = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Bot</h1>
        <p className="text-muted-foreground">Configuration et gestion du chatbot WhatsApp</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">Le chatbot WhatsApp nécessite les identifiants Meta API. Veuillez fournir votre <strong>WhatsApp Business API Token</strong> et <strong>Phone Number ID</strong> pour activer cette fonctionnalité.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold">Statut du Bot</h3>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">En attente de configuration</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Le bot répondra automatiquement aux messages des clients sur WhatsApp avec des informations sur vos produits, prix et disponibilités.</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-6">
          <h3 className="font-bold mb-4">Fonctionnalités prévues</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Réponse automatique aux demandes de prix</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Catalogue produits interactif</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Prise de rendez-vous automatique</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Transfert vers un agent humain</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Notifications de commandes</li>
          </ul>
        </div>
      </div>
    </div>
  );

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (currentPage) {
      case "admin":
      case "dashboard":
        return renderDashboard();
      case "commercial":
        return <CommercialDashboard token={token} />;
      case "products":
        return renderProducts();
      case "orders":
        return renderOrders();
      case "users":
        return renderUsers();
      case "appointments":
        return renderAppointments();
      case "service-providers":
        return <ServiceProvidersAdmin token={token} />;
      case "service-requests":
        return <ServiceRequestsAdmin token={token} />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "flash-sales":
        return <FlashSalesAdminPage />;
      case "gift-boxes":
        return <GiftBoxAdmin token={token} />;
      case "email":
        return <EmailCampaignsPage />;
      case "promo-codes":
        return <PromoCodesAdminPage />;
      case "abandoned-carts":
        return <AbandonedCartsAdminPage />;
      case "immobilier":
        return <ImmobilierAdmin token={token} />;
      case "automobile":
        return renderAutomobile();
      case "sms":
        return <SMSAdminSection />;
      case "whatsapp":
        return renderWhatsAppBot();
      case "reservations":
        return <ReservationsAdmin token={token} />;
      case "marketing":
        return <MarketingAdmin token={token} />;
      case "ads-guide":
        return <AdsGuideAdmin />;
      case "reset":
        return <PlatformResetAdmin token={token} />;
      case "resellers":
        return <ResellersAdmin token={token} />;
      case "b2b":
        return <B2BAdmin />;
      case "sourcing":
        return <SourcingAdmin />;
      default:
        return renderDashboard();
    }
  };

  // Show loading spinner while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#1C1C1E] border-b border-black/5 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>
        <img 
          src="/assets/images/logo_yama_full.png" 
          alt="YAMA+" 
          className="h-10 w-auto"
        />
        <div className="w-10" />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Product Form Modal */}
      {renderProductFormModal()}
    </div>
  );
}
