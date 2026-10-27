import React from 'react';
import { HeroSection } from '../components/home/HeroSection.js';
import { BeyondTheOrdinarySection } from '../components/home/BeyondTheOrdinarySection.js';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onEnterWorkspace: () => void;
  onOpenAssistant?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onEnterWorkspace, onOpenAssistant }) => {
  return (
    <div className="w-full min-h-screen bg-raze-bg overflow-x-hidden">
      <HeroSection
        onNavigate={onNavigate}
        onEnterWorkspace={onEnterWorkspace}
        onOpenAssistant={onOpenAssistant}
      />
      <BeyondTheOrdinarySection onNavigate={onNavigate} />
    </div>
  );
};
