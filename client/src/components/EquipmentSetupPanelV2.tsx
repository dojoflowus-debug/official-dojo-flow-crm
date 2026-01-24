import React, { useState } from 'react';

interface EquipmentSetupPanelV2Props {
  templateType?: string;
  onGenerateStations?: (count: number, layout: string) => void;
  onSave?: (bagsOnHand: number, bagsInstalled: number, layout: string) => void;
}

export function EquipmentSetupPanelV2({ templateType, onGenerateStations, onSave }: EquipmentSetupPanelV2Props) {
  const [bagsOnHand, setBagsOnHand] = useState(0);
  const [bagsInstalled, setBagsInstalled] = useState(0);
  const [layout, setLayout] = useState('grid');

  const isValid = bagsInstalled <= bagsOnHand && bagsInstalled > 0;
  const isKickboxing = templateType === 'kickboxing_bags';

  if (!isKickboxing) return null;

  const handleGenerate = () => {
    if (isValid && onGenerateStations) {
      onGenerateStations(bagsInstalled, layout);
    }
  };

  const handleSave = () => {
    if (isValid && onSave) {
      onSave(bagsOnHand, bagsInstalled, layout);
    }
  };

  return (
    <div className="w-80 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>⚙️</span>
        Equipment Setup
      </h3>

      {/* Bags On Hand */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Bags On Hand (Dojo Inventory)
        </label>
        <input
          type="number"
          min="0"
          value={bagsOnHand}
          onChange={(e) => setBagsOnHand(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1">Total bags available at your location</p>
      </div>

      {/* Bags Installed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Bags to Install in This Room
        </label>
        <input
          type="number"
          min="0"
          max={bagsOnHand}
          value={bagsInstalled}
          onChange={(e) => setBagsInstalled(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1">{bagsInstalled} of {bagsOnHand} bags</p>
        {bagsInstalled > bagsOnHand && (
          <p className="text-xs text-red-400 mt-1">⚠️ Cannot install more bags than available</p>
        )}
      </div>

      {/* Layout Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Default Layout
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['grid', 'staggered', 'wall', 'perimeter'].map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                layout === l
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Creates {bagsInstalled} stations using {layout} layout
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={!isValid}
          className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
            isValid
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Generate Stations
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
            isValid
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
