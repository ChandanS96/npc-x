import React, { useState } from 'react';
import { Terminal, ArrowDown, Shield, Sparkles, Layers, Box } from 'lucide-react';
import { CosmicScene } from '../3d/CosmicScene.js';
import { RazeWordmark } from './RazeWordmark.js';
import { InteractiveEnterButton } from './InteractiveEnterButton.js';
import { HomeNavbar } from './HomeNavbar.js';
import { CentralHoodedFigure } from './CentralHoodedFigure.js';
import { useMouseParallax } from '../../hooks/useMouseParallax.js';

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  onEnterWorkspace: () => void;
  onOpenAssistant?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, onEnterWorkspace, onOpenAssistant }) => {
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [displayMode, setDisplayMode] = useState<'artwork' | '3d' | 'hybrid'>('artwork');

  // Multi-plane mouse parallax with buttery smooth lerp interpolation
  const { bgOffset, entityOffset, uiOffset, glowOffset, pixel, isHovered } = useMouseParallax({
    lerpFactor: 0.075
  });

  const handleScrollDown = () => {
    const nextSection = document.getElementById('beyond-ordinary');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="experience-hero"
      className="relative w-full h-screen min-h-[720px] overflow-hidden bg-raze-bg flex flex-col justify-between select-none"
    >
      {/* 1. Interactive Cursor Glow Spotlight (Follows mouse across the screen) */}
      <div
        className="pointer-events-none fixed z-15 w-[420px] h-[420px] rounded-full transition-opacity duration-500 hidden md:block"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${pixel.x - 210}px, ${pixel.y - 210}px, 0)`,
          background: 'radial-gradient(circle, rgba(255,45,247,0.14) 0%, rgba(155,92,255,0.06) 45%, transparent 70%)',
          filter: 'blur(30px)',
          opacity: isHovered ? 1 : 0
        }}
      />

      {/* 2. Deep Space Subtle Grid & Vertical Dashed Guidelines (Parallax Layer 1) */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 cosmic-grid-overlay" />
      <div
        className="absolute inset-0 pointer-events-none z-10 flex justify-between px-10 sm:px-28 transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${bgOffset.x * 0.4}px, 0, 0)`
        }}
      >
        <div className="w-[1px] h-full cosmic-dashed-line opacity-25" />
        <div className="w-[1px] h-full cosmic-dashed-line opacity-25" />
      </div>

      {/* 3. Top Navigation */}
      <HomeNavbar
        onNavigate={onNavigate}
        onEnterWorkspace={onEnterWorkspace}
        onOpenAssistant={onOpenAssistant}
      />

      {/* 4. Three.js Cosmic Canvas (Stardust Particles & Dynamic Lighting) - Parallax Layer 0 */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${bgOffset.x}px, ${bgOffset.y}px, 0) scale(1.05)`
        }}
      >
        <CosmicScene
          isButtonHovered={isButtonHovered}
          showEntityMesh={displayMode === '3d' || displayMode === 'hybrid'}
        />
      </div>

      {/* 5. Central Hooded Entity Visual (The Striking Artwork with Volumetric Core Glow) - Parallax Layer 2 */}
      {(displayMode === 'artwork' || displayMode === 'hybrid') && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative -mt-6 sm:-mt-10">
            <CentralHoodedFigure
              imageSrc="/assets/hooded-figure.jpg"
              entityOffset={entityOffset}
              glowOffset={glowOffset}
              isInteracting={isButtonHovered}
            />
          </div>
        </div>
      )}

      {/* 6. Left Side Introductory Text Block - Parallax Layer 3 */}
      <div
        className="absolute left-6 sm:left-12 top-1/3 -translate-y-1/2 z-25 max-w-[260px] select-none pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${uiOffset.x * 0.8}px, ${uiOffset.y * 0.8}px, 0)`
        }}
      >
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-extrabold tracking-widest text-white uppercase leading-relaxed">
            <span className="text-2xl text-brand-magenta font-black mr-0.5">W</span>here creativity meets technology.
          </p>
          <p className="text-[11px] sm:text-xs text-raze-mutedText font-medium leading-relaxed">
            Beyond the ordinary. Into the unknown.
          </p>
        </div>
      </div>

      {/* 7. Center Visual Composition: Primary Oversized Wordmark & Circular Button - Parallax Layer 4 */}
      <div
        className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `translate3d(${uiOffset.x * 1.3}px, ${uiOffset.y * 1.3}px, 0)`
        }}
      >
        {/* Primary High-Quality Stylized Wordmark (Sole Logo) */}
        <div className="w-full max-w-2xl px-4 flex justify-center items-center mb-6 sm:mb-8 pointer-events-auto">
          <RazeWordmark />
        </div>

        {/* Central Glowing Circular Interaction: "ENTER WORKSPACE" */}
        <div className="pointer-events-auto">
          <InteractiveEnterButton
            onClick={onEnterWorkspace}
            onHoverStateChange={setIsButtonHovered}
          />
        </div>
      </div>

      {/* 8. Bottom Bar: Social Links, Mode Switcher, and Scroll Indicator */}
      <div className="relative z-40 px-6 sm:px-12 py-6 flex flex-wrap items-center justify-between gap-4 select-none">
        {/* Bottom Left Platform Links */}
        <div className="flex items-center gap-4 text-raze-mutedText text-xs font-mono">
          <button
            onClick={() => onNavigate('/repositories')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            title="Inspect Repositories"
          >
            <Terminal className="w-4 h-4 text-brand-neon" />
            <span className="hidden sm:inline">Repositories</span>
          </button>
          <button
            onClick={() => onNavigate('/memory')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            title="Verification Memory"
          >
            <Shield className="w-4 h-4 text-brand-magenta" />
            <span className="hidden sm:inline">Memory</span>
          </button>
        </div>

        {/* Interactive Mode Switcher Pill */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-glass text-[11px] font-mono">
          <button
            onClick={() => setDisplayMode('artwork')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              displayMode === 'artwork'
                ? 'bg-gradient-to-r from-brand-magenta to-[#9B5CFF] text-white shadow-nebula-sm font-bold'
                : 'text-text-muted hover:text-white'
            }`}
            title="Show Celestial Hooded Figure with Feathered Blending"
          >
            <Sparkles className="w-3 h-3" />
            <span>Artwork</span>
          </button>
          <button
            onClick={() => setDisplayMode('3d')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              displayMode === '3d'
                ? 'bg-gradient-to-r from-brand-magenta to-[#9B5CFF] text-white shadow-nebula-sm font-bold'
                : 'text-text-muted hover:text-white'
            }`}
            title="Show Procedural 3D WebGL Mesh"
          >
            <Box className="w-3 h-3" />
            <span>3D Mesh</span>
          </button>
          <button
            onClick={() => setDisplayMode('hybrid')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              displayMode === 'hybrid'
                ? 'bg-gradient-to-r from-brand-magenta to-[#9B5CFF] text-white shadow-nebula-sm font-bold'
                : 'text-text-muted hover:text-white'
            }`}
            title="Layered 3D WebGL Particles + Hooded Artwork"
          >
            <Layers className="w-3 h-3" />
            <span>Hybrid</span>
          </button>
        </div>

        {/* Bottom Right Animated Scroll Indicator */}
        <button
          onClick={handleScrollDown}
          className="flex items-center gap-2 text-raze-mutedText hover:text-white transition-colors text-xs font-mono tracking-wider group cursor-pointer"
        >
          <span className="group-hover:text-brand-magenta transition-colors">SCROLL TO EXPLORE</span>
          <ArrowDown className="w-4 h-4 text-brand-neon animate-bounce" />
        </button>
      </div>
    </section>
  );
};
