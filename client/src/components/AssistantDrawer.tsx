import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Cpu,
  CornerDownRight,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Bot
} from 'lucide-react';
import { askAssistant } from '../api/client.js';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citedEvidence?: Array<{ type: string; reference: string; detail: string }>;
  operatingMode?: string;
  model?: string;
  timestamp: string;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  runId?: string;
}

export function getSimulatedAssistantResponse(userInput: string): {
  answer: string;
  citedEvidence?: Array<{ type: string; reference: string; detail: string }>;
  operatingMode: string;
} {
  const q = userInput.toLowerCase();

  if (q.includes('stage 2') || q.includes('minimal repair')) {
    return {
      answer: `**Stage 2: Copilot Minimal Repair**\n\nIn Stage 2, the repair agent uses the Copilot API with bounded context injection to synthesize a surgical patch. It targets the exact failing AST symbols from Stage 1 while strictly preventing code bloat and unwanted refactoring. Once generated, the minimal patch is confirmed against the baseline reproduction test before proceeding to adversarial hunting.`,
      citedEvidence: [
        { type: 'STAGE_ARCHITECTURE', reference: 'Stage 2: Copilot Minimal Repair', detail: 'Bounded surgical patch generation targeting reproduction tests' },
        { type: 'AST_CONSTRAINT', reference: 'AST Bounded Diff', detail: 'Strict patch size heuristics to prevent architectural drift' }
      ],
      operatingMode: 'Deterministic Engine'
    };
  }

  if (q.includes('stage 3') || q.includes('adversarial hunt') || q.includes('counterexample')) {
    return {
      answer: `**Stage 3: Copilot Adversarial Hunt**\n\nIn Stage 3, the Adversarial Hunter agent aggressively stresses the candidate patch with counterexample edge cases (numerical boundary violations like 150%, negative values, and type coercions). If an adversarial vector breaks the code, trust collapses immediately and failure telemetry is routed back for a hardened fix.`,
      citedEvidence: [
        { type: 'STAGE_ARCHITECTURE', reference: 'Stage 3: Copilot Adversarial Hunt', detail: 'Hostile counterexample generation designed to break naive patches' },
        { type: 'FALSIFICATION_VECTOR', reference: 'cx-falsify-01', detail: 'Negative discounts, >100% percentages, and boundary edge cases' }
      ],
      operatingMode: 'Deterministic Engine'
    };
  }

  if (q.includes('trust collapse') || q.includes('how does')) {
    return {
      answer: `**How the Trust Collapse Engine Works**\n\nThe Trust Collapse Engine enforces mathematical rigor: AI that doesn't just write code—it proves whether it is safe to ship. If any adversarial vector or security mutant breaks a candidate patch, approval is instantly revoked. The failure evidence is captured into Verification Memory and fed into the Repair Shadow Mode to synthesize a mathematically sound patch.`,
      citedEvidence: [
        { type: 'ENGINE_SPEC', reference: 'Trust Collapse Engine', detail: 'Falsification state machine that revokes approval on counterexamples' }
      ],
      operatingMode: 'Deterministic Engine'
    };
  }

  if (q.includes('pricing') || q.includes('104') || q.includes('discount')) {
    return {
      answer: `**Defect #104 in pricing-service**\n\nDefect #104 represents a boundary failure in \`calculateDiscount\` in \`src/pricing.ts\`. Attempt 1 fixed negative discounts but failed on discounts > 100% (counterexample: discountPercent = 150 returned -$50). Trust collapsed, prompting Attempt 2 which introduced strict finite bounds validation and achieved an 88.8% mutation score under SHA-256 seal.`,
      citedEvidence: [
        { type: 'AST_DIFF', reference: 'Attempt #2 Hardened Diff', detail: 'Strict RangeError throw on bounds violation [0, 100]' },
        { type: 'COUNTEREXAMPLE', reference: 'cx-falsify-01', detail: 'Input: { discountPercent: 150 } produced -50.00' }
      ],
      operatingMode: 'Deterministic Engine'
    };
  }

  if (q.includes('auth') || q.includes('guardian') || q.includes('token') || q.includes('traversal')) {
    return {
      answer: `**Auth-Guardian Security Check**\n\nTargeting \`src/token.ts\`, this check verifies path sanitization against CWE-22 (Path Traversal). The Adversarial Hunter detects relative directory traversal sequences (\`../../etc/passwd\`) attempting unauthorized access, blocking release until canonical path normalization is enforced.`,
      citedEvidence: [
        { type: 'SECURITY_FINDING', reference: 'CWE-22: Path Traversal', detail: 'Token verification allowed unauthorized dot-dot-slash sequence' }
      ],
      operatingMode: 'Deterministic Engine'
    };
  }

  return {
    answer: `**RAZE Evidence Assistant (Deterministic Engine)**\n\nI am actively analyzing the verification ecosystem. You can ask me:\n• *"Explain Stage 2: Copilot Minimal Repair"*\n• *"Explain Stage 3: Copilot Adversarial Hunt"*\n• *"How does the Trust Collapse Engine work?"*\n• *"Explain Defect #104 in pricing-service"*\n• *"Check auth-guardian status"*\n\nSelect a suggestion chip above or type your question below!`,
    citedEvidence: [
      { type: 'PLATFORM_STATUS', reference: 'RAZE OS', detail: 'Deterministic Engine Online' }
    ],
    operatingMode: 'Deterministic Engine'
  };
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ isOpen, onClose, runId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: runId
        ? `Hello! I am your RAZE Evidence Assistant (Deterministic Engine). I am actively inspecting the execution traces, counterexamples, and patch hashes for Run \`${runId}\`. What would you like to verify?`
        : `Hello! I am your RAZE Evidence Assistant. You can ask me questions about Stage 2: Copilot Minimal Repair, Stage 3: Copilot Adversarial Hunt, or how the Trust Collapse Engine works.`,
      operatingMode: 'Deterministic Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    'Stage 2: Copilot Minimal Repair',
    'Stage 3: Copilot Adversarial Hunt',
    'How does Trust Collapse Engine work?',
    'Explain Defect #104 in pricing-service',
    'Check auth-guardian status',
    'Explain Repair Shadow Workspaces'
  ];

  // Sync greeting if runId becomes available
  useEffect(() => {
    if (runId) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id.startsWith('init-')) {
          return [
            {
              id: `init-${Date.now()}`,
              sender: 'assistant',
              text: `Hello! I am your RAZE Evidence Assistant (Deterministic Engine). I am actively inspecting the execution traces, counterexamples, and patch hashes for Run \`${runId}\`. What would you like to verify?`,
              operatingMode: 'Deterministic Engine',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
        }
        return prev;
      });
    }
  }, [runId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const renderInline = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono bg-white/10 text-brand-neon px-1 py-0.5 rounded text-[10.5px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderFormattedText = (raw: string) => {
    return raw.split('\n').map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <div key={idx} className="leading-relaxed">
          {renderInline(line)}
        </div>
      );
    });
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Deterministic simulated keyword response
      const response = getSimulatedAssistantResponse(textToSend);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citedEvidence: response.citedEvidence,
        operatingMode: 'Deterministic Engine',
        model: 'Deterministic Ruleset',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: runId
          ? `Conversation cleared. Ready to answer questions grounded in Run \`${runId}\`.`
          : 'Conversation cleared. Ready to answer questions regarding the RAZE platform.',
        operatingMode: 'Deterministic Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#020204]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-magenta/20 text-brand-magenta flex items-center justify-center shadow-nebula-sm border border-brand-magenta/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>RAZE Evidence Assistant</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-brand-neon/40 bg-brand-neon/15 text-brand-neon flex items-center gap-1 shadow-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-ping" />
                <span>Deterministic Engine</span>
              </span>
            </div>
            <div className="text-[10px] text-text-muted truncate max-w-[260px] mt-0.5">
              {runId ? (
                <span className="text-brand-magenta font-mono font-medium">Grounded in Run: {runId}</span>
              ) : (
                'Platform Knowledge Mode (Select a run for trace inspection)'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 border-b border-white/10 bg-black/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-black/60 hover:bg-white/10 border border-white/10 hover:border-brand-magenta/40 text-text-secondary hover:text-white transition-all shadow-sm"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-brand-magenta to-[#9B5CFF] text-white rounded-tr-none shadow-nebula-sm font-medium'
                  : 'bg-black/60 backdrop-blur-md text-text-primary rounded-tl-none border border-white/10 shadow-glass'
              }`}
            >
              <div className="leading-relaxed space-y-1">
                {renderFormattedText(msg.text)}
              </div>

              {/* Cited Evidence Tags */}
              {msg.citedEvidence && msg.citedEvidence.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-brand-neon font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    <span>Empirical Verification Evidence:</span>
                  </div>
                  {msg.citedEvidence.map((ev, evIdx) => (
                    <div
                      key={evIdx}
                      className="p-1.5 rounded-lg bg-black/80 text-[10px] font-mono text-text-secondary border border-white/10 flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-status-pass flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">[{ev.type}] {ev.reference}:</strong> {ev.detail}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footnote */}
              <div className="flex items-center justify-between text-[9px] font-mono text-text-muted/70 pt-0.5">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <span>
                    {msg.model ? `Model: ${msg.model}` : `Engine: ${msg.operatingMode || 'OPENAI_PROVIDER'}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs text-text-muted shadow-glass animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-brand-magenta flex-shrink-0" />
            <div className="space-y-0.5">
              <span className="text-white font-medium">Consulting OpenAI & execution trace...</span>
              <p className="text-[10px] text-text-muted">Grounding answer in test outcomes, counterexamples, and patch hashes.</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              runId
                ? 'Ask about this run (e.g. why did trust collapse?)...'
                : 'Ask a question about the RAZE verification engine...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-brand-magenta transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-brand-magenta hover:bg-brand-magenta/90 disabled:opacity-40 text-white transition-all shadow-nebula-sm cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
