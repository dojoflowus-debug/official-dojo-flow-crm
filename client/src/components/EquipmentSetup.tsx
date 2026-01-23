import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentSetupProps {
  bagsOnHand: number;
  bagsInstalled: number;
  defaultLayout: string;
  onGenerateStations: (bagsInstalled: number, layout: string) => void;
  isLoading?: boolean;
}

export function EquipmentSetup({
  bagsOnHand,
  bagsInstalled,
  defaultLayout,
  onGenerateStations,
  isLoading = false,
}: EquipmentSetupProps) {
  const [localBagsOnHand, setLocalBagsOnHand] = useState(bagsOnHand);
  const [localBagsInstalled, setLocalBagsInstalled] = useState(bagsInstalled);
  const [selectedLayout, setSelectedLayout] = useState(defaultLayout || "grid");
  const [validationError, setValidationError] = useState("");

  const handleBagsInstalledChange = (value: string) => {
    const num = parseInt(value) || 0;
    setLocalBagsInstalled(num);
    setValidationError("");
  };

  const handleGenerateStations = () => {
    // Validation
    if (localBagsInstalled <= 0) {
      setValidationError("Bags installed must be greater than 0");
      return;
    }
    if (localBagsInstalled > localBagsOnHand) {
      setValidationError(`Cannot install ${localBagsInstalled} bags - only ${localBagsOnHand} on hand`);
      return;
    }

    setValidationError("");
    onGenerateStations(localBagsInstalled, selectedLayout);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-white">Equipment Setup</h3>
      </div>

      {/* Bags on Hand - Read Only */}
      <div className="space-y-2">
        <Label className="text-white/80">Bags on Hand (Dojo Inventory)</Label>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-lg font-semibold text-white">{localBagsOnHand}</p>
          <p className="text-xs text-white/50">Total bags available at your location</p>
        </div>
      </div>

      {/* Bags Installed */}
      <div className="space-y-2">
        <Label htmlFor="bags-installed" className="text-white/80">
          Bags to Install in This Room
        </Label>
        <Input
          id="bags-installed"
          type="number"
          min="0"
          max={localBagsOnHand}
          value={localBagsInstalled}
          onChange={(e) => handleBagsInstalledChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
          disabled={isLoading}
        />
        <p className="text-xs text-white/50">
          {localBagsInstalled} of {localBagsOnHand} bags
        </p>
      </div>

      {/* Layout Selector */}
      <div className="space-y-2">
        <Label htmlFor="layout-select" className="text-white/80">
          Default Layout
        </Label>
        <Select value={selectedLayout} onValueChange={setSelectedLayout} disabled={isLoading}>
          <SelectTrigger id="layout-select" className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid (Rows & Columns)</SelectItem>
            <SelectItem value="staggered">Staggered (Offset Rows)</SelectItem>
            <SelectItem value="perimeter">Perimeter (Around Walls)</SelectItem>
            <SelectItem value="wall">Bag Wall (Single Front Row)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-300">{validationError}</p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerateStations}
        disabled={isLoading || localBagsInstalled === 0}
        className={cn(
          "w-full",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? "Generating Stations..." : "Generate Stations"}
      </Button>

      {/* Info */}
      <p className="text-xs text-white/50 text-center">
        Creates {localBagsInstalled} stations using {selectedLayout} layout
      </p>
    </div>
  );
}
