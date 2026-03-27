import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface MerchandiseItem {
  id: number;
  name: string;
  type: string;
  defaultPrice: number;
  imageUrl?: string;
  description?: string;
  stockQuantity?: number;
  isActive: number;
}

export default function Merchandise() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchandiseItem | null>(null);

  useEffect(() => {
    loadMerchandise();
  }, []);

  const loadMerchandise = async () => {
    try {
      setIsLoading(true);
      // TODO: Fetch merchandise items from API
      // const response = await fetch('/api/merchandise');
      // const data = await response.json();
      // setItems(data);
      setItems([]);
    } catch (error) {
      console.error("Failed to load merchandise:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const types = ["uniform", "gear", "belt", "equipment", "other"];

  return (
    <>
      {/* Header */}
      <div className={`border-b ${isDark ? "bg-[#18181A] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                Merchandise
              </h1>
              <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Manage your dojo merchandise inventory
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowAddModal(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Merchandise
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`border-b ${isDark ? "bg-[#18181A] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search merchandise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? "bg-[#27272A] border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? "bg-[#27272A] border-white/10 text-white"
                  : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            >
              <option value="all">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading merchandise...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border-2 border-dashed ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
            <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              No merchandise found
            </h3>
            <p className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {items.length === 0
                ? "Get started by adding your first merchandise item"
                : "No items match your search"}
            </p>
            {items.length === 0 && (
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowAddModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border overflow-hidden transition-all hover:shadow-lg ${
                  isDark
                    ? "bg-[#18181A] border-white/10 hover:border-white/20"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Product Image */}
                <div className={`aspect-square flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-gray-100"}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className={`w-12 h-12 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {item.name}
                      </h3>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      item.isActive
                        ? isDark
                          ? "bg-green-500/20 text-green-400"
                          : "bg-green-100 text-green-800"
                        : isDark
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {item.description && (
                    <p className={`text-sm mb-3 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        ${(item.defaultPrice / 100).toFixed(2)}
                      </p>
                      {item.stockQuantity !== undefined && (
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Stock: {item.stockQuantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setShowAddModal(true);
                      }}
                      className={`flex-1 ${
                        isDark
                          ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          : "bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Delete merchandise item
                        console.log("Delete item:", item.id);
                      }}
                      className={`flex-1 ${
                        isDark
                          ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal - TODO: Implement full modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? "bg-[#18181A]" : "bg-white"}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              {editingItem ? "Edit Merchandise" : "Add Merchandise"}
            </h2>
            <p className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Modal form coming soon...
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className={isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : ""}
              >
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1">
                {editingItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
