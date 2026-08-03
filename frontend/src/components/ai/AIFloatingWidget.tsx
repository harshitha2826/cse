// src/components/ai/AIFloatingWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { Tooltip } from '../ui/Tooltip';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Code2,
  Copy,
  Check,
  Lightbulb,
  HelpCircle,
  Minimize2,
  Zap,
  MessageSquare,
} from 'lucide-react';

interface DoubtMessage {
  id: string;
  sender: 'user' | 'ai';
  question?: string;
  answer?: string;
  codeSnippet?: string;
  category?: string;
  followUpSuggestions?: string[];
  timestamp: string;
}

/**
 * Helper to render formatted Markdown text cleanly without displaying raw `###` or `**` tags
 */
const FormattedMarkdownText: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs text-card-foreground leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Headings ### or ####
        if (trimmed.startsWith('###') || trimmed.startsWith('####')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={lineIdx}
              className="text-xs font-black text-foreground mt-2.5 mb-1 pb-1 border-b border-border/50 flex items-center gap-1.5 tracking-wide"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {parseInlineMarkdown(headingText)}
            </h4>
          );
        }

        // Bullet lists starting with `- ` or `* `
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.substring(2);
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <div className="flex-1 text-xs">{parseInlineMarkdown(listText)}</div>
            </div>
          );
        }

        // Numbered lists starting with `1. `, `2. `, etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 border border-primary/20">
                {numMatch[1]}
              </span>
              <div className="flex-1 text-xs">{parseInlineMarkdown(numMatch[2])}</div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={lineIdx} className="text-xs">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Parse inline bold `**text**` and code `` `code` ``
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-surface border border-border/70 text-purple-600 dark:text-purple-400 font-mono text-[11px] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const AIFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<DoubtMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      answer: `👋 **Hello! I am your 24/7 AI Skill Tutor.**\n\nAsk me any concept doubt, coding question, language practice query, or UI design principle!`,
      followUpSuggestions: [
        'What is a database?',
        'React useEffect hook example',
        'Async/Await vs Promises',
        'How do credits work?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    { title: 'Database', text: 'What is a database and how does it work?' },
    { title: 'React Hooks', text: 'Explain React useEffect hook with example code' },
    { title: 'Async/Await', text: 'What is the difference between async/await and Promises?' },
    { title: 'UI Design', text: 'How does the 60-30-10 color rule work in UI design?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleAskDoubt = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: DoubtMessage = {
      id: Date.now().toString(),
      sender: 'user',
      question: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/ai/doubt', {
        question: questionText,
        category: 'Technology',
      });

      const aiMsg: DoubtMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        answer: res.data.answer,
        codeSnippet: res.data.codeSnippet,
        category: res.data.category,
        followUpSuggestions: res.data.followUpSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: DoubtMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        answer: '⚠️ Sorry, I encountered an issue resolving your doubt. Please try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ── Floating Action Button (FAB) ────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Tooltip content={isOpen ? "Close AI Assistant" : "Ask 24/7 AI Skill Tutor"} position="left">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative group p-4 rounded-full bg-gradient-to-r from-purple-600 via-primary to-emerald-500 text-white shadow-2xl hover:shadow-purple-500/40 flex items-center justify-center transition-all duration-300 border border-white/20 cursor-pointer"
            aria-label="Open AI Assistant"
          >
            {/* Animated pulse ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse-slow -z-10" />

            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="bot"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Bot className="w-6 h-6" />
                  <span className="hidden sm:inline text-xs font-black tracking-wide pr-1">AI Tutor</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unread badge */}
            {!isOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-black ring-2 ring-background">
                ✨
              </span>
            )}
          </motion.button>
        </Tooltip>
      </div>

      {/* ── Floating Chat Drawer Window ───────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[82vh] flex flex-col bg-card/95 backdrop-blur-2xl text-card-foreground border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600/15 via-primary/10 to-emerald-500/10 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-primary text-white flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-card rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    SkillBridge AI Tutor
                    <span className="text-[9px] bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase tracking-wider">
                      24/7
                    </span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Instant doubt rectification & coding help</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip content="Minimize AI Chat Window" position="left">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2.5 bg-surface/50 border-b border-border flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0 text-xs">
              <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-wide px-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Prompts:
              </span>
              {quickPrompts.map((qp, idx) => (
                <Tooltip key={idx} content={`Ask: "${qp.text}"`} position="bottom">
                  <button
                    onClick={() => handleAskDoubt(qp.text)}
                    className="px-2.5 py-1 bg-card hover:bg-primary hover:text-white text-foreground text-[11px] font-semibold rounded-xl border border-border transition-all shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{qp.title}</span>
                  </button>
                </Tooltip>
              ))}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-background/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground px-1">
                    {msg.sender === 'user' ? (
                      <span>You • {msg.timestamp}</span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                        <Bot className="w-3 h-3" /> AI Mentor • {msg.timestamp}
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[90%] text-xs space-y-2.5 shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-primary to-emerald-500 text-white rounded-tr-xs font-semibold'
                        : 'bg-card border border-border text-card-foreground rounded-tl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p>{msg.question}</p>
                    ) : (
                      <div className="space-y-2.5 leading-relaxed">
                        {/* Clean Markdown Formatted Answer */}
                        <FormattedMarkdownText content={msg.answer || ''} />

                        {/* Code Snippet Block */}
                        {msg.codeSnippet && (
                          <div className="relative mt-2 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-[11px]">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400">
                              <span className="flex items-center gap-1 font-bold">
                                <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Code Example
                              </span>
                              <Tooltip content={copiedId === msg.id ? "Copied!" : "Copy code snippet"} position="left">
                                <button
                                  onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                                  className="hover:text-white flex items-center gap-1 focus:outline-none cursor-pointer"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              </Tooltip>
                            </div>
                            <pre className="p-3 overflow-x-auto leading-relaxed">
                              <code>{msg.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Suggested Follow-ups */}
                        {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                          <div className="pt-2.5 border-t border-border/50 space-y-1.5">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">
                              💡 Follow-ups:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.followUpSuggestions.map((sug, i) => (
                                <Tooltip key={i} content={`Ask: "${sug}"`} position="top">
                                  <button
                                    onClick={() => handleAskDoubt(sug)}
                                    className="px-2 py-1 bg-surface hover:bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 transition-colors text-left cursor-pointer"
                                  >
                                    {sug}
                                  </button>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 max-w-xs animate-pulse">
                  <Bot className="w-4 h-4 animate-spin" />
                  <span>AI Assistant is analyzing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskDoubt(inputQuestion);
              }}
              className="p-3 bg-card border-t border-border flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask any doubt (e.g. 'What is database?')..."
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <Tooltip content="Send question to AI Tutor" position="top">
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || loading}
                  className="px-3.5 py-2 bg-gradient-to-r from-primary to-emerald-500 text-white font-bold text-xs rounded-xl hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
