import React, { useEffect, useState } from 'react';
import {
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Brain,
  Gauge,
  ArrowRight,
  PlusCircle,
  History,
  Lock,
  GitBranch,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { fetchRuns, fetchRepositories, fetchMemory, createVerificationRun } from '../api/client.js';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [memoryCount, setMemoryCount] = useState<number>(0);
  const [reposCount, setReposCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [launchingDemo, setLaunchingDemo] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [runsData, memData, reposData] = await Promise.all([
        fetchRuns(),
        fetchMemory(),
        fetchRepositories()
      ]);
      setRuns(runsData);
      setMemoryCount(memData.length);
      setReposCount(reposData.length);
    } catch (err) {
      console.warn('Failed to load overview telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLaunchTrustCollapseDemo = async () => {
    try {
      setLaunchingDemo(true);
      const newRun = await createVerificationRun({
        repositoryId: 'repo-pricing-service',
        targetFile: 'src/pricing.ts',
        bugTitle: 'Defect #104: Boundary range failure & NaN underflow in calculateDiscount',
        bugDescription: 'Negative discount values accepted in calculateDiscount, resulting in price inflation and negative invoice totals',
        maxRetries: 3,
        triggerTrustCollapseDemo: true
      });
      onNavigate(`/runs/${newRun.id}`);
    } catch (err: any) {
      alert(`Failed to launch demo run: ${err.message}`);
    } finally {
      setLaunchingDemo(false);
    }
  };

  const totalRuns = runs.length;
  const verifiedCount = runs.filter(r => r.recommendation === 'READY_FOR_HUMAN_REVIEW').length;
  const trustCollapsedCount = runs.filter(r => r.trustCollapsed).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Showcase: Trust Collapse Engine */}
      <div className="relative rounded-2xl glass-panel-glow p-6 md:p-8 overflow-hidden border border-brand-magenta/30 shadow-nebula-md">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-brand-magenta/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-magenta/15 border border-brand-magenta/35 text-brand-magenta text-xs font-semibold shadow-nebula-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>Signature Innovation: Trust Collapse Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              AI that doesn't just write code—it <span className="gradient-text-magenta">proves whether it is safe to ship</span>.
            </h1>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
              Every fix must face a challenge. When an AI generates a patch, RAZE creates an isolated
              <strong className="text-white"> Repair Shadow Workspace</strong>, introduces adversarial edge cases, executes mutation tests,
              and collapses trust if any check fails—producing empirical, cryptographic evidence before release.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                disabled={launchingDemo}
                onClick={handleLaunchTrustCollapseDemo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-neon to-brand-magenta hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-brand-magenta/25 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{launchingDemo ? 'Initializing Shadow Workspace...' : 'Launch Live Trust Collapse Demonstration'}</span>
              </button>

              <button
                onClick={() => onNavigate('/verify/new')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-white/[0.05] border border-white/10 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-brand-magenta" />
                <span>Custom Verification</span>
              </button>
            </div>
          </div>

          {/* 3D Cyber Defense Visual & Pipeline Showcase */}
          <div className="flex flex-col gap-3 min-w-[280px] max-w-[340px] w-full">
            <div className="relative group rounded-xl overflow-hidden border border-brand-magenta/35 shadow-xl shadow-brand-magenta/20 bg-black/80">
              <img 
                src="/raze-os-brand.jpg" 
                alt="RAZE OS 3D Cyber Defense Shield" 
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030206] via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-white/90 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-status-pass shadow-[0_0_8px_#10B981] animate-pulse"></span>
                  Trust Collapse Engine
                </span>
                <span className="px-1.5 py-0.5 rounded bg-brand-magenta/20 text-brand-magenta text-[10px] border border-brand-magenta/40">
                  RAZE OS
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-2 text-xs font-mono shadow-glass">
              <div className="text-[11px] uppercase font-bold text-white/50 flex items-center justify-between">
                <span>Verification Pipeline</span>
                <span className="text-status-pass font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-pass agent-running-pulse"></span>
                  Active
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-neon"></span>
                  <span>Stage 1: Reproduce Defect Baseline</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-violet"></span>
                  <span>Stage 2: Bounded Minimal Patching</span>
                </div>
                <div className="flex items-center gap-2 text-status-warning">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                  <span>Stage 3: Adversarial Counterexamples</span>
                </div>
                <div className="flex items-center gap-2 text-status-blocked font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-blocked"></span>
                  <span>Stage 4: Trust Collapse & Auto-Block</span>
                </div>
                <div className="flex items-center gap-2 text-brand-magenta">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta"></span>
                  <span>Stage 5: AST Mutation Test Trust</span>
                </div>
                <div className="flex items-center gap-2 text-status-pass">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-pass"></span>
                  <span>Stage 6: Deterministic Policy Gate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Platform Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Runs */}
        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-glass">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Total Verification Runs</span>
            <Activity className="w-4 h-4 text-brand-magenta" />
          </div>
          <div className="text-3xl font-extrabold text-white my-1">{totalRuns}</div>
          <div className="text-[11px] text-text-secondary">Across {reposCount} repository targets</div>
        </div>

        {/* Verified & Sealed */}
        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-glass">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Verified for Review</span>
            <CheckCircle2 className="w-4 h-4 text-status-pass" />
          </div>
          <div className="text-3xl font-extrabold text-status-pass my-1">{verifiedCount}</div>
          <div className="text-[11px] text-text-secondary">Passed all adversarial & policy checks</div>
        </div>

        {/* Trust Collapsed Count */}
        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-glass">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Trust Collapsed</span>
            <Zap className="w-4 h-4 text-status-blocked" />
          </div>
          <div className="text-3xl font-extrabold text-status-blocked my-1">{trustCollapsedCount}</div>
          <div className="text-[11px] text-text-secondary">AI fixes falsified by checks</div>
        </div>

        {/* Verification Memory Bank */}
        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between shadow-glass">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Verification Memory</span>
            <Brain className="w-4 h-4 text-brand-neon" />
          </div>
          <div className="text-3xl font-extrabold text-brand-neon my-1">{memoryCount}</div>
          <div className="text-[11px] text-text-secondary">Persisted regression test patterns</div>
        </div>
      </div>

      {/* Recent Verification Runs Table */}
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl shadow-glass">
        <div className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-magenta" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Verification Trajectories
            </span>
          </div>
          <button
            onClick={loadData}
            className="p-1 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Refresh runs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50 text-brand-magenta" />
            <p className="text-xs">No verification runs launched yet.</p>
            <button
              onClick={handleLaunchTrustCollapseDemo}
              className="mt-3 text-xs text-brand-magenta hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Click here to launch the Trust Collapse Demonstration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5 text-xs">
            {runs.slice(0, 5).map((run) => (
              <div
                key={run.id}
                onClick={() => onNavigate(`/runs/${run.id}`)}
                className="p-3.5 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden mr-3">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0 text-text-muted">
                    <GitBranch className="w-4 h-4 text-brand-magenta" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{run.repositoryName}</span>
                      <span className="text-[10px] font-mono text-white/50 px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/5">
                        {run.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary truncate mt-0.5">
                      Attempt #{run.currentAttempt} •{' '}
                      {run.trustCollapsed ? (
                        <span className="text-status-blocked font-medium">Trust Collapsed & Repaired</span>
                      ) : (
                        <span className="text-text-muted">Standard flow</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      run.recommendation === 'READY_FOR_HUMAN_REVIEW'
                        ? 'bg-status-pass/15 text-status-pass border border-status-pass/30'
                        : run.status === 'TRUST_COLLAPSED' || run.recommendation === 'BLOCKED'
                        ? 'bg-status-blocked/15 text-status-blocked border border-status-blocked/30'
                        : 'bg-brand-magenta/15 text-brand-magenta border border-brand-magenta/30'
                    }`}
                  >
                    {run.recommendation || run.status}
                  </span>

                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
