// src/components/ai/AISkillMatcher.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Brain,
  Send,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  TrendingUp,
  User,
  Coins,
  X,
  RefreshCw,
} from 'lucide-react';

interface Skill {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: 'offered' | 'wanted';
  proficiency: string;
  cost?: number;
  userName?: string;
  user: string;
  tags?: string[];
}

interface Match {
  skill: Skill;
  score: number;
  reason: string;
  compatibilityLabel: string;
}

interface AISkillMatcherProps {
  skills: Skill[];
  onPropose: (skill: Skill) => void;
}

// ─── Scoring algorithm ─────────────────────────────────────────────────────
const computeMatches = (userSkills: Skill[], allSkills: Skill[], currentUserId: string): Match[] => {
  const userOffered = userSkills.filter((s) => s.type === 'offered');
  const userCategories = new Set(userOffered.map((s) => s.category));
  const userTags = new Set(userOffered.flatMap((s) => s.tags || []));

  return allSkills
    .filter((s) => s.user !== currentUserId && s.type === 'offered')
    .map((skill) => {
      let score = 0;
      const reasons: string[] = [];

      if (userCategories.has(skill.category)) {
        score += 40;
        reasons.push(`Matches your ${skill.category} focus`);
      }

      const tagMatches = (skill.tags || []).filter((t) => userTags.has(t)).length;
      if (tagMatches > 0) {
        score += tagMatches * 15;
        reasons.push(`${tagMatches} shared tag${tagMatches > 1 ? 's' : ''}`);
      }

      if (skill.proficiency === 'Expert') {
        score += 25;
        reasons.push('Expert-level mentor');
      } else if (skill.proficiency === 'Intermediate') {
        score += 15;
        reasons.push('Intermediate level');
      }

      score += Math.floor(Math.random() * 10);

      const reason = reasons.slice(0, 2).join(' · ') || 'Trending in the community';
      const compatibilityLabel =
        score >= 60 ? 'Excellent Match' : score >= 40 ? 'Great Match' : 'Good Match';

      return { skill, score, reason, compatibilityLabel };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const COMPATIBILITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Excellent Match': {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    icon: <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />,
  },
  'Great Match': {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500" />,
  },
  'Good Match': {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    icon: <Zap className="w-3.5 h-3.5 text-purple-500" />,
  },
};

export const AISkillMatcher: React.FC<AISkillMatcherProps> = ({ skills, onPropose }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user || skills.length === 0) return;

    setLoading(true);

    api
      .get('/skills')
      .then((res) => {
        const allSkills: Skill[] = Array.isArray(res.data) ? res.data : [];
        const userOwnSkills = allSkills.filter((s) => s.user === user.id);

        const effectiveUserSkills: Skill[] =
          userOwnSkills.length > 0
            ? userOwnSkills
            : [{ _id: 'x', title: 'General', description: 'General skill', category: 'Technology', type: 'offered' as const, proficiency: 'Beginner', user: user.id, tags: ['web'] }];

        const computed = computeMatches(effectiveUserSkills, skills, user.id);
        setMatches(computed);
      })
      .catch(() => {
        const candidates = skills.filter((s) => s.user !== user.id && s.type === 'offered');
        const top3 = candidates.slice(0, 3).map((skill, i) => ({
          skill,
          score: 80 - i * 15,
          reason: 'Trending in your category',
          compatibilityLabel: i === 0 ? 'Excellent Match' : i === 1 ? 'Great Match' : 'Good Match',
        }));
        setMatches(top3);
      })
      .finally(() => setLoading(false));
  }, [user, skills, refreshKey]);

  if (!user) return null;

  const getCost = (skill: Skill) => {
    if (skill.cost) return skill.cost;
    if (skill.proficiency === 'Expert') return 20;
    if (skill.proficiency === 'Intermediate') return 10;
    return 5;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-purple-500/30 shadow-lg overflow-hidden"
    >
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-background to-primary/10 hover:from-purple-500/15 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">AI Skill Match Engine</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                ✨ Powered by AI
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {matches.length > 0 ? `${matches.length} personalised matches found for you` : 'Analysing your skill profile…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setRefreshKey((k) => k + 1); }}
            className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh matches"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* ── Match Cards ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="p-5 space-y-3">
              {loading ? (
                <div className="flex items-center gap-3 py-4 px-4 rounded-xl bg-surface border border-border animate-pulse">
                  <Brain className="w-5 h-5 text-purple-500 animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">AI is analysing your skill profile and finding best matches…</span>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500 opacity-50" />
                  Post a skill to unlock personalised matches!
                </div>
              ) : (
                matches.map((match, i) => {
                  const style = COMPATIBILITY_STYLES[match.compatibilityLabel] || COMPATIBILITY_STYLES['Good Match'];
                  const cost = getCost(match.skill);

                  return (
                    <motion.div
                      key={match.skill._id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-purple-500/40 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-primary/30 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-600 dark:text-purple-400 shrink-0">
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${style.border} border flex items-center gap-1`}>
                            {style.icon} {match.compatibilityLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Coins className="w-3 h-3" /> {cost} Cr
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {match.skill.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> {match.skill.userName || 'Community Member'}
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {match.reason}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onPropose(match.skill)}
                        className="btn-cyber rounded-xl"
                        style={{ '--border-color': 'linear-gradient(-45deg, #a855f7, #d946ef, #8b5cf6)' } as any}
                      >
                        <Send className="w-3.5 h-3.5" /> Propose Swap
                      </button>
                    </motion.div>
                  );
                })
              )}

              {!loading && matches.length > 0 && (
                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  ✨ Matches are personalised based on your skill profile, categories, and community activity.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
