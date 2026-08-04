// src/components/roadmap/SkillProgressTracker.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Award,
  TrendingUp,
  Zap,
  ChevronRight,
  Target,
  CheckCircle2,
  Clock,
  Users,
  Repeat2,
  Star,
  Flame,
  BarChart2,
  Lock,
} from 'lucide-react';

interface SkillProgressTrackerProps {
  onNavigateMarketplace: (searchQuery?: string) => void;
}

interface LearningSkill {
  id: string;
  title: string;
  category: string;
  proficiency: string;
  progress: number;
  status: 'In Progress' | 'Practicing' | 'Mastered';
  teacherName?: string;
  dateStarted: string;
}

interface TeachingSkill {
  id: string;
  title: string;
  category: string;
  studentsEnrolled: number;
  creditsEarned: number;
}

interface ActivityStats {
  skillsPosted: number;
  swapsPending: number;
  swapsAccepted: number;
  swapsCompleted: number;
  totalCreditsEarned: number;
  overallProgress: number; // 0-100, computed
}

// Derive automatic progress from proficiency + swap acceptance
function deriveProgress(proficiency: string, accepted: number, completed: number): number {
  const base = proficiency === 'Beginner' ? 20 : proficiency === 'Intermediate' ? 50 : 75;
  const bonus = Math.min((accepted * 10) + (completed * 15), 25);
  return Math.min(base + bonus, 100);
}

function deriveStatus(progress: number): 'In Progress' | 'Practicing' | 'Mastered' {
  if (progress >= 90) return 'Mastered';
  if (progress >= 55) return 'Practicing';
  return 'In Progress';
}

const RECOMMENDATIONS = [
  {
    title: 'Backend API Development with Express & MongoDB',
    category: 'Technology',
    reason: 'Complete full-stack mastery based on your React & Web Dev focus.',
    query: 'Node.js',
    tag: 'High Priority',
  },
  {
    title: 'Design Systems & Component Libraries',
    category: 'Design',
    reason: 'Complements your Figma UI/UX learning for professional product design.',
    query: 'Design',
    tag: 'Next Level',
  },
  {
    title: 'Conversational Spanish & Business Vocabulary',
    category: 'Languages',
    reason: 'Expand your global career opportunities with dual language fluency.',
    query: 'Spanish',
    tag: 'Popular',
  },
];

