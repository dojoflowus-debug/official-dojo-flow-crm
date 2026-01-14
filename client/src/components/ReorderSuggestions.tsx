import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Package, RefreshCw, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ReorderSuggestions() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [settingsForm, setSettingsForm] = useState({
    leadTimeDays: 7,
    safetyStockMultiplier: 1.5,
  });

  const utils = trpc.useUtils();

  // Fetch reorder suggestions
  const { data: suggestions = [], isLoading } = trpc.merchandise.getReorderSuggestions.useQuery();

  // Recalculate all reorder points
  const recalculateMutation = trpc.merchandise.recalculateAllReorderPoints.useMutation({
    onSuccess: (data) => {
      toast.success(`Recalculated reorder points for ${data.itemsUpdated} items`);
      utils.merchandise.getReorderSuggestions.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to recalculate: ${error.message}`);
    },
  });

  // Update reorder settings
  const updateSettingsMutation = trpc.merchandise.updateReorderSettings.useMutation({
    onSuccess: () => {
      toast.success("Reorder settings updated");
      setShowSettings(false);
      utils.merchandise.getReorderSuggestions.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const toggleExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getUrgencyColor = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 3) return "text-red-600 bg-red-50";
    if (daysUntilStockout <= 7) return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">High Confidence</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Confidence</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low Confidence</Badge>;
  };

  const handleUpdateSettings = () => {
    if (!selectedItem) return;

    updateSettingsMutation.mutate({
      itemId: selectedItem,
      leadTimeDays: settingsForm.leadTimeDays,
      safetyStockMultiplier: settingsForm.safetyStockMultiplier,
    });
  };

  const openSettings = (itemId: number, currentLeadTime: number, currentMultiplier: string) => {
    setSelectedItem(itemId);
    setSettingsForm({
      leadTimeDays: currentLeadTime || 7,
      safetyStockMultiplier: parseFloat(currentMultiplier || "1.5"),
    });
    setShowSettings(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Reorder Suggestions
          </CardTitle>
          <CardDescription>Loading reorder analytics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Reorder Suggestions
              </CardTitle>
              <CardDescription>
                Items below reorder point based on consumption velocity
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
              Recalculate All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">All items are well-stocked</p>
              <p className="text-sm mt-2">No reorder suggestions at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const urgencyClass = getUrgencyColor(item.daysUntilStockout);

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors ${urgencyClass}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm opacity-80 capitalize">{item.type}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs font-medium opacity-70">Current Stock</p>
                            <p className="text-2xl font-bold">{item.stockQuantity || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium opacity-70">Reorder Point</p>
                            <p className="text-2xl font-bold">{item.reorderPoint || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium opacity-70">Suggested Order</p>
                            <p className="text-2xl font-bold">{item.reorderQuantity || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium opacity-70">Days Until Stockout</p>
                            <p className="text-2xl font-bold">
                              {item.daysUntilStockout === 999 ? "∞" : item.daysUntilStockout}
                            </p>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-current/20">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium opacity-70">Consumption Velocity</p>
                                <p className="text-lg font-semibold mt-1">
                                  {item.velocity.toFixed(2)} items/day
                                </p>
                              </div>
                              <div>
                                <p className="font-medium opacity-70">Lead Time</p>
                                <p className="text-lg font-semibold mt-1">
                                  {item.leadTimeDays || 7} days
                                </p>
                              </div>
                              <div>
                                <p className="font-medium opacity-70">Safety Stock</p>
                                <p className="text-lg font-semibold mt-1">
                                  {item.safetyStockMultiplier || "1.5"}x
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              {getConfidenceBadge(item.confidenceScore)}
                              <span className="text-xs ml-2 opacity-70">
                                Confidence: {item.confidenceScore}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openSettings(
                              item.id,
                              item.leadTimeDays || 7,
                              item.safetyStockMultiplier || "1.5"
                            )
                          }
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            toast.info("Purchase order creation coming soon");
                          }}
                        >
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Order
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reorder Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Settings</DialogTitle>
            <DialogDescription>
              Adjust lead time and safety stock multiplier for this item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input
                id="leadTime"
                type="number"
                min="1"
                max="90"
                value={settingsForm.leadTimeDays}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    leadTimeDays: parseInt(e.target.value) || 7,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Time from order placement to delivery
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="safetyStock">Safety Stock Multiplier</Label>
              <Input
                id="safetyStock"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={settingsForm.safetyStockMultiplier}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    safetyStockMultiplier: parseFloat(e.target.value) || 1.5,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Buffer stock multiplier (1.5 = 150% of expected usage)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Updating..." : "Update Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
