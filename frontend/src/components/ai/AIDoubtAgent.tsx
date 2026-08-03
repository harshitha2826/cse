// src/components/ai/AIDoubtAgent.tsx
import React, { useState } from 'react';
import api from '../../utils/api';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Code2,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  Zap,
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

interface AIDoubtAgentProps {
  onExploreMarketplace?: (query?: string) => void;
}

/**
 * Parse inline bold **text** and code `code`
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

/**
 * Helper to render formatted Markdown text cleanly without displaying raw ### or ** tags
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

export const AIDoubtAgent: React.FC<AIDoubtAgentProps> = ({ onExploreMarketplace }) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [category, setCategory] = useState('Technology');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial chat history with welcome message
  const [messages, setMessages] = useState<DoubtMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      answer: `### 👋 Hello! I am your SkillBridge AI Tutor & Doubt Rectifier.\n\nAsk me any concept doubt, coding question, language query, or UI design principle. I will explain it clearly with step-by-step guidance and code examples!`,
      followUpSuggestions: [
        'Explain React useEffect with example',
        'What is async/await vs Promises?',
        'How does the 60-30-10 UI design rule work?',
        'How do default credits & skill learning work?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    { title: 'React useEffect', text: 'Explain React useEffect hook with example code', cat: 'Technology' },
    { title: 'Async/Await', text: 'What is the difference between async/await and Promises?', cat: 'Technology' },
    { title: 'UI Design 60-30-10', text: 'How does the 60-30-10 color rule work in UI design?', cat: 'Design' },
    { title: 'Spanish Fluency', text: 'What is the best way to practice Spanish conversation?', cat: 'Languages' },
    { title: 'Credit System', text: 'How do default credits & skill learning work on SkillBridge?', cat: 'General' },
  ];

  const handleAskDoubt = async (questionText: string, selectedCat?: string) => {
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
        category: selectedCat || category,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-purple-500/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4 text-purple-500" /> AI Doubt Rectification Agent
          </div>
          <h2 className="text-2xl font-black text-foreground">24/7 AI Skill Tutor & Mentor</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Stuck on a coding error, design question, or learning roadblock? Ask our AI assistant for instant, crystal-clear explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            AI Online & Ready
          </span>
        </div>
      </div>

      {/* Quick Doubt Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wide">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Doubt Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleAskDoubt(qp.text, qp.cat)}
              className="px-3 py-1.5 bg-surface hover:bg-primary hover:text-white text-foreground text-xs font-medium rounded-xl border border-border transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{qp.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="glass p-4 rounded-2xl border border-border min-h-[400px] max-h-[550px] overflow-y-auto space-y-4 shadow-inner bg-background/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
              {msg.sender === 'user' ? (
                <span>You • {msg.timestamp}</span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                  <Bot className="w-3.5 h-3.5" /> AI Mentor • {msg.timestamp}
                </span>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs space-y-3 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-xs font-medium'
                  : 'bg-surface dark:bg-zinc-900 border border-border text-foreground rounded-tl-xs'
              }`}
            >
              {msg.sender === 'user' ? (
                <p className="text-sm font-semibold">{msg.question}</p>
              ) : (
                <div className="space-y-3 leading-relaxed">
                  {/* Formatted Answer */}
                  <FormattedMarkdownText content={msg.answer || ''} />

                  {/* Code Snippet Block if available */}
                  {msg.codeSnippet && (
                    <div className="relative mt-3 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 text-zinc-100 font-mono text-xs">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Code Example
                        </span>
                        <button
                          onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                          className="hover:text-white flex items-center gap-1 focus:outline-none"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed">
                        <code>{msg.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Follow Up Suggestions */}
                  {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                        💡 Suggested Follow-ups:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.followUpSuggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleAskDoubt(sug)}
                            className="px-2.5 py-1 bg-background/80 hover:bg-primary/10 text-primary text-[11px] font-semibold rounded-lg border border-primary/20 transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Find Mentor Button */}
                  {msg.id !== 'welcome' && onExploreMarketplace && (
                    <div className="pt-2">
                      <button
                        onClick={() => onExploreMarketplace(msg.category)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-light transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Find 1-on-1 Mentor in Marketplace
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 max-w-xs animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>AI Assistant is analyzing your doubt...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskDoubt(inputQuestion);
        }}
        className="glass p-2.5 rounded-2xl border border-border shadow-md flex items-center gap-2 bg-surface"
      >
        <div className="flex items-center gap-2 pl-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0" />
        </div>

        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask any doubt (e.g., 'How to handle async errors in React?')..."
          className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground font-medium py-2"
        />

        <button
          type="submit"
          disabled={!inputQuestion.trim() || loading}
          className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? 'Asking...' : 'Ask AI'}</span>
        </button>
      </form>
    </div>
  );
};
