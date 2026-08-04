import React from 'react';
import { motion } from 'framer-motion';
import { triggerConfetti } from '../../utils/confetti';
import { Award, Flame, Lock, ShieldCheck, Sparkles, Star, Trophy, Zap } from 'lucide-react';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface GamifiedBadgesProps {
  userStats?: {
    skillsPosted: number;
    swapsAccepted: number;
    swapsCompleted: number;
    credits: number;
  };
}

export const GamifiedBadges: React.FC<GamifiedBadgesProps> = ({ userStats }) => {
  const skillsPosted = userStats?.skillsPosted ?? 1;
  const swapsAccepted = userStats?.swapsAccepted ?? 1;
  const swapsCompleted = userStats?.swapsCompleted ?? 1;
  const credits = userStats?.credits ?? 100;

  const badges: BadgeItem[] = [
    {
      id: 'pioneer',
      title: 'Skill Pioneer',
      description: 'Posted your first skill listing to the community marketplace',
      xp: 50,
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'from-emerald-500/20 to-teal-500/10',
      unlocked: skillsPosted >= 1,
      unlockedAt: 'Unlocked on signup',
    },
    {
      id: 'first-swap',
      title: 'First Exchange',
      description: 'Accepted & started your first 1-on-1 direct skill swap proposal',
      xp: 100,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      bg: 'from-blue-500/20 to-indigo-500/10',
      unlocked: swapsAccepted >= 1,
      unlockedAt: 'Unlocked',
    },
    {
      id: 'certified-master',
      title: 'Certified Graduate',
      description: 'Completed 100% roadmap milestones & received verified certificate',
      xp: 200,
      icon: <Award className="w-5 h-5" />,
      color: 'text-purple-400',
      border: 'border-purple-500/40',
      bg: 'from-purple-500/20 to-violet-500/10',
      unlocked: swapsCompleted >= 1,
      unlockedAt: 'Unlocked',
    },
    {
      id: 'streak',
      title: '7-Day Learning Streak',
      description: 'Logged in and exchanged skills 7 days in a row without missing',
      xp: 150,
      icon: <Flame className="w-5 h-5" />,
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'from-amber-500/20 to-orange-500/10',
      unlocked: true,
      unlockedAt: 'Active Streak 🔥',
    },
    {
      id: 'master-tutor',
      title: 'Master Mentor',
      description: 'Successfully taught and evaluated 3 or more enrolled students',
      xp: 300,
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-yellow-400',
      border: 'border-yellow-500/40',
      bg: 'from-yellow-500/20 to-amber-500/10',
      unlocked: swapsCompleted >= 3,
      unlockedAt: 'Teach 3 students to unlock',
    },
    {
      id: 'credit-star',
      title: 'Community Catalyst',
      description: 'Earned 150+ Credits by teaching and publishing skills',
      xp: 250,
      icon: <Star className="w-5 h-5" />,
      color: 'text-rose-400',
      border: 'border-rose-500/40',
      bg: 'from-rose-500/20 to-pink-500/10',
      unlocked: credits >= 150,
      unlockedAt: 'Reach 150 Credits to unlock',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalXp = badges.filter((b) => b.unlocked).reduce((acc, b) => acc + b.xp, 0);

  return (
    <div className="glass rounded-3xl p-6 border border-border shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              🏅 Gamified XP & Achievements
            </span>
          </div>
          <h2 className="text-2xl font-black text-foreground mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Earn Badges & Climb Leaderboard
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete skill roadmaps, teach students, and build daily streaks to unlock achievement badges.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-4 py-2 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/30 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground font-semibold">Total XP Earned</p>
            <p className="text-xl font-black text-purple-400">{totalXp} XP</p>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground font-semibold">Badges Unlocked</p>
            <p className="text-xl font-black text-emerald-400">
              {unlockedCount} / {badges.length}
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <motion.div
            key={b.id}
            whileHover={b.unlocked ? { scale: 1.03 } : {}}
            onClick={() => b.unlocked && triggerConfetti()}
            className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              b.unlocked
                ? `bg-gradient-to-br ${b.bg} ${b.border} shadow-sm cursor-pointer`
                : 'bg-surface/40 border-border/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-background border ${b.border} ${b.color}`}>
                  {b.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/20">
                    +{b.xp} XP
                  </span>
                  {b.unlocked ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${b.unlocked ? b.color : 'text-muted-foreground'}`}>
                {b.unlocked ? `✓ ${b.unlockedAt}` : `🔒 ${b.unlockedAt}`}
              </span>
              {b.unlocked && (
                <span className="text-[10px] text-muted-foreground hover:text-foreground">
                  Click for Confetti 🎉
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
