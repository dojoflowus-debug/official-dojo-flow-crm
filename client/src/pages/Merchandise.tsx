import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Package, X, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TYPES = ["uniform", "gear", "belt", "equipment", "other"] as const;
type ItemType = typeof TYPES[number];

const SIZE_PRESETS: Record<string, string[]> = {
  uniform: ["XS", "S", "M", "L", "XL", "XXL"],
  gear: ["XS", "S", "M", "L", "XL"],
  belt: ["Child", "Adult Short", "Adult Regular", "Adult Long"],
  equipment: [],
  other: [],
};

interface FormState {
  name: string;
  type: ItemType;
  defaultPrice: string;
  requiresSize: boolean;
  sizeOptions: string[];
  description: string;
  stockQuantity: string;
  lowStockThreshold: string;
  imageUrl: string;
}

const defaultForm: FormState = {
  name: "",
  type: "uniform",
  defaultPrice: "",
  requiresSize: false,
  sizeOptions: [],
  description: "",
  stockQuantity: "",
  lowStockThreshold: "",
  imageUrl: "",
};

export default function Merchandise() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [sizeInput, setSizeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Fetch items
  const { data: items = [], isLoading } = trpc.merchandise.getItems.useQuery();

  // Mutations
  const createItem = trpc.merchandise.createItem.useMutation({
    onSuccess: () => {
      utils.merchandise.getItems.invalidate();
      toast.success("Merchandise item added successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateItem = trpc.merchandise.updateItem.useMutation({
    onSuccess: () => {
      utils.merchandise.getItems.invalidate();
      toast.success("Item updated successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteItem = trpc.merchandise.deleteItem.useMutation({
    onSuccess: () => {
      utils.merchandise.getItems.invalidate();
      toast.success("Item removed from inventory");
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSizeInput("");
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      defaultPrice: (item.defaultPrice / 100).toFixed(2),
      requiresSize: !!item.requiresSize,
      sizeOptions: item.sizeOptions ? JSON.parse(item.sizeOptions) : [],
      description: item.description || "",
      stockQuantity: item.stockQuantity?.toString() || "",
      lowStockThreshold: item.lowStockThreshold?.toString() || "",
      imageUrl: item.imageUrl || "",
    });
    setSizeInput("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(defaultForm);
    setSizeInput("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    const price = parseFloat(form.defaultPrice);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");

    setIsSubmitting(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      defaultPrice: Math.round(price * 100),
      requiresSize: form.requiresSize,
      sizeOptions: form.sizeOptions.length > 0 ? form.sizeOptions : undefined,
      description: form.description.trim() || undefined,
      stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : undefined,
      lowStockThreshold: form.lowStockThreshold ? parseInt(form.lowStockThreshold) : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    };

    if (editingId) {
      updateItem.mutate({ id: editingId, ...payload });
    } else {
      createItem.mutate(payload);
    }
  };

  const addSize = () => {
    const s = sizeInput.trim();
    if (s && !form.sizeOptions.includes(s)) {
      setForm((f) => ({ ...f, sizeOptions: [...f.sizeOptions, s] }));
    }
    setSizeInput("");
  };

  const removeSize = (s: string) => {
    setForm((f) => ({ ...f, sizeOptions: f.sizeOptions.filter((x) => x !== s) }));
  };

  const applyPreset = () => {
    const preset = SIZE_PRESETS[form.type];
    if (preset.length > 0) setForm((f) => ({ ...f, sizeOptions: preset }));
  };

  // Styles
  const bg = isDark ? "bg-[#0F1115]" : "bg-gray-50";
  const cardBg = isDark ? "bg-[#18181A] border-white/10" : "bg-white border-gray-200";
  const text = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const inputCls = isDark
    ? "bg-[#27272A] border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-red-500";
  const labelCls = `text-sm font-medium mb-1 block ${isDark ? "text-gray-300" : "text-gray-700"}`;

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? "bg-[#18181A] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold tracking-tight ${text}`}>Merchandise</h1>
            <p className={`mt-1 ${sub}`}>Manage your dojo merchandise inventory</p>
          </div>
          <Button onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Merchandise
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={`border-b ${isDark ? "bg-[#18181A] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search merchandise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${inputCls}`}
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`px-4 py-2 rounded-lg border text-sm ${inputCls}`}
          >
            <option value="all">All Types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`text-center py-20 rounded-xl border-2 border-dashed ${isDark ? "border-white/10" : "border-gray-200"}`}>
            <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
            <h3 className={`text-xl font-semibold mb-2 ${text}`}>
              {items.length === 0 ? "No merchandise yet" : "No items match your search"}
            </h3>
            <p className={`mb-6 ${sub}`}>
              {items.length === 0 ? "Add your first item to get started" : "Try adjusting your filters"}
            </p>
            {items.length === 0 && (
              <Button onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item: any) => (
              <div key={item.id} className={`rounded-xl border overflow-hidden hover:shadow-lg transition-all ${cardBg}`}>
                <div className={`aspect-square flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-gray-100"}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className={`w-12 h-12 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-semibold ${text}`}>{item.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 ${sub}`}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                  {item.description && (
                    <p className={`text-sm mb-3 line-clamp-2 ${sub}`}>{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <p className={`text-2xl font-bold ${text}`}>${(item.defaultPrice / 100).toFixed(2)}</p>
                    {item.stockQuantity !== null && item.stockQuantity !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.stockQuantity <= (item.lowStockThreshold || 5)
                          ? "bg-red-500/20 text-red-400"
                          : isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                      }`}>
                        Stock: {item.stockQuantity}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}
                      className={`flex-1 ${isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : ""}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        if (confirm(`Remove "${item.name}" from inventory?`)) {
                          deleteItem.mutate({ id: item.id });
                        }
                      }}
                      className={`flex-1 ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl ${isDark ? "bg-[#18181A] border border-white/10" : "bg-white"}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
              <h2 className={`text-xl font-bold ${text}`}>
                {editingId ? "Edit Merchandise" : "Add Merchandise"}
              </h2>
              <button onClick={closeModal} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className={labelCls}>Item Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. White Gi Uniform"
                  className={inputCls}
                  required
                />
              </div>

              {/* Type & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ItemType, sizeOptions: [] }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price (USD) *</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm ${sub}`}>$</span>
                    <Input
                      value={form.defaultPrice}
                      onChange={(e) => setForm((f) => ({ ...f, defaultPrice: e.target.value }))}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`pl-7 ${inputCls}`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${inputCls}`}
                />
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Stock Quantity</label>
                  <Input
                    value={form.stockQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                    placeholder="e.g. 50"
                    type="number"
                    min="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Low Stock Alert</label>
                  <Input
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                    placeholder="e.g. 5"
                    type="number"
                    min="0"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className={labelCls}>Image URL</label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

              {/* Requires Size */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                <input
                  type="checkbox"
                  id="requiresSize"
                  checked={form.requiresSize}
                  onChange={(e) => setForm((f) => ({ ...f, requiresSize: e.target.checked }))}
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="requiresSize" className={`text-sm font-medium cursor-pointer ${text}`}>
                  This item requires size selection
                </label>
              </div>

              {/* Size Options */}
              {form.requiresSize && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>Size Options</label>
                    {SIZE_PRESETS[form.type].length > 0 && (
                      <button type="button" onClick={applyPreset}
                        className="text-xs text-red-500 hover:text-red-400 font-medium">
                        Use preset sizes
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                      placeholder="e.g. M, L, XL"
                      className={`flex-1 ${inputCls}`}
                    />
                    <Button type="button" onClick={addSize} variant="outline"
                      className={isDark ? "border-white/10 text-white hover:bg-white/10" : ""}>
                      Add
                    </Button>
                  </div>
                  {form.sizeOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.sizeOptions.map((s) => (
                        <span key={s} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}`}>
                          {s}
                          <button type="button" onClick={() => removeSize(s)} className="ml-1 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={`flex gap-3 pt-2 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <Button type="button" variant="outline" onClick={closeModal}
                  className={`flex-1 ${isDark ? "border-white/10 text-white hover:bg-white/10" : ""}`}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {isSubmitting ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
