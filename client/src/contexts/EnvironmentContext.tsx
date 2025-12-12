import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Environment types
export type EnvironmentType = 
  | 'luxury-dojo-lounge'
  | 'zen-bamboo-garden'
  | 'samurai-red-dojo'
  | 'ultra-modern-white'
  | 'futuristic-neon';

export interface Environment {
  id: EnvironmentType;
  name: string;
  description: string;
  gradient: string;
  backgroundImage: string;
  overlayColor: string;
  accentColor: string;
  textColor: string;
  previewGradient: string;
}

// Environment definitions
export const environments: Environment[] = [
  {
    id: 'luxury-dojo-lounge',
    name: 'Luxury Dojo Lounge',
    description: 'Warm blurred lighting, hotel-style ambience',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(139, 90, 43, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(180, 120, 60, 0.3) 0%, transparent 50%), linear-gradient(135deg, #1a1410 0%, #2d1f15 50%, #1a1410 100%)',
    backgroundImage: '/environments/luxury-dojo-lounge.jpg',
    overlayColor: 'rgba(26, 20, 16, 0.6)',
    accentColor: '#D4A574',
    textColor: '#FFF8F0',
    previewGradient: 'linear-gradient(135deg, #2d1f15 0%, #8B5A2B 50%, #1a1410 100%)'
  },
  {
    id: 'zen-bamboo-garden',
    name: 'Zen Bamboo Garden',
    description: 'Soft green tones, light mist, natural ambience',
    gradient: 'radial-gradient(ellipse at 20% 30%, rgba(76, 140, 74, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(144, 180, 120, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0d1a0d 0%, #1a2a1a 50%, #0d1a0d 100%)',
    backgroundImage: '/environments/zen-bamboo-garden.jpg',
    overlayColor: 'rgba(13, 26, 13, 0.5)',
    accentColor: '#7CB342',
    textColor: '#E8F5E9',
    previewGradient: 'linear-gradient(135deg, #1a2a1a 0%, #4C8C4A 50%, #0d1a0d 100%)'
  },
  {
    id: 'samurai-red-dojo',
    name: 'Samurai Red Dojo',
    description: 'Dark wood, red accents, dramatic lighting',
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(180, 30, 30, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(100, 20, 20, 0.3) 0%, transparent 50%), linear-gradient(180deg, #1a0a0a 0%, #2a1010 50%, #1a0a0a 100%)',
    backgroundImage: '/environments/samurai-red-dojo.jpg',
    overlayColor: 'rgba(26, 10, 10, 0.5)',
    accentColor: '#E53935',
    textColor: '#FFEBEE',
    previewGradient: 'linear-gradient(135deg, #2a1010 0%, #B41E1E 50%, #1a0a0a 100%)'
  },
  {
    id: 'ultra-modern-white',
    name: 'Ultra-Modern White Dojo',
    description: 'Bright, clean, Apple-like aesthetic',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200, 200, 220, 0.1) 0%, transparent 50%), linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 50%, #f5f5f7 100%)',
    backgroundImage: '/environments/modern-white-dojo.jpg',
    overlayColor: 'rgba(245, 245, 247, 0.4)',
    accentColor: '#007AFF',
    textColor: '#1d1d1f',
    previewGradient: 'linear-gradient(135deg, #f5f5f7 0%, #c8c8d0 50%, #e8e8ed 100%)'
  },
  {
    id: 'futuristic-neon',
    name: 'Futuristic Neon Dojo',
    description: 'Digital neon accents, holographic atmosphere',
    gradient: 'radial-gradient(ellipse at 20% 20%, rgba(0, 255, 255, 0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(255, 0, 255, 0.15) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(0, 150, 255, 0.1) 0%, transparent 60%), linear-gradient(180deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)',
    backgroundImage: '/environments/futuristic-neon-dojo.jpg',
    overlayColor: 'rgba(10, 10, 26, 0.5)',
    accentColor: '#00FFFF',
    textColor: '#E0F7FA',
    previewGradient: 'linear-gradient(135deg, #0f0f2a 0%, #00CED1 30%, #FF00FF 70%, #0a0a1a 100%)'
  }
];

interface EnvironmentContextType {
  currentEnvironment: Environment;
  setEnvironment: (id: EnvironmentType) => void;
  defaultEnvironment: EnvironmentType | null;
  setDefaultEnvironment: (id: EnvironmentType) => void;
  isTransitioning: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const STORAGE_KEY = 'dojoflow-default-environment';

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [currentEnvironmentId, setCurrentEnvironmentId] = useState<EnvironmentType>('samurai-red-dojo');
  const [defaultEnvironment, setDefaultEnvironmentState] = useState<EnvironmentType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load default environment from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && environments.find(e => e.id === saved)) {
      setDefaultEnvironmentState(saved as EnvironmentType);
      setCurrentEnvironmentId(saved as EnvironmentType);
    }
  }, []);

  const currentEnvironment = environments.find(e => e.id === currentEnvironmentId) || environments[2];

  const setEnvironment = (id: EnvironmentType) => {
    if (id === currentEnvironmentId) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentEnvironmentId(id);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  };

  const setDefaultEnvironment = (id: EnvironmentType) => {
    setDefaultEnvironmentState(id);
    localStorage.setItem(STORAGE_KEY, id);
    setEnvironment(id);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <EnvironmentContext.Provider value={{
      currentEnvironment,
      setEnvironment,
      defaultEnvironment,
      setDefaultEnvironment,
      isTransitioning,
      isModalOpen,
      openModal,
      closeModal
    }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}
