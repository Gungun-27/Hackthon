import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  Trash2, 
  ShieldAlert,
  HelpCircle,
  Car,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  model?: string;
  complaintDraft?: {
    issue_type: string;
    description: string;
    address_text: string;
    vehicle_number?: string;
  };
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [activeModel, setActiveModel] = useState<string>('Groq LPU (Ultra-Low Latency)');

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Namaste! I am the TrafficMitra Assistant powered by **Groq LPU Inference** for Nagpur Municipal Corporation & Traffic Police.\n\n• Track any ticket (e.g. `TM-2026-004521`)\n• File illegal parking or traffic bottlenecks with auto-drafting\n• Inquire about DigiLocker identity verification and emergency helplines',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'Groq LPU'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cooldown countdown timer effect
  useEffect(() => {
    if (rateLimitCooldown === null || rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || rateLimitCooldown !== null) return;

    const userText = input.trim();
    setInput('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { role: 'user', text: userText, timestamp: time }]);
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.text
      }));

      const res = await api.post('/chatbot/message', {
        message: userText,
        history: historyPayload
      });

      if (res.data.remainingRequests !== undefined) {
        setRemainingRequests(res.data.remainingRequests);
      }
      if (res.data.model) {
        setActiveModel(res.data.model);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: res.data.model || 'Groq LPU',
          complaintDraft: res.data.complaintDraft
        }
      ]);
    } catch (err: any) {
      console.error('Chatbot error', err);

      if (err.response?.status === 429) {
        const cooldown = err.response.data?.retryAfter || 60;
        setRateLimitCooldown(cooldown);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `⚠️ **Rate limit exceeded.** To protect server capacity, please wait ${cooldown} seconds before sending another message.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'I encountered a brief connection issue with the central dispatch server. Please try again or dial 1095 / 112 for immediate traffic assistance.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDraft = (draft: any) => {
    setIsOpen(false);
    const params = new URLSearchParams();
    if (draft.issue_type) params.set('type', draft.issue_type);
    if (draft.description) params.set('desc', draft.description);
    if (draft.address_text) params.set('loc', draft.address_text);
    if (draft.vehicle_number) params.set('plate', draft.vehicle_number);
    navigate(`/file-complaint?${params.toString()}`);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Chat history cleared. How may I assist you with Nagpur traffic or municipal issues?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'Groq LPU'
      }
    ]);
  };

  // Helper to render bold markdown (**text**) cleanly
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // Split on bold markers
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <div key={lIdx} className={line.startsWith('• ') ? 'pl-2 py-0.5' : 'py-0.5'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono text-[10px]">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold p-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all border-2 border-slate-900 group"
          title="Open TrafficMitra AI Assistant (Powered by Groq LPU)"
        >
          <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
          <span className="text-xs font-extrabold tracking-wide pr-1 hidden sm:inline text-slate-950">AI Assistant</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute -top-1 -right-1"></span>
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[92vw] sm:w-[400px] h-[550px] flex flex-col overflow-hidden text-slate-100 animate-fadeIn">
          
          {/* Header */}
          <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Zap className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 font-mono">
                  TrafficMitra Assistant
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2 rounded font-mono border border-amber-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-amber-400" /> Groq LPU
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Nagpur Civic AI • Sub-Second Latency Triage</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => setInput('What is the status of TM-2026-004521?')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-md whitespace-nowrap border border-slate-700 font-mono transition"
            >
              Track TM-2026-004521
            </button>
            <button
              onClick={() => setInput('Report illegal parking blocking ambulance gate at Medical College')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md whitespace-nowrap border border-slate-700 transition"
            >
              Report Parking
            </button>
            <button
              onClick={() => setInput('Explain DigiLocker verification')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md whitespace-nowrap border border-slate-700 transition"
            >
              DigiLocker Badge
            </button>
          </div>

          {/* Rate Limit Cooldown Warning Banner if Triggered */}
          {rateLimitCooldown !== null && (
            <div className="bg-amber-950/80 border-b border-amber-800 text-amber-300 px-3 py-1.5 text-[11px] flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Rate limit active
              </span>
              <span>Cooldown: <strong>{rateLimitCooldown}s</strong></span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-900/95 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  </div>
                )}
                <div
                  className={`max-w-[84%] rounded-xl p-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  <div className="leading-relaxed">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Auto Pre-filled Draft Card */}
                  {msg.complaintDraft && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-700 bg-slate-950/70 p-2.5 rounded-lg border border-amber-500/30">
                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Auto-Generated Complaint Draft
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                        <div>Type: <span className="font-semibold capitalize text-white">{msg.complaintDraft.issue_type.replace(/_/g, ' ')}</span></div>
                        <div>Location: <span className="text-slate-300">{msg.complaintDraft.address_text}</span></div>
                        {msg.complaintDraft.vehicle_number && (
                          <div className="font-mono text-amber-300">Plate: <strong>{msg.complaintDraft.vehicle_number}</strong></div>
                        )}
                      </div>
                      <button
                        onClick={() => handleApplyDraft(msg.complaintDraft)}
                        className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition shadow"
                      >
                        Review & File Complaint <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className={`text-[9px] mt-1.5 flex items-center justify-between ${msg.role === 'user' ? 'text-slate-800' : 'text-slate-500 font-mono'}`}>
                    <span>{msg.model ? `⚡ ${msg.model}` : ''}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="font-mono text-[11px]">Groq LPU synthesizing response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
            <input
              type="text"
              disabled={rateLimitCooldown !== null}
              placeholder={rateLimitCooldown !== null ? `Rate limited (${rateLimitCooldown}s)...` : "Ask a question, report issue, or track ticket..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || rateLimitCooldown !== null}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold p-2 rounded-lg transition shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
