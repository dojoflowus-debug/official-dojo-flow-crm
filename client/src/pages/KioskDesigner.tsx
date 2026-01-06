import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, Plus, Copy, Trash2, Settings, Play, Pause, RotateCw } from 'lucide-react';

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  buttonStyle: 'rounded' | 'glow' | 'flat';
  themeMode: 'light' | 'dark' | 'cinematic';
  logoUrl: string;
  backgroundUrl: string;
  schoolName: string;
  slogan: string;
  clockEnabled: boolean;
  instructorPhotoEnabled: boolean;
  studentCardStyle: 'rounded' | 'glass' | 'compact';
  backgroundMotion: boolean;
  idleMessage: string;
  autoReturnTimer: number;
  soundEnabled: boolean;
  welcomeVoiceEnabled: boolean;
  checkInFlow: string;
}

const defaultThemeConfig: ThemeConfig = {
  primaryColor: '#FF6B35',
  accentColor: '#004E89',
  buttonStyle: 'rounded',
  themeMode: 'dark',
  logoUrl: '',
  backgroundUrl: '',
  schoolName: 'Your School Name',
  slogan: 'Welcome to our dojo',
  clockEnabled: true,
  instructorPhotoEnabled: true,
  studentCardStyle: 'glass',
  backgroundMotion: true,
  idleMessage: 'Welcome! Please check in.',
  autoReturnTimer: 60,
  soundEnabled: true,
  welcomeVoiceEnabled: true,
  checkInFlow: 'standard',
};

