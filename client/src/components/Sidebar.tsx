import React from 'react';
import {
  Shield,
  Activity,
  FolderGit2,
  PlusCircle,
  History,
  Brain,
  Settings,
  Sparkles,
  ExternalLink,
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onOpenAssistant }) => {
  const navItems = [
    { id: '/', label: '3D Experience', icon: Sparkles },
    { id: '/workspace', label: 'Workspace Overview', icon: Activity },
    { id: '/repositories', label: 'Repositories', icon: FolderGit2 },
    { id: '/verify/new', label: 'New Verification', icon: PlusCircle, highlight: true },
    { id: '/runs', label: 'Verification Runs', icon: History },
    { id: '/memory', label: 'Verification Memory', icon: Brain },
    { id: '/settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#030206]/85 backdrop-blur-2xl border-r border-white/10 flex flex-col h-screen select-none relative z-30 shadow-2xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
          <div className="w-11 h-11 rounded-xl bg-black/60 border border-brand-magenta/40 flex items-center justify-center shadow-lg shadow-brand-magenta/25 group-hover:scale-105 transition-all overflow-hidden p-0.5">
            <img src="/raze-cyber-shield.jpg" alt="RAZE 3D Shield" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-widest text-white group-hover:text-brand-magenta transition-colors">RAZE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-magenta/15 text-brand-magenta border border-brand-magenta/30">OS</span>
            </div>
            <p className="text-[11px] text-text-secondary truncate">Self-Protecting Ecosystem</p>
          </div>
        </div>
      </div>

      {/* Trust Collapse Engine Banner */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-brand-magenta/25 shadow-nebula-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-brand-magenta flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-brand-magenta" />
            Trust Collapse Engine
          </span>
          <span className="w-2 h-2 rounded-full bg-status-pass agent-running-pulse"></span>
        </div>
        <p className="text-[10px] text-text-secondary leading-relaxed">
          Proves whether code is safe through adversarial checks & shadow sandboxing.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted px-3 py-1">Platform Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.id || (item.id !== '/' && currentPath.startsWith(item.id));
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-magenta/15 text-white border border-brand-magenta/40 shadow-nebula-sm font-semibold'
                  : item.highlight
                  ? 'bg-gradient-to-r from-brand-neon to-brand-magenta text-white hover:opacity-95 shadow-lg shadow-brand-magenta/25 my-1 font-bold'
                  : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-magenta' : item.highlight ? 'text-white' : 'text-text-muted'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Contextual Assistant Trigger */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-violet/20 to-brand-magenta/15 border border-brand-magenta/30 hover:border-brand-magenta/60 text-xs font-medium text-white transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-magenta/25 flex items-center justify-center text-brand-magenta group-hover:scale-105 transition-transform shadow-nebula-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-semibold text-white">Evidence Assistant</div>
              <div className="text-[10px] text-text-secondary">Ask questions about runs</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Engine Status Footer */}
      <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-pass"></span>
          <span className="text-white/80">Shadow Mode: Active</span>
        </div>
        <span className="font-mono text-[10px] text-brand-magenta/80">v1.0.0</span>
      </div>
    </aside>
  );
};
