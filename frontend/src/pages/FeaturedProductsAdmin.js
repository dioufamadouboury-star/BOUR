import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Star, Sparkles, GripVertical, Eye, EyeOff, 
  ChevronUp, ChevronDown, Save, RefreshCw 
} from "lucide-react";
import { formatPrice } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FeaturedProductsAdmin() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [featuredRes, newRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?featured=true&limit=50`),
        axios.get(`${API_URL}/api/products?is_new=true&limit=50`),
        axios.get(`${API_URL}/api/products?limit=200`)
      ]);
      
      // Sort by featured_order or created_at
      const sortedFeatured = featuredRes.data.sort((a, b) => 
        (a.featured_order || 999) - (b.featured_order || 999)
      );
      const sortedNew = newRes.data.sort((a, b) => 
        (a.new_order || 999) - (b.new_order || 999)
      );
      
      setFeaturedProducts(sortedFeatured);
      setNewProducts(sortedNew);
      setAllProducts(allRes.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const moveProduct = (list, setList, index, direction) => {
    const newList = [...list];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newList.length) return;
    
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setList(newList);
  };

  const toggleFeatured = async (product, isFeatured) => {
    try {
      await axios.put(`${API_URL}/api/admin/products/${product.product_id}`, {
        featured: isFeatured,
        featured_order: isFeatured ? featuredProducts.length + 1 : null
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const toggleNew = async (product, isNew) => {
    try {
      await axios.put(`${API_URL}/api/admin/products/${product.product_id}`, {
        is_new: isNew,
        new_order: isNew ? newProducts.length + 1 : null
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const saveOrder = async (type) => {
    setSaving(true);
    try {
      const products = type === "featured" ? featuredProducts : newProducts;
      const orderField = type === "featured" ? "featured_order" : "new_order";
      
      await Promise.all(products.map((product, index) => 
        axios.put(`${API_URL}/api/admin/products/${product.product_id}`, {
          [orderField]: index + 1
        })
      ));
      
      alert("Ordre sauvegardé avec succès !");
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductCard = ({ product, index, list, setList, type }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col gap-1">
        <button
          onClick={() => moveProduct(list, setList, index, -1)}
          disabled={index === 0}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => moveProduct(list, setList, index, 1)}
          disabled={index === list.length - 1}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
      
      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full font-bold text-sm">
        {index + 1}
      </span>
      
      <img
        src={product.images?.[0] || "/placeholder.svg"}
        alt={product.name}
        className="w-12 h-12 object-cover rounded-lg"
        onError={(e) => { e.target.src = "/placeholder.svg"; }}
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{product.name}</h4>
        <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
      </div>
      
      <button
        onClick={() => type === "featured" ? toggleFeatured(product, false) : toggleNew(product, false)}
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        title="Retirer de la liste"
      >
        <EyeOff className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Mise en avant des produits</h1>
              <p className="text-sm text-muted-foreground">Gérez l'ordre d'affichage sur la page d'accueil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("featured")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "featured" 
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" 
                : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Star className="w-4 h-4" />
            Produits à la une ({featuredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "new" 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Nouveautés ({newProducts.length})
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {activeTab === "featured" ? "Produits à la une" : "Nouveautés"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={fetchProducts}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Rafraîchir"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => saveOrder(activeTab)}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Sauvegarde..." : "Sauvegarder l'ordre"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(activeTab === "featured" ? featuredProducts : newProducts).map((product, index) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    index={index}
                    list={activeTab === "featured" ? featuredProducts : newProducts}
                    setList={activeTab === "featured" ? setFeaturedProducts : setNewProducts}
                    type={activeTab}
                  />
                ))}
                {(activeTab === "featured" ? featuredProducts : newProducts).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun produit dans cette liste
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-4">Ajouter des produits</h3>
            
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-4"
            />

            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {filteredProducts
                .filter(p => {
                  if (activeTab === "featured") return !p.featured;
                  return !p.is_new;
                })
                .slice(0, 50)
                .map(product => (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => { e.target.src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <button
                      onClick={() => activeTab === "featured" ? toggleFeatured(product, true) : toggleNew(product, true)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                      title="Ajouter à la liste"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
