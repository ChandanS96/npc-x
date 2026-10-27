import React from 'react';
import { Shield, Sparkles, Terminal, ArrowRight } from 'lucide-react';

interface HomeNavbarProps {
  onNavigate: (path: string) => void;
  onEnterWorkspace: () => void;
  onOpenAssistant?: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({ onNavigate, onEnterWorkspace, onOpenAssistant }) => {
  return (
    <header className="absolute top-0 inset-x-0 h-20 px-6 sm:px-12 flex items-center justify-between z-30 select-none">
      {/* Brand Logo */}
      <div
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-black/60 border border-brand-magenta/40 flex items-center justify-center shadow-lg shadow-brand-magenta/25 group-hover:scale-105 transition-all overflow-hidden p-0.5">
          <img src="/raze-app-icon.jpg" alt="RAZE Shield" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-widest text-base text-white group-hover:text-brand-magenta transition-colors">
              RAZE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-magenta/15 text-brand-magenta border border-brand-magenta/30">
              OS
            </span>
          </div>
          <span className="text-[9px] tracking-wider text-text-muted font-mono uppercase">
            Self-Protecting Ecosystem
          </span>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-text-secondary">
        <button
          onClick={() => {
            const el = document.getElementById('experience-hero');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="hover:text-white transition-colors"
        >
          Overview
        </button>
        <button
          onClick={() => {
            const el = document.getElementById('beyond-ordinary');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="hover:text-white transition-colors"
        >
          Capabilities
        </button>
        <button
          onClick={() => onNavigate('/repositories')}
          className="hover:text-white transition-colors"
        >
          Repositories
        </button>
        <button
          onClick={() => onNavigate('/memory')}
          className="hover:text-white transition-colors"
        >
          Memory Bank
        </button>
      </nav>

      {/* Right Launch CTA */}
      <div className="flex items-center gap-3">
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/50 hover:bg-brand-magenta/20 border border-brand-magenta/35 hover:border-brand-magenta/60 text-xs font-semibold text-white transition-all shadow-nebula-sm cursor-pointer group"
            title="Open AI Evidence Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-magenta group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}
        <button
          onClick={onEnterWorkspace}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-neon to-brand-violet hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-brand-neon/25 border border-brand-neon/40 transition-all cursor-pointer group"
        >
          <span>Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </header>
  );
};