export const SkillProgressTracker: React.FC<SkillProgressTrackerProps> = ({ onNavigateMarketplace }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learningSkills, setLearningSkills] = useState<LearningSkill[]>([]);
  const [teachingSkills, setTeachingSkills] = useState<TeachingSkill[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    skillsPosted: 0,
    swapsPending: 0,
    swapsAccepted: 0,
    swapsCompleted: 0,
    totalCreditsEarned: 0,
    overallProgress: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [skillsRes, swapsRes] = await Promise.all([
          api.get('/skills'),
          api.get('/swaps').catch(() => ({ data: [] })),
        ]);

        const allSkills: any[] = skillsRes.data;
        const allSwaps: any[] = swapsRes.data;

        // ── Separate user's skills ──────────────────────────
        const myPostedSkills = allSkills.filter(
          (s) => s.user === user?.id || s.userName === user?.name
        );
        const othersSkills = allSkills.filter(
          (s) => s.user !== user?.id && s.userName !== user?.name
        );

        // ── Swap stats ──────────────────────────────────────
        const swapsPending = allSwaps.filter((s) => s.status === 'pending').length;
        const swapsAccepted = allSwaps.filter((s) => s.status === 'accepted').length;
        const swapsCompleted = allSwaps.filter((s) => s.status === 'completed').length;

        // ── Teaching items ──────────────────────────────────
        const teaching: TeachingSkill[] = myPostedSkills.map((s, i) => ({
          id: s._id,
          title: s.title,
          category: s.category,
          studentsEnrolled: swapsAccepted,
          creditsEarned: (s.cost || 10) + swapsCompleted * 10,
        }));

        // ── Learning items: fetch real accepted/completed swaps progress ─
        const acceptedSwaps = allSwaps.filter(
          (sw) => (sw.status === 'accepted' || sw.status === 'completed') && (sw.requester === user?.id || sw.provider === user?.id)
        );

        const learningFromSwaps: LearningSkill[] = acceptedSwaps.map((sw) => {
          const isTeacher = sw.provider === user?.id;
          const partnerName = isTeacher ? (sw.requesterName || 'Learner') : (sw.providerName || 'Teacher');
          const skillTitle = sw.requestedSkillTitle || sw.offeredSkillTitle || 'Skill Swap';

          return {
            id: sw._id,
            title: skillTitle,
            category: 'Skill Swap',
            proficiency: sw.progressStatus || 'In Progress',
            progress: typeof sw.progress === 'number' ? sw.progress : 0,
            status: sw.progressStatus || 'In Progress',
            teacherName: isTeacher ? `Your Student: ${partnerName}` : `Teacher: ${partnerName}`,
            dateStarted: new Date(sw.createdAt).toLocaleDateString(),
          };
        });

        // ── Overall progress stat ───────────────────────────
        const avg =
          learningFromSwaps.reduce((acc, s) => acc + s.progress, 0) /
          (learningFromSwaps.length || 1);
        const totalCredits =
          teaching.reduce((acc, t) => acc + t.creditsEarned, 0) + (user?.credits || 100);

        setLearningSkills(learningFromSwaps);
        setTeachingSkills(teaching);
        setStats({
          skillsPosted: myPostedSkills.length,
          swapsPending,
          swapsAccepted,
          swapsCompleted,
          totalCreditsEarned: totalCredits,
          overallProgress: Math.round(avg),
        });
      } catch (err) {
        console.error('Progress tracker load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Focus area breakdown
  const categoryMap: Record<string, number> = {};
  [...learningSkills, ...teachingSkills].forEach((s) => {
    categoryMap[s.category] = (categoryMap[s.category] || 0) + 1;
  });
  const total = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
  const focusBreakdown = Object.entries(categoryMap).map(([cat, count]) => ({
    category: cat,
    pct: Math.round((count / total) * 100),
  }));

  const statCards = [
    { label: 'Skills Posted', value: stats.skillsPosted, icon: <BookOpen className="w-4 h-4 text-primary" />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Swaps Pending', value: stats.swapsPending, icon: <Clock className="w-4 h-4 text-amber-500" />, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Swaps Accepted', value: stats.swapsAccepted, icon: <Repeat2 className="w-4 h-4 text-blue-500" />, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Swaps Completed', value: stats.swapsCompleted, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Credits Earned', value: stats.totalCreditsEarned, icon: <Star className="w-4 h-4 text-yellow-500" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Overall Progress', value: `${stats.overallProgress}%`, icon: <Flame className="w-4 h-4 text-rose-500" />, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm animate-pulse">
        Loading your active learning status...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div className="glass p-6 rounded-2xl border border-border shadow-sm bg-gradient-to-r from-primary/10 via-background to-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Target className="w-4 h-4 text-emerald-500" /> Active Learning Status
          </div>
          <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Your Learning & Teaching Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Progress is automatically tracked from your skill swaps, posted courses, and community activity — no manual input needed.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-surface border border-border rounded-lg px-3 py-1.5 w-fit">
            <Lock className="w-3 h-3 text-primary" />
            <span>Progress is <strong className="text-foreground">read-only</strong> — automatically updated by your activity</span>
          </div>
        </div>

        {/* Overall Progress Ring */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-1 p-4 glass rounded-2xl border border-border w-32 text-center">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface" />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="url(#prog-grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(stats.overallProgress / 100) * 163.4} 163.4`}
              />
              <defs>
                <linearGradient id="prog-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">
              {stats.overallProgress}%
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Overall</span>
        </div>
      </div>

      {/* ── Activity Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`glass rounded-xl p-3 border ${card.bg} text-center space-y-1`}
          >
            <div className="flex justify-center">{card.icon}</div>
            <p className={`text-lg font-black ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground leading-tight">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Learning + Teaching */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Learning Status */}
          <div className="glass p-5 rounded-2xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Active Learning Status
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface border border-border px-2.5 py-1 rounded-lg">
                <Lock className="w-3 h-3 text-primary" /> Auto-tracked
              </div>
            </div>

            <div className="space-y-4">
              {learningSkills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 bg-background/60 dark:bg-zinc-950/40 rounded-xl border border-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {skill.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            skill.status === 'Mastered'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : skill.status === 'Practicing'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {skill.status === 'Mastered' ? '🏆 ' : skill.status === 'Practicing' ? '⚡ ' : '📘 '}
                          {skill.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{skill.title}</h4>
                      {skill.teacherName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Mentor: <strong className="text-foreground">{skill.teacherName}</strong>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-extrabold text-primary">{skill.progress}%</span>
                      <p className="text-[10px] text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  {/* Read-only progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-surface h-3 rounded-full overflow-hidden border border-border relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                        className={`h-full rounded-full ${
                          skill.progress >= 90
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                            : skill.progress >= 55
                            ? 'bg-gradient-to-r from-purple-400 to-indigo-600'
                            : 'bg-gradient-to-r from-primary to-teal-400'
                        }`}
                      />
                      {/* Shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>

                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Auto-calculated from your swap activity</span>
                      <span>Started: {skill.dateStarted}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Teaching / Mentorship Status */}
          {teachingSkills.length > 0 && (
            <div className="glass p-5 rounded-2xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" /> Teaching & Mentorship Status
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  +10 Credits per Course Posted
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachingSkills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="p-4 bg-background/60 dark:bg-zinc-950/40 rounded-xl border border-border space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {skill.category}
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-2 line-clamp-2">{skill.title}</h4>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t pt-2.5 border-border">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <strong className="text-foreground">{skill.studentsEnrolled}</strong> enrolled
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        +{skill.creditsEarned} Cr Earned
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right (1/3): Focus Area + Recommendations */}
        <div className="space-y-6">
          {/* Focus Area Breakdown */}
          <div className="glass p-5 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-500" /> Focus Area Distribution
            </h3>

            <div className="space-y-3">
              {focusBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">{item.category}</span>
                    <span className="text-primary">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-muted-foreground">
              💡 Your strongest focus is{' '}
              <strong className="text-primary">{focusBreakdown[0]?.category || 'Technology'}</strong>. Expanding
              into complementary areas builds a well-rounded skill tree!
            </div>
          </div>

          {/* What to Learn Next */}
          <div className="glass p-5 rounded-2xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-foreground">
              <Zap className="w-5 h-5 text-amber-500" /> What to Learn Next
            </div>

            <div className="space-y-3">
              {RECOMMENDATIONS.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-3.5 bg-background/60 dark:bg-zinc-950/40 rounded-xl border border-border hover:border-primary/50 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {rec.tag}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{rec.category}</span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {rec.title}
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-snug">{rec.reason}</p>
                  <button
                    onClick={() => onNavigateMarketplace(rec.query)}
                    className="mt-1 w-full py-1.5 px-3 bg-surface hover:bg-primary hover:text-white text-primary text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-primary/20 cursor-pointer"
                  >
                    <span>Explore in Marketplace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