export function KioskDesigner() {
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [previewMode, setPreviewMode] = useState<'day' | 'night' | 'idle' | 'checkin'>('day');
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [newThemeName, setNewThemeName] = useState('');

  // Fetch themes and devices
  const { data: themes = [], isLoading: themesLoading } = trpc.kioskDesigner.getThemes.useQuery();
  const { data: devices = [], isLoading: devicesLoading } = trpc.kioskDesigner.getDevices.useQuery();

  // Mutations
  const createThemeMutation = trpc.kioskDesigner.createTheme.useMutation({
    onSuccess: () => {
      toast.success('Theme created successfully');
      setNewThemeName('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create theme');
    },
  });

  const updateThemeAssetMutation = trpc.kioskDesigner.updateThemeAsset.useMutation({
    onSuccess: () => {
      toast.success('Theme updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update theme');
    },
  });

  const setActiveThemeMutation = trpc.kioskDesigner.setActiveTheme.useMutation({
    onSuccess: () => {
      toast.success('Theme activated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to activate theme');
    },
  });

  const duplicateThemeMutation = trpc.kioskDesigner.duplicateTheme.useMutation({
    onSuccess: () => {
      toast.success('Theme duplicated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to duplicate theme');
    },
  });

  const deleteThemeMutation = trpc.kioskDesigner.deleteTheme.useMutation({
    onSuccess: () => {
      toast.success('Theme deleted');
      setSelectedThemeId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete theme');
    },
  });

  // Handlers
  const handleCreateTheme = () => {
    if (!newThemeName.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    createThemeMutation.mutate({ name: newThemeName });
  };

  const handleUpdateAsset = (assetType: string, assetKey: string, assetValue: string) => {
    if (!selectedThemeId) return;
    updateThemeAssetMutation.mutate({
      themeId: selectedThemeId,
      assetType,
      assetKey,
      assetValue,
    });
  };

  const handleConfigChange = (key: keyof ThemeConfig, value: any) => {
    setThemeConfig(prev => ({ ...prev, [key]: value }));
    // Auto-save to backend
    if (selectedThemeId) {
      handleUpdateAsset('config', key, String(value));
    }
  };

  const handleActivateTheme = (themeId: number) => {
    setActiveThemeMutation.mutate({ themeId });
  };

  const handleDuplicateTheme = (themeId: number) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      duplicateThemeMutation.mutate({
        themeId,
        newName: `${theme.name} (Copy)`,
      });
    }
  };

  const handleDeleteTheme = (themeId: number) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      deleteThemeMutation.mutate({ themeId });
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT PANEL - CONTROLS */}
      <div className="w-80 border-r border-border overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="p-6 space-y-6">
          {/* Theme Manager */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground/80">Theme Manager</h3>
            <div className="flex gap-2">
              <Input
                placeholder="New theme name"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreateTheme}
                disabled={createThemeMutation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Branding Section */}
          <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
            <h4 className="font-medium text-sm">Branding</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Logo</Label>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Background</Label>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Upload Background
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">School Name</Label>
              <Input
                placeholder="School name"
                value={themeConfig.schoolName}
                onChange={(e) => handleConfigChange('schoolName', e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Slogan</Label>
              <Input
                placeholder="Welcome message"
                value={themeConfig.slogan}
                onChange={(e) => handleConfigChange('slogan', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
            <h4 className="font-medium text-sm">Colors</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={themeConfig.primaryColor}
                  onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={themeConfig.primaryColor}
                  onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  className="text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={themeConfig.accentColor}
                  onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={themeConfig.accentColor}
                  onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                  className="text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Button Style</Label>
              <select
                value={themeConfig.buttonStyle}
                onChange={(e) => handleConfigChange('buttonStyle', e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              >
                <option value="rounded">Rounded</option>
                <option value="glow">Glow</option>
                <option value="flat">Flat</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Theme Mode</Label>
              <select
                value={themeConfig.themeMode}
                onChange={(e) => handleConfigChange('themeMode', e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
            <h4 className="font-medium text-sm">Layout</h4>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.clockEnabled}
                  onChange={(e) => handleConfigChange('clockEnabled', e.target.checked)}
                />
                Show Clock
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.instructorPhotoEnabled}
                  onChange={(e) => handleConfigChange('instructorPhotoEnabled', e.target.checked)}
                />
                Show Instructor Photo
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Student Card Style</Label>
              <select
                value={themeConfig.studentCardStyle}
                onChange={(e) => handleConfigChange('studentCardStyle', e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              >
                <option value="rounded">Rounded</option>
                <option value="glass">Glass</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.backgroundMotion}
                  onChange={(e) => handleConfigChange('backgroundMotion', e.target.checked)}
                />
                Background Motion
              </label>
            </div>
          </div>

          {/* Kiosk Behavior */}
          <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
            <h4 className="font-medium text-sm">Behavior</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Idle Message</Label>
              <Input
                placeholder="Welcome message"
                value={themeConfig.idleMessage}
                onChange={(e) => handleConfigChange('idleMessage', e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Auto-Return Timer (seconds)</Label>
              <Input
                type="number"
                value={themeConfig.autoReturnTimer}
                onChange={(e) => handleConfigChange('autoReturnTimer', parseInt(e.target.value))}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.soundEnabled}
                  onChange={(e) => handleConfigChange('soundEnabled', e.target.checked)}
                />
                Sound Effects
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.welcomeVoiceEnabled}
                  onChange={(e) => handleConfigChange('welcomeVoiceEnabled', e.target.checked)}
                />
                Welcome Voice
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Check-in Flow</Label>
              <select
                value={themeConfig.checkInFlow}
                onChange={(e) => handleConfigChange('checkInFlow', e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              >
                <option value="standard">Standard</option>
                <option value="quick">Quick</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL - LIVE PREVIEW */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-background/90">
        <div className="space-y-4 w-full max-w-2xl">
          {/* Preview Controls */}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              variant={previewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={previewMode === 'night' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('night')}
            >
              Night
            </Button>
            <Button
              variant={previewMode === 'idle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('idle')}
            >
              Idle
            </Button>
            <Button
              variant={previewMode === 'checkin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('checkin')}
            >
              Check-in
            </Button>
            <Button
              variant={deviceOrientation === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceOrientation('portrait')}
            >
              Portrait
            </Button>
            <Button
              variant={deviceOrientation === 'landscape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceOrientation('landscape')}
            >
              Landscape
            </Button>
          </div>

          {/* Device Mockup */}
          <div className="flex justify-center">
            <div
              className={`rounded-3xl border-8 border-gray-800 shadow-2xl overflow-hidden ${
                deviceOrientation === 'portrait' ? 'w-80 h-96' : 'w-96 h-80'
              }`}
              style={{
                backgroundColor: themeConfig.themeMode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              }}
            >
              {/* Kiosk Screen Content */}
              <div
                className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.primaryColor}20, ${themeConfig.accentColor}20)`,
                }}
              >
                {/* Background Motion Effect */}
                {themeConfig.backgroundMotion && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 animate-pulse" />
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 text-center space-y-4">
                  {/* Logo Placeholder */}
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                    style={{
                      backgroundColor: themeConfig.primaryColor,
                      opacity: 0.8,
                    }}
                  >
                    <span className="text-white text-2xl font-bold">D</span>
                  </div>

                  {/* School Name */}
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: themeConfig.primaryColor }}
                  >
                    {themeConfig.schoolName}
                  </h1>

                  {/* Slogan */}
                  <p className="text-sm opacity-75">{themeConfig.slogan}</p>

                  {/* Preview Content Based on Mode */}
                  {previewMode === 'idle' && (
                    <p className="text-lg font-semibold mt-6">{themeConfig.idleMessage}</p>
                  )}

                  {previewMode === 'checkin' && (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm">Ready to check in?</p>
                      <button
                        className="px-6 py-2 rounded text-white font-semibold"
                        style={{
                          backgroundColor: themeConfig.accentColor,
                          opacity: 0.9,
                        }}
                      >
                        Start Check-in
                      </button>
                    </div>
                  )}

                  {/* Clock */}
                  {themeConfig.clockEnabled && (
                    <div className="text-xs opacity-60 mt-6">
                      {new Date().toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - THEMES & DEPLOYMENT */}
      <div className="w-96 border-l border-border overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="p-6 space-y-6">
          {/* Theme Library */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground/80">Theme Library</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {themesLoading ? (
                <p className="text-xs text-foreground/50">Loading themes...</p>
              ) : themes.length === 0 ? (
                <p className="text-xs text-foreground/50">No themes created yet</p>
              ) : (
                themes.map((theme) => (
                  <Card
                    key={theme.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedThemeId === theme.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedThemeId(theme.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{theme.name}</h4>
                          {theme.isActive && (
                            <span className="text-xs text-primary">Active</span>
                          )}
                        </div>
                        {theme.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!theme.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateTheme(theme.id);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTheme(theme.id);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTheme(theme.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Deployment Center */}
          <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
            <h4 className="font-medium text-sm">Deployment Center</h4>
            
            {devicesLoading ? (
              <p className="text-xs text-foreground/50">Loading devices...</p>
            ) : devices.length === 0 ? (
              <p className="text-xs text-foreground/50">No devices registered</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-3 rounded border border-border/50 space-y-2 bg-background/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{device.deviceName}</p>
                        <p className="text-xs text-foreground/60">{device.location}</p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          device.onlineStatus ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 flex-1"
                        onClick={() => {
                          if (selectedThemeId) {
                            toast.success('Deploying theme...');
                          } else {
                            toast.error('Please select a theme first');
                          }
                        }}
                      >
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => toast.success('Restarting device...')}
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
