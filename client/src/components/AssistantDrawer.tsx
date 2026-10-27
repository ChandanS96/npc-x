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

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ isOpen, onClose, runId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: runId
        ? `Hello! I am your RAZE Evidence Assistant powered by OpenAI. I am actively inspecting the execution traces, counterexamples, and patch hashes for Run \`${runId}\`. What would you like to verify?`
        : `Hello! I am your RAZE Evidence Assistant. You can ask me general questions about RAZE's verification architecture, or select any verification run from the workspace to query deep empirical evidence.`,
      operatingMode: 'OPENAI_PROVIDER',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<string>('OPENAI_PROVIDER');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = runId
    ? [
        'Why did trust collapse?',
        'Which test caught the counterexample?',
        'Explain Stage 2 Copilot Minimal Repair',
        'Explain Stage 3 Copilot Adversarial Hunt',
        'What changed between repair attempts?'
      ]
    : [
        'Stage 2: Copilot Minimal Repair',
        'Stage 3: Copilot Adversarial Hunt',
        'How does Trust Collapse Engine work?',
        'Status of auth-guardian check',
        'Explain Defect #104 in pricing-service',
        'Explain Repair Shadow Workspaces',
        'What are the 6 autonomous agents?'
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
              text: `Hello! I am your RAZE Evidence Assistant. I am actively inspecting the execution traces, counterexamples, and patch hashes for Run \`${runId}\`. What would you like to verify?`,
              operatingMode: activeMode,
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

    // Format previous turns for multi-turn conversational context
    const history = messages
      .filter((m) => m.id !== 'init-1')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

    try {
      const response = await askAssistant(runId, textToSend, history);
      if (response.operatingMode) {
        setActiveMode(response.operatingMode);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citedEvidence: response.citedEvidence,
        operatingMode: response.operatingMode,
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `**Query Failed:** ${err.message}\n\nPlease check your server console or ensure the OpenAI API key is configured.`,
          operatingMode: 'LOCAL_DETERMINISTIC_ENGINE',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
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
        operatingMode: activeMode,
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
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  activeMode === 'OPENAI_PROVIDER'
                    ? 'bg-status-pass/15 text-status-pass border-status-pass/30'
                    : 'bg-brand-neon/15 text-brand-neon border-brand-neon/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {activeMode === 'OPENAI_PROVIDER' ? 'OpenAI GPT-4o' : 'Deterministic Engine'}
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
