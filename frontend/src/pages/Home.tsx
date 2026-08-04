// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Sparkles, ArrowRight, Users, BookOpen, Repeat, Bot,
  Star, MessageSquare, MapPin, Zap, Trophy, Shield,
  TrendingUp, Play, ChevronRight
} from 'lucide-react';

// ── Animated Counter ──────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: number; suffix?: string; prefix?: string }> = ({
  target, suffix = '', prefix = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (1800 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ── Data ──────────────────────────────────────────────────────
const features = [
  { icon: <BookOpen className="w-6 h-6" />, title: 'Skill Marketplace', description: 'Browse hundreds of skills offered & wanted in your community. Filter by category, location, and proficiency.', color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/20 text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
  { icon: <Repeat className="w-6 h-6" />, title: 'Skill Swaps', description: 'Propose a direct 1-on-1 skill exchange with any community member. No money, just knowledge.', color: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/30', iconBg: 'bg-blue-500/20 text-blue-400', glow: 'hover:shadow-blue-500/20' },
  { icon: <Bot className="w-6 h-6" />, title: 'AI Doubt Tutor', description: 'Stuck? Our 24/7 AI assistant instantly explains coding, design, and language doubts with examples.', color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/30', iconBg: 'bg-purple-500/20 text-purple-400', glow: 'hover:shadow-purple-500/20' },
  { icon: <MessageSquare className="w-6 h-6" />, title: 'Live Chat', description: 'Real-time Socket.io powered chat with your swap partner. Schedule sessions and share resources.', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', iconBg: 'bg-amber-500/20 text-amber-400', glow: 'hover:shadow-amber-500/20' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Location Maps', description: 'Meet offline with interactive map views. Find nearby skill partners in your city for in-person sessions.', color: 'from-rose-500/20 to-pink-500/10', border: 'border-rose-500/30', iconBg: 'bg-rose-500/20 text-rose-400', glow: 'hover:shadow-rose-500/20' },
  { icon: <Trophy className="w-6 h-6" />, title: 'Gamified Leaderboard', description: 'Earn XP, collect achievement badges, and climb the community leaderboard as you teach and learn.', color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30', iconBg: 'bg-yellow-500/20 text-yellow-400', glow: 'hover:shadow-yellow-500/20' },
];

const testimonials = [
  { name: 'Alex Chen', skill: 'React Developer → Spanish Learner', text: 'I taught React to 3 people and learned conversational Spanish in return. SkillBridge is genius.', rating: 5, avatar: 'A', avatarColor: 'from-emerald-400 to-teal-500' },
  { name: 'Sarah Jenkins', skill: 'UX Designer → Python Learner', text: 'The AI tutor helped me understand async/await in 5 minutes. Then I found a Python mentor instantly!', rating: 5, avatar: 'S', avatarColor: 'from-purple-400 to-violet-500' },
  { name: 'Marcus Roy', skill: 'Music Producer → Web Dev', text: 'Swapped music production lessons for HTML/CSS mentorship. The platform is seamless and beautiful.', rating: 5, avatar: 'M', avatarColor: 'from-amber-400 to-orange-500' },
];

const floatingSkills = [
  { label: 'React', emoji: '⚛️', x: '8%', y: '20%', delay: 0 },
  { label: 'Guitar', emoji: '🎸', x: '78%', y: '15%', delay: 0.4 },
  { label: 'Python', emoji: '🐍', x: '85%', y: '55%', delay: 0.8 },
  { label: 'Spanish', emoji: '🌮', x: '5%', y: '60%', delay: 0.2 },
  { label: 'UI/UX', emoji: '🎨', x: '70%', y: '80%', delay: 1.0 },
  { label: 'ML / AI', emoji: '🤖', x: '15%', y: '82%', delay: 0.6 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Component ─────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ skills: 0, users: 0, swaps: 0 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [skillsRes, swapsRes] = await Promise.all([
          api.get('/skills').catch(() => ({ data: [] })),
          api.get('/swaps').catch(() => ({ data: [] })),
        ]);
        const skillCount = Array.isArray(skillsRes.data) ? skillsRes.data.length : 0;
        const swapCount = Array.isArray(swapsRes.data) ? swapsRes.data.length : 0;
        const userIds = new Set(skillsRes.data.map((s: any) => s.user));
        setStats({ skills: Math.max(skillCount, 142), users: Math.max(userIds.size, 38), swaps: Math.max(swapCount, 67) });
      } catch {
        setStats({ skills: 142, users: 38, swaps: 67 });
      }
    };
    fetchStats();

    // Auto-rotate testimonials
    const t = setInterval(() => setActiveTestimonial(a => (a + 1) % testimonials.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-0 overflow-x-hidden">
      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center py-20 px-4 overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/10 blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-purple-500/15 to-blue-500/10 blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-[30%] right-[25%] w-[250px] h-[250px] rounded-full bg-amber-500/8 blur-[80px]"
          />
        </div>

        {/* Floating skill chips */}
        {floatingSkills.map((s, i) => (
          <motion.div
            key={i}
            className="absolute hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 border border-border/60 rounded-full text-xs font-bold text-foreground shadow-md backdrop-blur-sm pointer-events-none"
            style={{ left: s.x, top: s.y }}
            animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            <span>{s.emoji}</span>
            {s.label}
          </motion.div>
        ))}

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Community Live · {stats.users}+ Active Learners
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl lg:text-8xl font-black text-foreground leading-[1.05] mb-6 max-w-5xl"
          style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
          Learn. Teach.{' '}
          <span className="gradient-text">Grow Together.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          <strong className="text-foreground">SkillBridge</strong> is the community-powered skill exchange platform where you trade{' '}
          <span className="text-primary font-semibold">what you know</span> for{' '}
          <span className="text-emerald-500 font-semibold">what you want to learn</span>. No money. Just knowledge.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-16"
        >
          <button
            onClick={() => navigate('/auth/register')}
            className="group relative px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 text-white font-bold rounded-2xl text-base shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 flex items-center gap-2 overflow-hidden"
          >
            <span className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-5 h-5" />
            Join Free – Get 100 Credits
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="group px-8 py-4 border border-border text-foreground font-semibold rounded-2xl text-base hover:bg-surface hover:border-primary/50 hover:text-primary transition-all duration-200 flex items-center gap-2"
          >
            <Play className="w-4 h-4 group-hover:text-primary transition-colors" />
            Sign In
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="w-full max-w-3xl grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Skills Listed', value: stats.skills, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/5' },
            { label: 'Active Learners', value: stats.users, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'from-blue-500/10 to-indigo-500/5' },
            { label: 'Swaps Completed', value: stats.swaps, icon: <Repeat className="w-5 h-5" />, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
              className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-5 border border-border/60 text-center backdrop-blur-md shadow-sm cursor-default`}
            >
              <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className={`text-3xl font-black ${stat.color}`}>
                <AnimatedCounter target={stat.value} suffix="+" />
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="max-w-6xl mx-auto space-y-14"
        >
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Everything You Need
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              A Complete Skill Exchange Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Every feature designed to make knowledge sharing seamless, engaging, and rewarding.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} backdrop-blur-sm shadow-sm hover:shadow-lg ${f.glow} transition-all duration-300 cursor-default overflow-hidden`}
              >
                {/* Shimmer on hover */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`relative w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="relative text-base font-bold text-foreground mb-2">{f.title}</h3>
                <p className="relative text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                <div className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Learn more <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-b from-surface/20 to-transparent dark:from-zinc-900/40">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-5xl mx-auto space-y-14"
        >
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> How It Works
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              3 Simple Steps to Start Exchanging
            </h2>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Shield className="w-7 h-7" />, title: 'Create Your Profile', desc: 'Sign up and receive 100 free credits. List skills you can teach and skills you want to learn.', color: 'text-primary', bg: 'bg-primary/10', glow: 'shadow-primary/20', accent: '#0d9488' },
              { step: '02', icon: <Sparkles className="w-7 h-7" />, title: 'Find & Match Skills', desc: 'Browse the marketplace, use our AI match engine, and propose a skill swap with the perfect partner.', color: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20', accent: '#10b981' },
              { step: '03', icon: <Trophy className="w-7 h-7" />, title: 'Learn & Earn Rewards', desc: 'Complete swaps, earn XP badges, climb the leaderboard, and grow your skill portfolio.', color: 'text-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/20', accent: '#f59e0b' },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                className={`relative p-7 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-border shadow-sm hover:shadow-xl ${s.glow} transition-all duration-300 text-center group`}
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-border to-transparent z-10" />
                )}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-background border border-border text-muted-foreground">
                  Step {s.step}
                </div>
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  className={`w-16 h-16 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mx-auto mb-5 mt-3 group-hover:scale-110 transition-transform duration-200`}
                >
                  {s.icon}
                </motion.div>
                <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="max-w-5xl mx-auto space-y-14"
        >
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5" /> Community Stories
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              What Our Exchangers Say
            </h2>
          </motion.div>

          {/* Desktop grid */}
          <motion.div variants={containerVariants} className="hidden md:grid grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 space-y-4 backdrop-blur-sm"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.skill}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile carousel */}
          <div className="md:hidden relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border shadow-sm space-y-4"
              >
                {(() => {
                  const t = testimonials[activeTestimonial];
                  return (
                    <>
                      <div className="flex gap-1">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} text-white font-bold text-sm flex items-center justify-center`}>{t.avatar}</div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground">{t.skill}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="py-28 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-8 p-14 rounded-3xl bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 border border-primary/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-3xl" />
          </div>

          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl inline-block"
          >
            🚀
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Ready to Start Exchanging?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Join thousands of learners and teachers building real skills together. It's free, and you start with{' '}
              <strong className="text-primary">100 credits</strong> on day one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/auth/register')}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 text-white font-bold rounded-2xl text-base shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 flex items-center gap-2 overflow-hidden"
            >
              <span className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-5 h-5" />
              Join Free – Get 100 Credits
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="group px-10 py-4 border border-border font-semibold rounded-2xl text-base hover:bg-surface hover:border-primary/40 hover:text-primary transition-all duration-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-primary" />
              Explore Dashboard
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {[
              { val: '100+', label: 'Skills Available' },
              { val: '4.9★', label: 'User Rating' },
              { val: 'Free', label: 'Always' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-black text-foreground">{item.val}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
