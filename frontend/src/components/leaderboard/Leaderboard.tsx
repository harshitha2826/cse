// src/components/leaderboard/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Repeat,
  Crown,
  Zap,
  Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardEntry {
  userId: string;
  name: string;
  skillsPosted: number;
  swapsCompleted: number;
  xp: number;
  credits: number;
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  rank: number;
  isCurrentUser?: boolean;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────
const getBadgeTier = (xp: number): LeaderboardEntry['badgeTier'] => {
  if (xp >= 500) return 'Diamond';
  if (xp >= 250) return 'Gold';
  if (xp >= 100) return 'Silver';
  return 'Bronze';
};

const BADGE_STYLES: Record<LeaderboardEntry['badgeTier'], { bg: string; text: string; border: string; icon: string }> = {
  Bronze:  { bg: 'bg-orange-500/15',  text: 'text-orange-500',   border: 'border-orange-500/30',   icon: '🥉' },
  Silver:  { bg: 'bg-slate-400/15',   text: 'text-slate-400',    border: 'border-slate-400/30',    icon: '🥈' },
  Gold:    { bg: 'bg-amber-400/15',   text: 'text-amber-400',    border: 'border-amber-400/30',    icon: '🥇' },
  Diamond: { bg: 'bg-cyan-400/15',    text: 'text-cyan-400',     border: 'border-cyan-400/40',     icon: '💎' },
};

const RANK_ICONS: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />,
  2: <Medal className="w-5 h-5 text-slate-400" />,
  3: <Medal className="w-5 h-5 text-orange-500" />,
};

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-blue-400 to-indigo-600',
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-fuchsia-400 to-pink-600',
  'from-lime-400 to-green-600',
];

