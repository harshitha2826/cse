import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ExploreMarketplace } from '../components/marketplace/ExploreMarketplace';
import { PostSkillModal } from '../components/marketplace/PostSkillModal';
import { SwapRequestsList } from '../components/swaps/SwapRequestsList';
import { SkillProgressTracker } from '../components/roadmap/SkillProgressTracker';
import { Leaderboard } from '../components/leaderboard/Leaderboard';
import { LiveChat } from '../components/chat/LiveChat';
import { Tooltip } from '../components/ui/Tooltip';
import {
  Compass,
  CheckCircle2,
  Repeat,
  MessageSquare,
  Trophy,
  UserCheck,
  Plus,
  Coins,
  Star,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

type TabKey = 'marketplace' | 'progress' | 'swaps' | 'chat' | 'leaderboard' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  activeColor: string;
  activeGlow: string;
  badge?: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('marketplace');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState<{ partnerId: string; partnerName: string }>({
    partnerId: '6a6b72bd9d844061aa44c9ef',
    partnerName: 'SkillBridge Community Mentor',
  });

  const tabs: TabItem[] = [
    {
      key: 'marketplace',
      label: 'Marketplace',
      tooltip: 'Browse community skill listings, filter categories & propose swaps',
      icon: <Compass className="w-4 h-4" />,
      activeColor: 'from-primary via-emerald-500 to-teal-500',
      activeGlow: 'shadow-primary/30',
    },
    {
      key: 'progress',
      label: 'Progress',
      tooltip: 'Track learning milestones, badges, skill goals & daily streaks',
      icon: <CheckCircle2 className="w-4 h-4" />,
      activeColor: 'from-blue-600 via-indigo-500 to-purple-600',
      activeGlow: 'shadow-blue-500/30',
    },
    {
      key: 'swaps',
      label: 'Swaps',
      tooltip: 'Manage 1-on-1 direct skill exchange proposals & status',
      icon: <Repeat className="w-4 h-4" />,
      activeColor: 'from-amber-500 via-orange-500 to-rose-500',
      activeGlow: 'shadow-amber-500/30',
    },
    {
      key: 'chat',
      label: 'Live Chat',
      tooltip: 'Real-time Socket.io messaging with skill mentors & swap partners',
      icon: <MessageSquare className="w-4 h-4" />,
      activeColor: 'from-teal-500 via-emerald-500 to-emerald-600',
      activeGlow: 'shadow-teal-500/30',
    },
    {
      key: 'leaderboard',
      label: 'Leaderboard',
      tooltip: 'Community top teachers ranking, XP leaderboard & top earners',
      icon: <Trophy className="w-4 h-4 text-amber-300" />,
      activeColor: 'from-yellow-500 via-amber-500 to-orange-500',
      activeGlow: 'shadow-amber-500/30',
      badge: '🏅',
    },
    {
      key: 'profile',
      label: 'My Profile',
      tooltip: 'View your profile card, skills taught, earned badges & stats',
      icon: <UserCheck className="w-4 h-4" />,
      activeColor: 'from-purple-600 via-violet-600 to-indigo-600',
      activeGlow: 'shadow-purple-500/30',
    },
  ];

  const credits = user?.credits ?? 100;
  const xp = 240;

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header Strip ─────────────────────────────────── */}
        <div className="glass rounded-3xl p-5 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary/30">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-card rounded-full" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground flex items-center gap-2 flex-wrap" style={{ fontFamily: 'Outfit, sans-serif' }}>
                SkillBridge Dashboard
                <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                  ✓ Verified Exchanger
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, <span className="font-bold text-foreground">{user?.name}</span>! 👋
              </p>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <Tooltip content="Your current Credit Balance. Teach to earn +10 Cr!" position="bottom">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer">
                <Zap className="w-3.5 h-3.5" />
                {credits} Credits
              </div>
            </Tooltip>

            <Tooltip content="Your total XP Points earned through learning & teaching" position="bottom">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 cursor-pointer">
                <Star className="w-3.5 h-3.5" />
                {xp} XP
              </div>
            </Tooltip>

            <Tooltip content="Publish a new skill listing & earn +10 Credits" position="bottom">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsPostModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Skill
              </motion.button>
            </Tooltip>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Tooltip key={tab.key} content={tab.tooltip} position="bottom">
                <motion.button
                  onClick={() => setActiveTab(tab.key)}
                  whileHover={!isActive ? { scale: 1.04 } : {}}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${tab.activeColor} text-white shadow-md ${tab.activeGlow}`
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/25' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-xl ring-2 ring-white/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Tooltip>
            );
          })}
        </div>

        {/* ── Tab Content ──────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeTab === 'marketplace' && (
              <ExploreMarketplace onPostClick={() => setIsPostModalOpen(true)} />
            )}

            {activeTab === 'progress' && <SkillProgressTracker onNavigateMarketplace={() => setActiveTab('marketplace')} />}

            {activeTab === 'swaps' && (
              <SwapRequestsList
                onOpenChat={(partnerId, partnerName) => {
                  setChatPartner({ partnerId, partnerName });
                  setActiveTab('chat');
                }}
              />
            )}

            {activeTab === 'chat' && (
              <LiveChat partnerId={chatPartner.partnerId} partnerName={chatPartner.partnerName} />
            )}

            {activeTab === 'leaderboard' && <Leaderboard />}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="glass rounded-3xl p-6 border border-border shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-emerald-400 to-teal-500 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground">{user?.name}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                          ✨ Skill Member
                        </span>
                        <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          🪙 {credits} Credits
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="p-4 rounded-2xl bg-surface border border-border text-center space-y-1">
                      <p className="text-2xl font-black text-primary">100%</p>
                      <p className="text-xs text-muted-foreground font-semibold">Response Rate</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface border border-border text-center space-y-1">
                      <p className="text-2xl font-black text-emerald-500">4.9 ★</p>
                      <p className="text-xs text-muted-foreground font-semibold">Community Rating</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface border border-border text-center space-y-1">
                      <p className="text-2xl font-black text-amber-500">3</p>
                      <p className="text-xs text-muted-foreground font-semibold">Swaps Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Post Skill Modal ────────────────────────────────────── */}
      <PostSkillModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSkillAdded={() => {
          setActiveTab('marketplace');
        }}
      />
    </div>
  );
};

export default Dashboard;
