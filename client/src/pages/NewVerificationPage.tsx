import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  FolderGit2,
  FileCode,
  Zap,
  Shield,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { fetchRepositories, createVerificationRun, Repository } from '../api/client.js';

interface NewVerificationPageProps {
  onNavigate: (path: string) => void;
  onOpenAssistant?: () => void;
}

const DEFAULT_REPOS = [
  {
    id: 'repo-pricing-service',
    name: 'pricing-service',
    description: 'High-throughput checkout pricing & discount computation engine (Defect #104 in calculateDiscount)',
    defaultFile: 'src/pricing.ts',
    defaultBugTitle: 'Defect #104: Boundary range failure & NaN underflow in calculateDiscount',
    defaultBugDesc: 'Negative discount values accepted in calculateDiscount, resulting in price inflation and negative customer invoice totals. Input lacks finite bounds checking.',
    defaultBranch: 'main'
  },
  {
    id: 'repo-auth-guardian',
    name: 'auth-guardian',
    description: 'API Gateway token authentication & path security guard (Path traversal vulnerability demo CWE-22)',
    defaultFile: 'src/tokenValidator.ts',
    defaultBugTitle: 'Security Defect #209: Path Traversal Vulnerability in resolveTenantPath',
    defaultBugDesc: 'Tenant path resolution permits relative path sequences (../../etc/passwd) without canonical boundary prefix containment checks, exposing arbitrary system files.',
    defaultBranch: 'main'
  }
];

export const NewVerificationPage: React.FC<NewVerificationPageProps> = ({ onNavigate, onOpenAssistant }) => {
  const [selectedRepoId, setSelectedRepoId] = useState('repo-pricing-service');
  const [targetFile, setTargetFile] = useState('src/pricing.ts');
  const [bugTitle, setBugTitle] = useState('Defect #104: Boundary range failure & NaN underflow in calculateDiscount');
  const [bugDescription, setBugDescription] = useState('Negative discount values accepted in calculateDiscount, resulting in price inflation and negative customer invoice totals. Input lacks finite bounds checking.');
  const [maxRetries, setMaxRetries] = useState(3);
  const [trustCollapseDemo, setTrustCollapseDemo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check URL query parameters if present
    const params = new URLSearchParams(window.location.search);
    const qRepo = params.get('repo');
    const qFile = params.get('file');
    if (qRepo) handleRepoChange(qRepo);
    if (qFile) setTargetFile(decodeURIComponent(qFile));
  }, []);

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);
    const repo = DEFAULT_REPOS.find(r => r.id === repoId) || DEFAULT_REPOS[0];
    setTargetFile(repo.defaultFile);
    setBugTitle(repo.defaultBugTitle);
    setBugDescription(repo.defaultBugDesc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const run = await createVerificationRun({
        repositoryId: selectedRepoId,
        targetFile,
        bugTitle,
        bugDescription,
        maxRetries,
        triggerTrustCollapseDemo: trustCollapseDemo
      });
      onNavigate(`/runs/${run.id}`);
    } catch (err: any) {
      alert(`Failed to launch verification run: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand-magenta" />
            <span>Launch Autonomous Verification Run</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configures the target defect, adversarial challenge suite, and isolated repair shadow workspace.
          </p>
        </div>

        {onOpenAssistant && (
          <button
            type="button"
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-brand-magenta/20 border border-brand-magenta/35 hover:border-brand-magenta/60 text-xs font-semibold text-white shadow-nebula-sm transition-all cursor-pointer group"
            title="Ask RAZE Evidence Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-magenta group-hover:rotate-12 transition-transform" />
            <span>Evidence Assistant</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Select Target Repository */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 space-y-3 shadow-glass">
          <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-magenta" />
            <span>Select Target Repository</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_REPOS.map((repo) => {
              const isSelected = selectedRepoId === repo.id;
              return (
                <div
                  key={repo.id}
                  onClick={() => handleRepoChange(repo.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-magenta/10 border-brand-magenta ring-1 ring-brand-magenta/50 shadow-nebula-sm'
                      : 'bg-black/40 border-white/10 hover:border-brand-magenta/30 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-magenta shadow-[0_0_8px_#FF2DF7]' : 'bg-white/20'}`} />
                      {repo.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-magenta/15 text-brand-magenta border border-brand-magenta/30 font-semibold">
                      {repo.defaultBranch}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{repo.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Defect Specification (Form Inputs) */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 space-y-4 shadow-glass">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-brand-magenta" />
            <span>Target Defect Specification</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] uppercase font-mono font-semibold text-white/70 block mb-1">
                Target Source File
              </label>
              <input
                type="text"
                value={targetFile}
                onChange={(e) => setTargetFile(e.target.value)}
                required
                placeholder="e.g. src/pricing.ts"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-brand-magenta shadow-inner transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-mono font-semibold text-white/70 block mb-1">
                Bug Report Title
              </label>
              <input
                type="text"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                required
                placeholder="e.g. Defect #104: Boundary range failure in calculateDiscount"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-medium focus:outline-none focus:border-brand-magenta shadow-inner transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-mono font-semibold text-white/70 block mb-1">
                Defect Behavior & Error Description
              </label>
              <textarea
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                rows={3}
                required
                placeholder="Describe failure behavior, stack trace, and reproducing inputs..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white leading-relaxed focus:outline-none focus:border-brand-magenta shadow-inner transition-all"
              />
            </div>
          </div>
        </div>

        {/* Verification & Challenge Controls */}
        <div className="p-5 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/10 space-y-4 shadow-glass">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-magenta" />
            <span>Verification & Challenge Controls</span>
          </div>

          <div className="space-y-3">
            {/* Toggle: Trust Collapse Loop */}
            <div
              onClick={() => setTrustCollapseDemo(!trustCollapseDemo)}
              className="p-3.5 rounded-xl bg-black/60 border border-brand-magenta/30 flex items-start justify-between gap-4 cursor-pointer hover:border-brand-magenta/50 transition-colors shadow-nebula-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span>Trust Collapse Loop (Signature Workflow)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-status-blocked/20 text-status-blocked border border-status-blocked/30 font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Attempt 1 synthesizes a minimal fix that passes reproduction tests, but is falsified by the
                  Adversarial Hunter (150% discount). Unsupported trust collapses, triggering Attempt 2 with full
                  boundary hardening.
                </p>
              </div>
              <div className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${trustCollapseDemo ? 'bg-brand-magenta' : 'bg-white/20'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${trustCollapseDemo ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Numeric Input: Bounded Repair Retries (Default to 3) */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-white">Bounded Repair Retries</div>
                <div className="text-[11px] text-text-muted">Maximum autonomous iteration cycles before requesting human intervention (default 3)</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/80 border border-brand-magenta/50 text-center font-mono font-bold text-brand-magenta text-sm focus:outline-none focus:ring-1 focus:ring-brand-magenta shadow-inner"
                />
                <span className="text-xs text-text-muted font-mono">cycles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-neon via-brand-violet to-brand-magenta hover:opacity-95 text-white text-xs font-extrabold shadow-xl shadow-brand-magenta/30 border border-brand-magenta/40 transition-all cursor-pointer group"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>{submitting ? 'Initializing Isolated Shadow Workspace...' : 'Start Autonomous Verification Run'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
