import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { HomePage } from './pages/HomePage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { RepositoriesPage } from './pages/RepositoriesPage.js';
import { NewVerificationPage } from './pages/NewVerificationPage.js';
import { RunsHistoryPage } from './pages/RunsHistoryPage.js';
import { LiveVerificationRoomPage } from './pages/LiveVerificationRoomPage.js';
import { MemoryPage } from './pages/MemoryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AssistantDrawer } from './components/AssistantDrawer.js';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract runId if path is /runs/:id
  const runIdMatch = currentPath.match(/^\/runs\/([^/?#]+)/);
  const activeRunId = runIdMatch ? runIdMatch[1] : undefined;

  const isExperienceHome = currentPath === '/';

  const renderContent = () => {
    if (isExperienceHome) {
      return (
        <HomePage
          onNavigate={navigate}
          onEnterWorkspace={() => navigate('/workspace')}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />
      );
    }
    if (currentPath === '/workspace') {
      return <OverviewPage onNavigate={navigate} />;
    }
    if (currentPath === '/repositories') {
      return <RepositoriesPage onNavigate={navigate} />;
    }
    if (currentPath === '/verify/new') {
      return <NewVerificationPage onNavigate={navigate} />;
    }
    if (currentPath === '/runs') {
      return <RunsHistoryPage onNavigate={navigate} />;
    }
    if (activeRunId) {
      return (
        <LiveVerificationRoomPage
          runId={activeRunId}
          onNavigate={navigate}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />
      );
    }
    if (currentPath === '/memory') {
      return <MemoryPage />;
    }
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }
    return <OverviewPage onNavigate={navigate} />;
  };

  return (
    <div className="flex h-screen bg-raze-bg text-text-primary overflow-hidden">
      {/* Show Persistent Sidebar on Platform Workspace Routes */}
      {!isExperienceHome && (
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar on Workspace Views */}
        {!isExperienceHome && (
          <Navbar
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            sseConnected={Boolean(activeRunId)}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${isExperienceHome ? 'p-0' : 'bg-[#020204] relative'}`}>
          {!isExperienceHome && (
            <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-brand-magenta/8 rounded-full blur-[140px] pointer-events-none" />
          )}
          {renderContent()}
        </main>
      </div>

      {/* Global Floating AI Assistant Launcher Button */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-brand-magenta via-[#9B5CFF] to-brand-neon hover:scale-105 active:scale-95 text-white font-bold text-xs shadow-2xl shadow-brand-magenta/40 border border-white/20 transition-all duration-300 group cursor-pointer"
          aria-label="Open RAZE Evidence Assistant"
          title="Open RAZE AI Evidence Assistant"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">AI Assistant</span>
        </button>
      )}

      {/* Contextual AI Evidence Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        runId={activeRunId}
      />
    </div>
  );
}