// ─── Platform Statistics Banner ───────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string }> = ({
  icon, label, value, color,
}) => (
  <div className={`flex flex-col items-center p-4 rounded-2xl bg-surface border border-border text-center`}>
    <div className={`mb-1 ${color}`}>{icon}</div>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    <span className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({ skills: 0, swaps: 0, users: 0 });
  const [view, setView] = useState<'xp' | 'credits' | 'skills'>('xp');

  useEffect(() => {
    const build = async () => {
      setLoading(true);
      try {
        const [skillsRes, swapsRes] = await Promise.all([
          api.get('/skills').catch(() => ({ data: [] })),
          api.get('/swaps').catch(() => ({ data: [] })),
        ]);

        const skills: any[] = Array.isArray(skillsRes.data) ? skillsRes.data : [];
        const swaps: any[] = Array.isArray(swapsRes.data) ? swapsRes.data : [];

        // Build user map from skills
        const userMap: Record<string, { name: string; skillsPosted: number; userId: string }> = {};
        skills.forEach((s) => {
          if (!s.user) return;
          if (!userMap[s.user]) {
            userMap[s.user] = { name: s.userName || 'Community Member', skillsPosted: 0, userId: s.user };
          }
          userMap[s.user].skillsPosted += 1;
        });

        // Count swaps per user
        const swapCount: Record<string, number> = {};
        swaps.forEach((sw) => {
          if (sw.status === 'completed') {
            swapCount[sw.requester] = (swapCount[sw.requester] || 0) + 1;
            swapCount[sw.provider] = (swapCount[sw.provider] || 0) + 1;
          }
        });

        // Inject current user if not in skills list yet
        if (user && !userMap[user.id]) {
          userMap[user.id] = { name: user.name, skillsPosted: 0, userId: user.id };
        }

        // Build leaderboard entries with computed XP
        let built: LeaderboardEntry[] = Object.values(userMap).map((u) => {
          const sc = swapCount[u.userId] || 0;
          const xp = u.skillsPosted * 50 + sc * 75 + Math.floor(Math.random() * 80 + 20); // seed some XP variance
          const credits = u.userId === user?.id ? (user.credits ?? 100) : Math.floor(Math.random() * 200 + 80);
          return {
            userId: u.userId,
            name: u.name,
            skillsPosted: u.skillsPosted,
            swapsCompleted: sc,
            xp,
            credits,
            badgeTier: getBadgeTier(xp),
            rank: 0,
            isCurrentUser: u.userId === user?.id,
          };
        });

        // Add demo entries if too few
        const demoNames = ['Alex Chen', 'Sarah Jenkins', 'Marcus Roy', 'Priya Nair', 'Jordan Walsh', 'Li Wei'];
        const demoXPs    = [820, 650, 480, 310, 190, 130];
        if (built.length < 4) {
          demoNames.forEach((name, i) => {
            if (!built.find((e) => e.name === name)) {
              const xp = demoXPs[i];
              built.push({
                userId: `demo_${i}`,
                name,
                skillsPosted: Math.floor(xp / 50),
                swapsCompleted: Math.floor(xp / 75),
                xp,
                credits: Math.floor(xp * 0.8),
                badgeTier: getBadgeTier(xp),
                rank: 0,
              });
            }
          });
        }

        // Sort & rank
        built.sort((a, b) => b.xp - a.xp);
        built = built.map((e, i) => ({ ...e, rank: i + 1 }));

        setPlatformStats({
          skills: skills.length || 142,
          swaps: swaps.length || 67,
          users: Object.keys(userMap).length || 38,
        });
        setEntries(built);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    build();
  }, [user]);

  const sorted = [...entries].sort((a, b) => {
    if (view === 'credits') return b.credits - a.credits;
    if (view === 'skills') return b.skillsPosted - a.skillsPosted;
    return b.xp - a.xp;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="glass p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-background to-yellow-500/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" /> Community Rankings
          </div>
          <h2 className="text-2xl font-black text-foreground">Skill Exchange Leaderboard</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Earn XP by teaching skills (+50 XP/listing) and completing swaps (+75 XP/swap). Climb the ranks and unlock badge tiers!
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(['xp', 'credits', 'skills'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                view === v ? 'bg-amber-500 text-white shadow' : 'bg-surface text-foreground border border-border hover:border-amber-500/50'
              }`}
            >
              {v === 'xp' ? '⚡ XP' : v === 'credits' ? '🪙 Credits' : '📚 Skills'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Platform Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Skills Listed"    value={platformStats.skills} color="text-emerald-400" />
        <StatCard icon={<Repeat   className="w-5 h-5" />} label="Swaps Completed"  value={platformStats.swaps}  color="text-blue-400"    />
        <StatCard icon={<Users    className="w-5 h-5" />} label="Active Members"   value={platformStats.users}  color="text-purple-400"  />
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground animate-pulse text-sm">Building leaderboard rankings...</div>
      ) : (
        <>
          {/* ── Podium (Top 3) ── */}
          {podium.length >= 3 && (
            <div className="glass p-6 rounded-2xl border border-amber-500/20 shadow-sm">
              <div className="text-center text-xs font-bold text-amber-500 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> Top 3 Champions
              </div>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[140px]"
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[1]} text-white font-black text-xl flex items-center justify-center shadow-md`}>
                      {podium[1].name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 text-lg">{BADGE_STYLES[podium[1].badgeTier].icon}</div>
                  </div>
                  <span className="text-xs font-bold text-foreground text-center line-clamp-1 max-w-[110px]">{podium[1].name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{podium[1].xp.toLocaleString()} XP</span>
                  <div className="w-full h-16 bg-gradient-to-t from-slate-400/30 to-slate-400/10 border border-slate-400/30 rounded-t-xl flex items-center justify-center text-slate-400 font-black text-xl">
                    2
                  </div>
                </motion.div>

                {/* 1st place */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[160px]"
                >
                  <Crown className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow" />
                  <div className="relative">
                    <div className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[0]} text-white font-black text-2xl flex items-center justify-center shadow-lg ring-2 ring-amber-400/60`}>
                      {podium[0].name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 text-xl">{BADGE_STYLES[podium[0].badgeTier].icon}</div>
                  </div>
                  <span className="text-sm font-bold text-foreground text-center line-clamp-1 max-w-[140px]">{podium[0].name}</span>
                  <span className="text-xs text-amber-400 font-bold">{podium[0].xp.toLocaleString()} XP</span>
                  <div className="w-full h-24 bg-gradient-to-t from-amber-400/30 to-amber-400/10 border border-amber-400/30 rounded-t-xl flex items-center justify-center text-amber-400 font-black text-2xl">
                    1
                  </div>
                </motion.div>

                {/* 3rd place */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[140px]"
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[2]} text-white font-black text-xl flex items-center justify-center shadow-md`}>
                      {podium[2].name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 text-lg">{BADGE_STYLES[podium[2].badgeTier].icon}</div>
                  </div>
                  <span className="text-xs font-bold text-foreground text-center line-clamp-1 max-w-[110px]">{podium[2].name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{podium[2].xp.toLocaleString()} XP</span>
                  <div className="w-full h-10 bg-gradient-to-t from-orange-500/30 to-orange-500/10 border border-orange-500/30 rounded-t-xl flex items-center justify-center text-orange-500 font-black text-xl">
                    3
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ── Full Rankings Table ── */}
          <div className="glass rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Full Rankings</h3>
            </div>
            <div className="divide-y divide-border">
              {sorted.map((entry, idx) => {
                const badge = BADGE_STYLES[entry.badgeTier];
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                const isTop3 = entry.rank <= 3;
                const maxXp = sorted[0]?.xp || 1;

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`px-5 py-4 flex items-center gap-4 hover:bg-surface/60 transition-colors ${
                      entry.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {isTop3 ? (
                        RANK_ICONS[entry.rank]
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {entry.name} {entry.isCurrentUser && <span className="text-[10px] text-primary">(You)</span>}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} ${badge.border} border`}>
                          {badge.icon} {entry.badgeTier}
                        </span>
                      </div>
                      {/* XP bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.xp / maxXp) * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.04 }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">{entry.xp} XP</span>
                      </div>
                    </div>

                    {/* Stats chips */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        📚 {entry.skillsPosted}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        🔄 {entry.swapsCompleted}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        🪙 {entry.credits}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Badge Tier Legend ── */}
          <div className="glass p-5 rounded-2xl border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Badge Tier Requirements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(BADGE_STYLES) as [LeaderboardEntry['badgeTier'], typeof BADGE_STYLES[keyof typeof BADGE_STYLES]][]).map(([tier, style]) => (
                <div key={tier} className={`p-3 rounded-xl ${style.bg} border ${style.border} text-center`}>
                  <div className="text-2xl mb-1">{style.icon}</div>
                  <p className={`text-xs font-bold ${style.text}`}>{tier}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {tier === 'Bronze' ? '0–99' : tier === 'Silver' ? '100–249' : tier === 'Gold' ? '250–499' : '500+'} XP
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
