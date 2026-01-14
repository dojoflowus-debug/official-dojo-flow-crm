import { useState } from 'react';
import { Eye, EyeOff, RotateCcw, Download, Loader } from 'lucide-react';
import { trpc } from '../../lib/trpc';

interface Location {
  id: number;
  name: string;
  address?: string;
  isActive: number;
  updatedAt: string;
}

interface KioskPreviewProps {
  location: Location;
}

export default function KioskPreview({ location }: KioskPreviewProps) {
  const [previewMode, setPreviewMode] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const publishMutation = trpc.kioskManager.publishKioskAppearance.useMutation({
    onSuccess: () => {
      setIsPublished(true);
    },
  });

  const handlePublish = () => {
    publishMutation.mutate({ locationId: location.id });
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Kiosk Preview</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time preview of kiosk display</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={previewMode ? 'Hide preview' : 'Show preview'}
          >
            {previewMode ? (
              <Eye size={18} className="text-slate-400" />
            ) : (
              <EyeOff size={18} className="text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {previewMode ? (
          <div className="flex-1 bg-gradient-to-br from-amber-900/30 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Kiosk Display Simulation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              {/* Background with filters */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 opacity-40" />

              {/* Main Content */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center space-y-6">
                {/* Logo/Icon */}
                <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🥋</span>
                </div>

                {/* Location Name */}
                <div>
                  <h2 className="text-2xl font-bold text-white">{location.name}</h2>
                  <p className="text-sm text-slate-300 mt-2">Manage and customize your dojo check-in kiosks</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-8">
                  {/* Check In Button */}
                  <button className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <div className="text-2xl mb-2">✓</div>
                    <div className="text-sm">Check In</div>
                    <p className="text-xs text-blue-100 mt-1">Tap here to check into class</p>
                  </button>

                  {/* Start Training Button */}
                  <button className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <div className="text-2xl mb-2">👤</div>
                    <div className="text-sm">Start Training</div>
                    <p className="text-xs text-red-100 mt-1">New students start here</p>
                  </button>
                </div>

                {/* Next Class */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-400">Next Class</p>
                  <p className="text-lg font-semibold text-white">Kids Karate at 5:30 PM</p>
                </div>

                {/* Today's Focus */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-400">Today's Focus</p>
                  <p className="text-sm text-slate-300">Discipline • Confidence • Fit</p>
                </div>

                {/* Save & Launch Button */}
                <button className="mt-8 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                  SAVE & LAUNCH KIOSK
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-700/30">
            <div className="text-center">
              <EyeOff size={32} className="text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">Preview hidden</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-slate-400">Last Published</p>
            <p className="text-white font-medium">3 days ago</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Version</p>
            <p className="text-white font-medium">Draft</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-600 text-white text-sm font-medium rounded-lg transition-all duration-200"
          >
            {publishMutation.isPending ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {publishMutation.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-slate-400 text-center">
          {isPublished ? (
            <p className="text-green-400">✓ Kiosk is live</p>
          ) : (
            <p>Changes not yet published</p>
          )}
        </div>
      </div>
    </div>
  );
}
