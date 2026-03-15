import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Environment types — original 5 + 19 new industry-specific environments + custom upload
export type EnvironmentType = 
  // ── Custom Upload ─────────────────────────────────────────────────────────
  | 'custom-upload'
  // ── Original Environments ──────────────────────────────────────────────────
  | 'luxury-dojo-lounge'
  | 'zen-bamboo-garden'
  | 'samurai-red-dojo'
  | 'ultra-modern-white'
  | 'futuristic-neon'
  // ── Martial Arts (3) ──────────────────────────────────────────────────────
  | 'ma-traditional-dojo'
  | 'ma-outdoor-training'
  | 'ma-mountain-dojo'
  // ── MMA (3) ───────────────────────────────────────────────────────────────
  | 'mma-training-facility'
  | 'mma-cage-night'
  | 'mma-underground-gym'
  // ── Boxing (3) ────────────────────────────────────────────────────────────
  | 'boxing-gym'
  | 'boxing-vintage-gym'
  | 'boxing-championship-arena'
  // ── Kickboxing / Muay Thai (3) ────────────────────────────────────────────
  | 'muay-thai-gym'
  | 'kickboxing-modern-gym'
  | 'kickboxing-fight-night'
  // ── Dance (3) ─────────────────────────────────────────────────────────────
  | 'dance-studio'
  | 'dance-ballet-studio'
  | 'dance-hiphop-studio'
  // ── Yoga / Wellness (3) ───────────────────────────────────────────────────
  | 'yoga-wellness-studio'
  | 'yoga-sunrise-studio'
  | 'yoga-cave-studio'
  // ── Fitness (3) ───────────────────────────────────────────────────────────
  | 'fitness-modern-gym'
  | 'fitness-crossfit-box'
  | 'fitness-outdoor-bootcamp'
  // ── Personal Training (3) ─────────────────────────────────────────────────
  | 'pt-luxury-studio'
  | 'pt-home-gym'
  | 'pt-outdoor-training'
  | string; // allow dynamic custom IDs like 'custom-upload-1'

// Industry tags for auto-default selection
export type IndustryTag = 
  | 'martial_arts'
  | 'mma'
  | 'boxing'
  | 'kickboxing'
  | 'dance'
  | 'yoga'
  | 'yoga_dance'
  | 'fitness'
  | 'wellness'
  | 'personal_trainer'
  | 'other';

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
  /** Industry tags for auto-default selection based on dojo's configured industry */
  industryTags?: IndustryTag[];
  /** Whether this is a featured/recommended environment for its industry */
  featured?: boolean;
  /** Whether this is a newly added environment (shows "New" badge) */
  isNew?: boolean;
}

