import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Maximize2, Minimize2, RotateCw, Frame, Zap, ChevronDown } from 'lucide-react';
import {
  DEVICE_PRESETS,
  DevicePreset,
  DeviceOrientation,
  ZoomLevel,
  getKioskDevices,
  getSanityCheckDevices,
} from '../../../shared/deviceEmulator';

interface DeviceSelectorProps {
  currentDeviceId: string;
  currentOrientation: DeviceOrientation;
  currentZoomLevel: ZoomLevel;
  showFrame: boolean;
  simulateTouch: boolean;
  onDeviceChange: (deviceId: string) => void;
  onOrientationToggle: () => void;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFrameToggle: () => void;
  onTouchToggle: () => void;
  onOpenPublic?: () => void;
  onOpenLiveView?: () => void;
  locationId?: number;
}

/**
 * DeviceSelector - UI for selecting devices and controlling emulator
 * Shows device tabs at top and toolbar with controls
 */
export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  currentDeviceId,
  currentOrientation,
  currentZoomLevel,
  showFrame,
  simulateTouch,
  onDeviceChange,
  onOrientationToggle,
  onZoomChange,
  onFrameToggle,
  onTouchToggle,
  onOpenPublic,
  onOpenLiveView,
  locationId,
}) => {
  const [showSanityChecks, setShowSanityChecks] = useState(false);
  const currentPreset = DEVICE_PRESETS[currentDeviceId];
  const kioskDevices = getKioskDevices();
  const sanityCheckDevices = getSanityCheckDevices();

  const supportsOrientation = currentPreset && currentPreset.supportedOrientations.length > 1;

  return (
    <div className="space-y-3">
      {/* Device Selector Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/65 uppercase tracking-wider">Device</label>
        <div className="relative">
          <select
            value={currentDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: '#12161C',
              color: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <optgroup label="Kiosk-First">
              {kioskDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Sanity Checks">
              {sanityCheckDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{color: 'rgba(255,255,255,0.65)'}} />
        </div>
      </div>

      {/* Device Info and Controls */}
      <div className="rounded-lg p-4 space-y-4" style={{
        background: '#12161C',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Device Info */}
        {currentPreset && (
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="font-semibold" style={{color: 'rgba(255,255,255,0.92)'}}>{currentPreset.name}</p>
              <p style={{color: 'rgba(255,255,255,0.65)'}}>
                {currentOrientation === 'landscape' ? currentPreset.height : currentPreset.width}
                ×
                {currentOrientation === 'landscape' ? currentPreset.width : currentPreset.height}
                px
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{color: 'rgba(255,255,255,0.65)'}}>Scale</p>
              <p className="font-semibold" style={{color: 'rgba(255,255,255,0.92)'}}>
                {currentZoomLevel === 'fit' ? 'Fit' : `${currentZoomLevel}%`}
              </p>
            </div>
          </div>
        )}

        {/* Compact Toolbar Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Orientation Dropdown */}
          {supportsOrientation && (
            <div className="relative">
              <select
                value={currentOrientation}
                onChange={(e) => {
                  if (e.target.value !== currentOrientation) {
                    onOrientationToggle();
                  }
                }}
                className="appearance-none px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: '#161B22',
                  color: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{color: 'rgba(255,255,255,0.65)'}} />
            </div>
          )}

          {/* Zoom Dropdown */}
          <div className="relative">
            <select
              value={currentZoomLevel}
              onChange={(e) => onZoomChange(e.target.value as ZoomLevel)}
              className="appearance-none px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: '#161B22',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="100">100%</option>
              <option value="fit">Fit</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{color: 'rgba(255,255,255,0.65)'}} />
          </div>

          {/* Frame Toggle */}
          <button
            onClick={onFrameToggle}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: showFrame ? '#EF4444' : '#161B22',
              color: showFrame ? 'white' : 'rgba(255,255,255,0.92)',
              border: `1px solid ${showFrame ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
            }}
            title={showFrame ? 'Hide device frame' : 'Show device frame'}
          >
            <Frame className="w-4 h-4" />
            Frame
          </button>

          {/* Touch Simulation Toggle */}
          <button
            onClick={onTouchToggle}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: simulateTouch ? '#EF4444' : '#161B22',
              color: simulateTouch ? 'white' : 'rgba(255,255,255,0.92)',
              border: `1px solid ${simulateTouch ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
            }}
            title={simulateTouch ? 'Disable touch simulation' : 'Enable touch simulation'}
          >
            <Zap className="w-4 h-4" />
            Touch
          </button>

          {/* Open Live View */}
          {onOpenLiveView && locationId && (
            <button
              onClick={onOpenLiveView}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ml-auto"
              style={{
                background: '#10B981',
                color: 'white',
                border: '1px solid #10B981',
              }}
              title="Open fullscreen live view for deployment"
            >
              <Maximize2 className="w-4 h-4" />
              Live View
            </button>
          )}

          {/* Open Public Kiosk */}
          {onOpenPublic && (
            <button
              onClick={onOpenPublic}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: '#161B22',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              title="Open public kiosk in new tab"
            >
              <Maximize2 className="w-4 h-4" />
              Public
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
