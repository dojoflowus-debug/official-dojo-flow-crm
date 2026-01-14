import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

/**
 * Merchandise Shop Page
 */
export default function Shop() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);

  // Mock products data
  const products = [
    {
      id: 1,
      name: "White Gi Uniform",
      description: "Traditional martial arts uniform - 100% cotton",
      category: "uniforms",
      price: 59.99,
      sizes: ["XS", "S", "M", "L", "XL"],
      image_url: null,
      in_stock: true
    },
    {
      id: 2,
      name: "Black Belt",
      description: "Premium quality black belt",
      category: "belts",
      price: 24.99,
      sizes: ["0", "1", "2", "3", "4", "5"],
      image_url: null,
      in_stock: true
    },
    {
      id: 3,
      name: "Training Gloves",
      description: "Padded sparring gloves",
      category: "gear",
      price: 39.99,
      sizes: ["S", "M", "L"],
      image_url: null,
      in_stock: true
    },
    {
      id: 4,
      name: "Dojo T-Shirt",
      description: "Official dojo t-shirt with logo",
      category: "apparel",
      price: 19.99,
      sizes: ["S", "M", "L", "XL", "XXL"],
      image_url: null,
      in_stock: true
    },
    {
      id: 5,
      name: "Shin Guards",
      description: "Protective shin guards for sparring",
      category: "gear",
      price: 34.99,
      sizes: ["S", "M", "L"],
      image_url: null,
      in_stock: true
    },
    {
      id: 6,
      name: "Water Bottle",
      description: "Insulated water bottle with dojo logo",
      category: "accessories",
      price: 14.99,
      sizes: ["One Size"],
      image_url: null,
      in_stock: true
    },
    {
      id: 7,
      name: "Training Bag",
      description: "Durable gym bag for equipment",
      category: "accessories",
      price: 44.99,
      sizes: ["One Size"],
      image_url: null,
      in_stock: true
    },
    {
      id: 8,
      name: "Colored Belts Set",
      description: "Set of colored belts (white to brown)",
      category: "belts",
      price: 89.99,
      sizes: ["0-5"],
      image_url: null,
      in_stock: true
    }
  ];

  const categories = [
    { id: "all", label: "All Items" },
    { id: "uniforms", label: "Uniforms" },
    { id: "belts", label: "Belts" },
    { id: "gear", label: "Training Gear" },
    { id: "apparel", label: "Apparel" },
    { id: "accessories", label: "Accessories" }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: any, size: string) => {
    const existingItem = cart.find(item => item.id === product.id && item.size === size);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, size, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, size: string, delta: number) => {
    setCart(cart.map(item =>
      item.id === productId && item.size === size
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number, size: string) => {
    setCart(cart.filter(item => !(item.id === productId && item.size === size)));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Merchandise Shop</h1>
                <p className="text-sm text-slate-400">Uniforms, gear, and accessories</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCheckout(true)}
              className="border-slate-700 text-white hover:bg-slate-800 relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-600 text-white border-0 h-6 w-6 flex items-center justify-center p-0">
                  {getCartItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Categories */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-800 text-white"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? "bg-red-600 hover:bg-red-700 whitespace-nowrap" 
                    : "border-slate-700 text-white hover:bg-slate-800 whitespace-nowrap"}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No products found
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Shopping Cart</h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Your cart is empty
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${item.size}-${index}`} className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-4">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{item.name}</h4>
                          <p className="text-slate-400 text-sm">Size: {item.size}</p>
                          <p className="text-white font-bold mt-1">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.size, -1)}
                            className="h-8 w-8 border-slate-700 text-white hover:bg-slate-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.size, 1)}
                            className="h-8 w-8 border-slate-700 text-white hover:bg-slate-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-white font-bold">Total:</span>
                      <span className="text-white font-bold">${getCartTotal()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                    >
                      Continue Shopping
                    </Button>
                    <Button
                      onClick={() => {
                        alert("Proceeding to payment...");
                        setShowCheckout(false);
                        setLocation("/payment");
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                      Checkout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onAddToCart }: any) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-all duration-300">
      <div className="p-6">
        {/* Product Image Placeholder */}
        <div className="w-full h-48 bg-slate-800 rounded-lg mb-4 flex items-center justify-center">
          <ShoppingCart className="h-16 w-16 text-slate-600" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
        <p className="text-slate-400 text-sm mb-4">{product.description}</p>

        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Select Size:</label>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((size: string) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSize(size)}
                className={selectedSize === size 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "border-slate-700 text-white hover:bg-slate-800"}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-2xl font-bold text-white">
            ${product.price}
          </div>
          <Button
            onClick={() => onAddToCart(product, selectedSize)}
            disabled={!product.in_stock}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
}