// ── Environment Definitions ────────────────────────────────────────────────────
export const environments: Environment[] = [

  // ── Original 5 Environments ─────────────────────────────────────────────────
  {
    id: 'luxury-dojo-lounge',
    name: 'Luxury Dojo Lounge',
    description: 'Warm blurred lighting, hotel-style ambience',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(139, 90, 43, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(180, 120, 60, 0.3) 0%, transparent 50%), linear-gradient(135deg, #1a1410 0%, #2d1f15 50%, #1a1410 100%)',
    backgroundImage: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/PXcKzCNZVepHTOGm.jpg',
    overlayColor: 'rgba(26, 20, 16, 0.6)',
    accentColor: '#D4A574',
    textColor: '#FFF8F0',
    previewGradient: 'linear-gradient(135deg, #2d1f15 0%, #8B5A2B 50%, #1a1410 100%)',
    industryTags: ['martial_arts', 'fitness', 'personal_trainer'],
  },
  {
    id: 'zen-bamboo-garden',
    name: 'Zen Bamboo Garden',
    description: 'Soft green tones, light mist, natural ambience',
    gradient: 'radial-gradient(ellipse at 20% 30%, rgba(76, 140, 74, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(144, 180, 120, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0d1a0d 0%, #1a2a1a 50%, #0d1a0d 100%)',
    backgroundImage: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UOwkrEABESgnZuNQ.jpg',
    overlayColor: 'rgba(13, 26, 13, 0.5)',
    accentColor: '#7CB342',
    textColor: '#E8F5E9',
    previewGradient: 'linear-gradient(135deg, #1a2a1a 0%, #4C8C4A 50%, #0d1a0d 100%)',
    industryTags: ['yoga', 'yoga_dance', 'wellness'],
  },
  {
    id: 'samurai-red-dojo',
    name: 'Samurai Red Dojo',
    description: 'Dark wood, red accents, dramatic lighting',
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(180, 30, 30, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(100, 20, 20, 0.3) 0%, transparent 50%), linear-gradient(180deg, #1a0a0a 0%, #2a1010 50%, #1a0a0a 100%)',
    backgroundImage: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ugnubCOBHKeIkuoE.jpg',
    overlayColor: 'rgba(26, 10, 10, 0.5)',
    accentColor: '#E53935',
    textColor: '#FFEBEE',
    previewGradient: 'linear-gradient(135deg, #2a1010 0%, #B41E1E 50%, #1a0a0a 100%)',
    industryTags: ['martial_arts'],
  },
  {
    id: 'ultra-modern-white',
    name: 'Ultra-Modern White Dojo',
    description: 'Bright, clean, Apple-like aesthetic',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200, 200, 220, 0.1) 0%, transparent 50%), linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 50%, #f5f5f7 100%)',
    backgroundImage: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/kEeFLUskzTlTWBMB.jpg',
    overlayColor: 'rgba(245, 245, 247, 0.4)',
    accentColor: '#007AFF',
    textColor: '#1d1d1f',
    previewGradient: 'linear-gradient(135deg, #f5f5f7 0%, #c8c8d0 50%, #e8e8ed 100%)',
    industryTags: ['fitness', 'personal_trainer', 'other'],
  },
  {
    id: 'futuristic-neon',
    name: 'Futuristic Neon Dojo',
    description: 'Digital neon accents, holographic atmosphere',
    gradient: 'radial-gradient(ellipse at 20% 20%, rgba(0, 255, 255, 0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(255, 0, 255, 0.15) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(0, 150, 255, 0.1) 0%, transparent 60%), linear-gradient(180deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)',
    backgroundImage: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BCsOHcdQwLEljnmO.jpg',
    overlayColor: 'rgba(10, 10, 26, 0.5)',
    accentColor: '#00FFFF',
    textColor: '#E0F7FA',
    previewGradient: 'linear-gradient(135deg, #0f0f2a 0%, #00CED1 30%, #FF00FF 70%, #0a0a1a 100%)',
    industryTags: ['fitness', 'mma', 'other'],
  },

  // ── Martial Arts (3) ────────────────────────────────────────────────────────
  {
    id: 'ma-traditional-dojo',
    name: 'Traditional Japanese Dojo',
    description: 'Polished wood floors, shoji screens, lantern glow',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(180, 120, 40, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(100, 60, 20, 0.35) 0%, transparent 50%), linear-gradient(180deg, #120a04 0%, #1e1208 50%, #120a04 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/ma-traditional-dojo-ms2TsGwQNqPJpArDRECHeN.webp',
    overlayColor: 'rgba(18, 10, 4, 0.5)',
    accentColor: '#D4A574',
    textColor: '#FFF8F0',
    previewGradient: 'linear-gradient(135deg, #1e1208 0%, #B47828 50%, #120a04 100%)',
    industryTags: ['martial_arts'],
    isNew: true,
    featured: true,
  },
  {
    id: 'ma-outdoor-training',
    name: 'Temple Courtyard at Golden Hour',
    description: 'Stone courtyard, cherry blossoms, ancient temple walls',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(220, 140, 40, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(80, 140, 60, 0.25) 0%, transparent 50%), linear-gradient(180deg, #0e0c08 0%, #1c1810 50%, #0e0c08 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/ma-outdoor-training-V2y3bbrMkcTpo7EGSZjmca.webp',
    overlayColor: 'rgba(14, 12, 8, 0.45)',
    accentColor: '#F59E0B',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #1c1810 0%, #DC8C28 50%, #0e0c08 100%)',
    industryTags: ['martial_arts'],
    isNew: true,
  },
  {
    id: 'ma-mountain-dojo',
    name: 'Mountain Summit Dojo',
    description: 'Misty peaks, dawn light, minimalist open-air dojo',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(255, 160, 60, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(100, 140, 180, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0a0e14 0%, #141e28 50%, #0a0e14 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/ma-mountain-dojo-PedXRZVueKhvL3V7wgt4hX.webp',
    overlayColor: 'rgba(10, 14, 20, 0.45)',
    accentColor: '#FB923C',
    textColor: '#FFF7ED',
    previewGradient: 'linear-gradient(135deg, #141e28 0%, #FFA03C 50%, #0a0e14 100%)',
    industryTags: ['martial_arts', 'wellness'],
    isNew: true,
  },

  // ── MMA (3) ─────────────────────────────────────────────────────────────────
  {
    id: 'mma-training-facility',
    name: 'MMA Training Facility',
    description: 'Octagon cage, industrial lighting, raw intensity',
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(30, 80, 140, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(180, 80, 20, 0.3) 0%, transparent 50%), linear-gradient(180deg, #080c14 0%, #0f1824 50%, #080c14 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/mma-gym-bg-8Ds9dsgNf6w4NdHEAQeeHH.png',
    overlayColor: 'rgba(8, 12, 20, 0.55)',
    accentColor: '#3B82F6',
    textColor: '#EFF6FF',
    previewGradient: 'linear-gradient(135deg, #0f1824 0%, #1e4080 40%, #b45014 100%)',
    industryTags: ['mma', 'martial_arts', 'kickboxing'],
    featured: true,
  },
  {
    id: 'mma-cage-night',
    name: 'Fight Night Arena',
    description: 'Empty octagon under arena spotlights, electric atmosphere',
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(60, 100, 200, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(20, 30, 60, 0.4) 0%, transparent 50%), linear-gradient(180deg, #060810 0%, #0c1020 50%, #060810 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/mma-cage-night-LJrC97RughzQrjxVZDqmGt.png',
    overlayColor: 'rgba(6, 8, 16, 0.55)',
    accentColor: '#60A5FA',
    textColor: '#EFF6FF',
    previewGradient: 'linear-gradient(135deg, #0c1020 0%, #3C64C8 50%, #060810 100%)',
    industryTags: ['mma', 'kickboxing', 'boxing'],
    isNew: true,
  },
  {
    id: 'mma-underground-gym',
    name: 'Underground Fight Gym',
    description: 'Exposed brick, hanging bags, gritty industrial atmosphere',
    gradient: 'radial-gradient(ellipse at 30% 30%, rgba(60, 40, 20, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(100, 60, 20, 0.3) 0%, transparent 50%), linear-gradient(180deg, #0a0806 0%, #14100a 50%, #0a0806 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/mma-underground-gym-5A7Yy3mCjDDg7RvTsLxuq3.webp',
    overlayColor: 'rgba(10, 8, 6, 0.55)',
    accentColor: '#F97316',
    textColor: '#FFF7ED',
    previewGradient: 'linear-gradient(135deg, #14100a 0%, #7C3C14 50%, #0a0806 100%)',
    industryTags: ['mma', 'martial_arts', 'boxing'],
    isNew: true,
  },

  // ── Boxing (3) ──────────────────────────────────────────────────────────────
  {
    id: 'boxing-gym',
    name: 'Boxing Gym',
    description: 'Classic ring, vintage posters, gritty championship feel',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(200, 30, 30, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(60, 20, 20, 0.4) 0%, transparent 50%), linear-gradient(180deg, #120808 0%, #1e0c0c 50%, #120808 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/boxing-gym-bg-7bUyodH4qGDepGqYj2Nn7H.png',
    overlayColor: 'rgba(18, 8, 8, 0.55)',
    accentColor: '#EF4444',
    textColor: '#FFF1F2',
    previewGradient: 'linear-gradient(135deg, #1e0c0c 0%, #DC2626 50%, #120808 100%)',
    industryTags: ['boxing', 'fitness', 'martial_arts'],
    featured: true,
  },
  {
    id: 'boxing-vintage-gym',
    name: 'Vintage Boxing Gym',
    description: 'Worn leather bags, golden light, 1940s fight posters',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(200, 140, 60, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(120, 80, 30, 0.35) 0%, transparent 50%), linear-gradient(180deg, #100c06 0%, #1e1608 50%, #100c06 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/boxing-vintage-gym-cRkfhYLHFCcWSgV5rXChXR.webp',
    overlayColor: 'rgba(16, 12, 6, 0.5)',
    accentColor: '#D97706',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #1e1608 0%, #C88C3C 50%, #100c06 100%)',
    industryTags: ['boxing', 'martial_arts'],
    isNew: true,
  },
  {
    id: 'boxing-championship-arena',
    name: 'Championship Arena',
    description: 'Blazing spotlights, packed arena, championship night',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(255, 200, 60, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(20, 10, 10, 0.5) 0%, transparent 50%), linear-gradient(180deg, #080406 0%, #100808 50%, #080406 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/boxing-championship-arena-v2-jkxuyx354SbyB3Xnt5Yk49.webp',
    overlayColor: 'rgba(8, 4, 6, 0.55)',
    accentColor: '#FCD34D',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #100808 0%, #FFC83C 50%, #080406 100%)',
    industryTags: ['boxing', 'mma', 'kickboxing'],
    isNew: true,
  },

  // ── Kickboxing / Muay Thai (3) ───────────────────────────────────────────────
  {
    id: 'muay-thai-gym',
    name: 'Muay Thai Gym',
    description: 'Traditional Thai ring, lanterns, cultural authenticity',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(200, 100, 20, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(140, 40, 10, 0.35) 0%, transparent 50%), linear-gradient(180deg, #140a04 0%, #201008 50%, #140a04 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/muay-thai-gym-bg-bhKjVDk5LdiaXm8ufPUxwQ.png',
    overlayColor: 'rgba(20, 10, 4, 0.5)',
    accentColor: '#F59E0B',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #201008 0%, #C86414 50%, #8C280A 100%)',
    industryTags: ['kickboxing', 'mma', 'martial_arts'],
    featured: true,
  },
  {
    id: 'kickboxing-modern-gym',
    name: 'Kickboxing Power Gym',
    description: 'Black and red neon, heavy bags in a row, high-energy',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(220, 30, 30, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(40, 10, 10, 0.5) 0%, transparent 50%), linear-gradient(180deg, #0c0404 0%, #180808 50%, #0c0404 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/kickboxing-power-gym-v2-RJ8fSwtPxamsUa4WjFbUwe.webp',
    overlayColor: 'rgba(12, 4, 4, 0.5)',
    accentColor: '#EF4444',
    textColor: '#FFF1F2',
    previewGradient: 'linear-gradient(135deg, #180808 0%, #DC1E1E 50%, #0c0404 100%)',
    industryTags: ['kickboxing', 'mma', 'boxing'],
    isNew: true,
  },
  {
    id: 'kickboxing-fight-night',
    name: 'Kickboxing Fight Night',
    description: 'Packed arena, LED entrance tunnel, championship energy',
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(100, 60, 200, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(200, 60, 100, 0.3) 0%, transparent 50%), linear-gradient(180deg, #080610 0%, #100c1e 50%, #080610 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/kickboxing-fight-night-KCPNTwMCswHk2hdaJ2ZLnb.webp',
    overlayColor: 'rgba(8, 6, 16, 0.5)',
    accentColor: '#A78BFA',
    textColor: '#F5F3FF',
    previewGradient: 'linear-gradient(135deg, #100c1e 0%, #6440C8 40%, #C83C64 100%)',
    industryTags: ['kickboxing', 'boxing', 'mma'],
    isNew: true,
  },

  // ── Dance (3) ────────────────────────────────────────────────────────────────
  {
    id: 'dance-studio',
    name: 'Dance Studio',
    description: 'Mirrored walls, stage spotlights, performance energy',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(180, 80, 200, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(220, 160, 60, 0.3) 0%, transparent 50%), linear-gradient(180deg, #1a0a20 0%, #2a1030 50%, #1a0a20 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/dance-studio-bg-afMz6h4wr3mdHb5Ec2g3XN.png',
    overlayColor: 'rgba(26, 10, 32, 0.5)',
    accentColor: '#C084FC',
    textColor: '#FAF5FF',
    previewGradient: 'linear-gradient(135deg, #2a1030 0%, #9333EA 40%, #D97706 100%)',
    industryTags: ['dance', 'yoga_dance'],
    featured: true,
  },
  {
    id: 'dance-ballet-studio',
    name: 'Ballet Studio',
    description: 'Wooden barres, sheer curtains, afternoon light',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(220, 180, 140, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(180, 160, 120, 0.2) 0%, transparent 50%), linear-gradient(180deg, #1a1610 0%, #2a2418 50%, #1a1610 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/dance-ballet-studio-Wuqk4dvByhZ5SMNyEzHrpG.webp',
    overlayColor: 'rgba(26, 22, 16, 0.35)',
    accentColor: '#F9A8D4',
    textColor: '#FDF2F8',
    previewGradient: 'linear-gradient(135deg, #2a2418 0%, #DCC88C 50%, #1a1610 100%)',
    industryTags: ['dance', 'yoga_dance', 'wellness'],
    isNew: true,
  },
  {
    id: 'dance-hiphop-studio',
    name: 'Hip-Hop Dance Studio',
    description: 'Graffiti murals, purple-blue LED strips, urban energy',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(120, 40, 200, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(40, 100, 200, 0.35) 0%, transparent 50%), linear-gradient(180deg, #0a0614 0%, #140c20 50%, #0a0614 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/dance-hiphop-studio-MxJAkNrP9ikQ32dzB8GFs9.webp',
    overlayColor: 'rgba(10, 6, 20, 0.5)',
    accentColor: '#818CF8',
    textColor: '#EEF2FF',
    previewGradient: 'linear-gradient(135deg, #140c20 0%, #7828C8 40%, #2864C8 100%)',
    industryTags: ['dance', 'fitness'],
    isNew: true,
  },

  // ── Yoga / Wellness (3) ──────────────────────────────────────────────────────
  {
    id: 'yoga-wellness-studio',
    name: 'Yoga & Wellness Studio',
    description: 'Golden hour light, bamboo floors, serene nature views',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(200, 160, 80, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(100, 160, 80, 0.25) 0%, transparent 50%), linear-gradient(180deg, #1a1508 0%, #2a2010 50%, #1a1508 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/yoga-wellness-bg-HcaW5HqsD77GfkLxNPbbCm.png',
    overlayColor: 'rgba(26, 21, 8, 0.35)',
    accentColor: '#D97706',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #2a2010 0%, #D97706 40%, #65A830 100%)',
    industryTags: ['yoga', 'yoga_dance', 'wellness', 'personal_trainer'],
    featured: true,
  },
  {
    id: 'yoga-sunrise-studio',
    name: 'Sunrise Yoga Studio',
    description: 'Mountain valley views, golden morning light, candles',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(255, 180, 60, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(80, 160, 80, 0.25) 0%, transparent 50%), linear-gradient(180deg, #141008 0%, #201808 50%, #141008 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/yoga-sunrise-studio-evnF3NdgoBCcvs9RMvZU2e.webp',
    overlayColor: 'rgba(20, 16, 8, 0.3)',
    accentColor: '#FCD34D',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #201808 0%, #FFB43C 50%, #141008 100%)',
    industryTags: ['yoga', 'wellness', 'personal_trainer'],
    isNew: true,
  },
  {
    id: 'yoga-cave-studio',
    name: 'Crystal Cave Sanctuary',
    description: 'Natural rock walls, crystal formations, candlelit altar',
    gradient: 'radial-gradient(ellipse at 40% 30%, rgba(160, 80, 200, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, rgba(200, 120, 40, 0.3) 0%, transparent 50%), linear-gradient(180deg, #0e0810 0%, #181018 50%, #0e0810 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/yoga-cave-studio-TVWqL7nWD8Ydadpf5i5BZV.webp',
    overlayColor: 'rgba(14, 8, 16, 0.45)',
    accentColor: '#C084FC',
    textColor: '#FAF5FF',
    previewGradient: 'linear-gradient(135deg, #181018 0%, #A050C8 40%, #C87828 100%)',
    industryTags: ['yoga', 'wellness'],
    isNew: true,
  },

  // ── Fitness (3) ──────────────────────────────────────────────────────────────
  {
    id: 'fitness-modern-gym',
    name: 'Luxury City Gym',
    description: 'Glass walls, city skyline at night, premium equipment',
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(40, 80, 160, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(20, 40, 80, 0.4) 0%, transparent 50%), linear-gradient(180deg, #060810 0%, #0c1018 50%, #060810 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/fitness-modern-gym-7bkiy47RMEPUDD2P5xoHDA.webp',
    overlayColor: 'rgba(6, 8, 16, 0.5)',
    accentColor: '#38BDF8',
    textColor: '#F0F9FF',
    previewGradient: 'linear-gradient(135deg, #0c1018 0%, #2850A0 50%, #060810 100%)',
    industryTags: ['fitness', 'personal_trainer'],
    isNew: true,
    featured: true,
  },
  {
    id: 'fitness-crossfit-box',
    name: 'CrossFit Box',
    description: 'Industrial warehouse, pull-up rigs, chalk dust in the air',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(200, 160, 80, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(60, 50, 30, 0.4) 0%, transparent 50%), linear-gradient(180deg, #0c0a06 0%, #181408 50%, #0c0a06 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/fitness-crossfit-box-jyK6D8UpMesrMZEu74zW76.webp',
    overlayColor: 'rgba(12, 10, 6, 0.5)',
    accentColor: '#F59E0B',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #181408 0%, #C8A050 50%, #0c0a06 100%)',
    industryTags: ['fitness', 'mma', 'personal_trainer'],
    isNew: true,
  },
  {
    id: 'fitness-outdoor-bootcamp',
    name: 'Outdoor Bootcamp at Dawn',
    description: 'Obstacle course, misty sunrise, military-style training',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(255, 160, 40, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(80, 100, 60, 0.3) 0%, transparent 50%), linear-gradient(180deg, #0c0a06 0%, #181408 50%, #0c0a06 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/fitness-outdoor-bootcamp-bKVt9M3UvUrne7CpnjUuh2.webp',
    overlayColor: 'rgba(12, 10, 6, 0.4)',
    accentColor: '#FB923C',
    textColor: '#FFF7ED',
    previewGradient: 'linear-gradient(135deg, #181408 0%, #FFA028 50%, #0c0a06 100%)',
    industryTags: ['fitness', 'personal_trainer', 'mma'],
    isNew: true,
  },

  // ── Personal Training (3) ────────────────────────────────────────────────────
  {
    id: 'pt-luxury-studio',
    name: 'Luxury Private Studio',
    description: 'Marble walls, premium equipment, exclusive aesthetic',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(220, 200, 160, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(160, 140, 100, 0.25) 0%, transparent 50%), linear-gradient(180deg, #141210 0%, #201e18 50%, #141210 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/pt-luxury-studio-S2BTHgqUFRDn6msnbLgz2j.webp',
    overlayColor: 'rgba(20, 18, 16, 0.35)',
    accentColor: '#D4A574',
    textColor: '#FFF8F0',
    previewGradient: 'linear-gradient(135deg, #201e18 0%, #DCC8A0 50%, #141210 100%)',
    industryTags: ['personal_trainer', 'fitness', 'wellness'],
    isNew: true,
    featured: true,
  },
  {
    id: 'pt-home-gym',
    name: 'Premium Home Gym',
    description: 'Garage conversion, neon sign, aspirational lifestyle',
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(200, 140, 40, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(80, 60, 30, 0.35) 0%, transparent 50%), linear-gradient(180deg, #100c06 0%, #1c1608 50%, #100c06 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/pt-home-gym-4hL6ug2kMExiCHCcJJPaHA.webp',
    overlayColor: 'rgba(16, 12, 6, 0.45)',
    accentColor: '#F59E0B',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #1c1608 0%, #C88C28 50%, #100c06 100%)',
    industryTags: ['personal_trainer', 'fitness'],
    isNew: true,
  },
  {
    id: 'pt-outdoor-training',
    name: 'Coastal Outdoor Training',
    description: 'Ocean cliffs, golden sunset, premium outdoor equipment',
    gradient: 'radial-gradient(ellipse at 50% 20%, rgba(255, 180, 60, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(40, 100, 140, 0.3) 0%, transparent 50%), linear-gradient(180deg, #0c1014 0%, #141c20 50%, #0c1014 100%)',
    backgroundImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/CaitGcU2dUvj49bXGJVNcB/pt-outdoor-training-7GjRj57qQLDmrnXq6PZjpC.webp',
    overlayColor: 'rgba(12, 16, 20, 0.35)',
    accentColor: '#FCD34D',
    textColor: '#FFFBEB',
    previewGradient: 'linear-gradient(135deg, #141c20 0%, #FFB43C 50%, #2864A0 100%)',
    industryTags: ['personal_trainer', 'fitness', 'wellness'],
    isNew: true,
  },
];

/**
 * Map from dojo_settings.industry values to the best default environment ID.
 * Each industry now maps to its featured/primary environment.
 */
const INDUSTRY_DEFAULT_ENVIRONMENT: Record<string, EnvironmentType> = {
  martial_arts: 'ma-traditional-dojo',
  mma: 'mma-training-facility',
  boxing: 'boxing-gym',
  kickboxing: 'muay-thai-gym',
  dance: 'dance-studio',
  yoga: 'yoga-wellness-studio',
  yoga_dance: 'dance-studio',
  wellness: 'yoga-cave-studio',
  fitness: 'fitness-modern-gym',
  personal_trainer: 'pt-luxury-studio',
  other: 'luxury-dojo-lounge',
};

/**
 * Get the recommended default environment for a given industry string.
 * Performs a case-insensitive partial match so values like "Martial Arts School"
 * still resolve correctly.
 */
export function getDefaultEnvironmentForIndustry(industry: string | null | undefined): EnvironmentType {
  if (!industry) return 'samurai-red-dojo';
  const normalized = industry.toLowerCase().replace(/[\s-]/g, '_');
  // Exact match first
  if (INDUSTRY_DEFAULT_ENVIRONMENT[normalized]) {
    return INDUSTRY_DEFAULT_ENVIRONMENT[normalized];
  }
  // Partial match
  for (const [key, envId] of Object.entries(INDUSTRY_DEFAULT_ENVIRONMENT)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return envId;
    }
  }
  return 'samurai-red-dojo';
}

interface EnvironmentContextType {
  currentEnvironment: Environment;
  setEnvironment: (id: EnvironmentType) => void;
  defaultEnvironment: EnvironmentType | null;
  setDefaultEnvironment: (id: EnvironmentType) => void;
  isTransitioning: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  // Industry-aware initialization
  initializeForIndustry: (industry: string | null | undefined) => void;
  // Custom upload environments
  customEnvironments: Environment[];
  addCustomEnvironment: (name: string, imageUrl: string) => void;
  removeCustomEnvironment: (id: string) => void;
  // Presentation mode
  isPresentationMode: boolean;
  presentationInterval: number;
  presentationProgress: number;
  togglePresentationMode: () => void;
  setPresentationInterval: (seconds: number) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const STORAGE_KEY = 'dojoflow-default-environment';
const INDUSTRY_INITIALIZED_KEY = 'dojoflow-industry-initialized';
const CUSTOM_ENVIRONMENTS_KEY = 'dojoflow-custom-environments';

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [currentEnvironmentId, setCurrentEnvironmentId] = useState<EnvironmentType>('samurai-red-dojo');
  const [defaultEnvironment, setDefaultEnvironmentState] = useState<EnvironmentType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customEnvironments, setCustomEnvironments] = useState<Environment[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_ENVIRONMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // Presentation mode state
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationInterval, setPresentationIntervalState] = useState(10); // seconds
  const [presentationProgress, setPresentationProgress] = useState(0);

  // Load default environment from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const allEnvs = [...environments, ...customEnvironments];
    if (saved && allEnvs.find(e => e.id === saved)) {
      setDefaultEnvironmentState(saved as EnvironmentType);
      setCurrentEnvironmentId(saved as EnvironmentType);
    }
  }, []);

  const allEnvironments = [...environments, ...customEnvironments];
  const currentEnvironment = allEnvironments.find(e => e.id === currentEnvironmentId) || environments[2];

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

  /**
   * Called once after the dojo's industry is known (e.g. after settings load).
   * Only sets the environment if the user has NOT previously chosen one manually.
   */
  const initializeForIndustry = (industry: string | null | undefined) => {
    const alreadyInitialized = localStorage.getItem(INDUSTRY_INITIALIZED_KEY);
    const savedDefault = localStorage.getItem(STORAGE_KEY);
    // If user already has a saved preference, respect it
    if (savedDefault && environments.find(e => e.id === savedDefault)) return;
    // Only auto-set once per device
    if (alreadyInitialized) return;
    const recommended = getDefaultEnvironmentForIndustry(industry);
    setDefaultEnvironmentState(recommended);
    setCurrentEnvironmentId(recommended);
    localStorage.setItem(STORAGE_KEY, recommended);
    localStorage.setItem(INDUSTRY_INITIALIZED_KEY, '1');
  };

  const addCustomEnvironment = (name: string, imageUrl: string) => {
    const id = `custom-${Date.now()}`;
    const newEnv: Environment = {
      id,
      name: name || 'My Custom Environment',
      description: 'Custom uploaded backdrop',
      gradient: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
      backgroundImage: imageUrl,
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      accentColor: '#FF4C4C',
      textColor: '#FFFFFF',
      previewGradient: 'linear-gradient(135deg, #1a1a1a 0%, #FF4C4C 50%, #0a0a0a 100%)',
      industryTags: ['other'],
      isNew: true,
    };
    const updated = [...customEnvironments, newEnv];
    setCustomEnvironments(updated);
    localStorage.setItem(CUSTOM_ENVIRONMENTS_KEY, JSON.stringify(updated));
    // Auto-select the newly uploaded environment
    setDefaultEnvironment(id);
  };

  const removeCustomEnvironment = (id: string) => {
    const updated = customEnvironments.filter(e => e.id !== id);
    setCustomEnvironments(updated);
    localStorage.setItem(CUSTOM_ENVIRONMENTS_KEY, JSON.stringify(updated));
    // If this was the current environment, fall back to default
    if (currentEnvironmentId === id) {
      const fallback = (localStorage.getItem(STORAGE_KEY) as EnvironmentType) || 'samurai-red-dojo';
      setCurrentEnvironmentId(fallback !== id ? fallback : 'samurai-red-dojo');
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Presentation mode: auto-cycle through environments
  useEffect(() => {
    if (!isPresentationMode) {
      setPresentationProgress(0);
      return;
    }

    // Progress timer (updates every 100ms for smooth progress bar)
    const progressInterval = setInterval(() => {
      setPresentationProgress(prev => {
        const newProgress = prev + (100 / (presentationInterval * 10));
        return newProgress >= 100 ? 0 : newProgress;
      });
    }, 100);

    // Environment change timer
    const cycleInterval = setInterval(() => {
      const currentIndex = environments.findIndex(e => e.id === currentEnvironmentId);
      const nextIndex = (currentIndex + 1) % environments.length;
      setEnvironment(environments[nextIndex].id);
      setPresentationProgress(0);
    }, presentationInterval * 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(cycleInterval);
    };
  }, [isPresentationMode, presentationInterval, currentEnvironmentId]);

  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
  };

  const setPresentationInterval = (seconds: number) => {
    setPresentationIntervalState(Math.max(5, Math.min(60, seconds))); // 5-60 seconds
  };

  return (
    <EnvironmentContext.Provider value={{
      currentEnvironment,
      setEnvironment,
      defaultEnvironment,
      setDefaultEnvironment,
      isTransitioning,
      isModalOpen,
      openModal,
      closeModal,
      initializeForIndustry,
      customEnvironments,
      addCustomEnvironment,
      removeCustomEnvironment,
      isPresentationMode,
      presentationInterval,
      presentationProgress,
      togglePresentationMode,
      setPresentationInterval
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
