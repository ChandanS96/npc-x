import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Terminal,
  Database
} from 'lucide-react';
import { fetchSettingsStatus, fetchHealth } from '../api/client.js';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsData, healthRes] = await Promise.all([
        fetchSettingsStatus(),
        fetchHealth()
      ]);
      setStatus(settingsData);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-magenta" />
            <span>Platform Infrastructure & Security Settings</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure test runners, shadow sandboxes, LLM adapters, and circuit breaker policies.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-2xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:border-brand-magenta/40 transition-all shadow-glass"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid of Settings Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Execution Sandbox & Shadow Mode */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-glass space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-magenta/15 text-brand-magenta flex items-center justify-center shadow-nebula-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Signature Feature: Repair Shadow Mode
              </h3>
              <p className="text-[11px] text-text-muted">Isolated ephemeral testing workspaces</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Isolation Environment:</span>
              <span className="font-mono text-status-pass font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active (Isolated Copy)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Host Execution Restriction:</span>
              <span className="font-mono text-brand-neon font-bold">Bundled Repos Only</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Ephemeral Cleanup:</span>
              <span className="font-mono text-white">Automated Post-Run</span>
            </div>
          </div>
        </div>

        {/* 2. Security Circuit Breaker */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-glass space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-status-blocked/15 text-status-blocked flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Security Circuit Breaker
              </h3>
              <p className="text-[11px] text-text-muted">Automatic execution trip wire</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Circuit Status:</span>
              <span className="font-mono text-status-pass font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Armed & Nominal
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Execution Timeout:</span>
              <span className="font-mono text-brand-neon font-bold">15,000 ms</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Prohibited File Rules:</span>
              <span className="font-mono text-white">.env, id_rsa, /etc/*</span>
            </div>
          </div>
        </div>

        {/* 3. Provider & Model Adapter */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-glass space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-neon/15 text-brand-neon flex items-center justify-center shadow-nebula-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                LLM Provider & Assistant Adapter
              </h3>
              <p className="text-[11px] text-text-muted">Reasoning engine configuration</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Operating Mode:</span>
              <span className="font-mono text-brand-magenta font-bold">
                {status?.operatingMode || 'LOCAL_DETERMINISTIC_ENGINE'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Zero-Cost Offline Fallback:</span>
              <span className="font-mono text-status-pass font-bold">Enabled (No API Key Required)</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Bounded Repair Max Retries:</span>
              <span className="font-mono text-white font-bold">{status?.maxRepairRetries || 3} Iterations</span>
            </div>
          </div>
        </div>

        {/* 4. Persistence & Database */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-glass space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-magenta/15 text-brand-magenta flex items-center justify-center shadow-nebula-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Persistence & Storage
              </h3>
              <p className="text-[11px] text-text-muted">SQLite WAL & durable event log</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Database Engine:</span>
              <span className="font-mono text-brand-neon font-bold">
                {health?.database || 'node:sqlite (Node 24 built-in)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">Node Runtime Version:</span>
              <span className="font-mono text-white">{health?.nodeVersion || import.meta.env.VITE_APP_VERSION || 'v24.22.1'}</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-text-secondary">SSE Replay Sequence:</span>
              <span className="font-mono text-status-pass font-bold">Durable Event Log Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
