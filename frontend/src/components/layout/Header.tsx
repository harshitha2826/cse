// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, LogOut, User as UserIcon, Coins, Info, X,
  Zap, Sparkles, LayoutDashboard, Home, ChevronDown
} from 'lucide-react';

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close user menu on route change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
      isActive
        ? 'text-white bg-gradient-to-r from-primary to-emerald-500 shadow-md'
        : 'text-foreground hover:text-primary hover:bg-primary/8'
    }`;

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/85 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-background/95 backdrop-blur-md border-b border-border/40'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          {/* ── Logo ── */}
          <Tooltip content="Go to SkillBridge Landing Page" position="bottom">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-md group-hover:shadow-primary/40 transition-shadow duration-300">
                <Zap className="w-5 h-5 text-white" fill="white" />
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-black tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                <span className="text-primary">Skill</span>
                <span className="text-foreground">Bridge</span>
              </span>
            </Link>
          </Tooltip>

          {/* ── Nav ── */}
          <nav className="hidden sm:flex items-center gap-1">
            <Tooltip content="View Home Landing Page & Features" position="bottom">
              <NavLink to="/" className={navLinkClass} end>
                <Home className="w-3.5 h-3.5" /> Home
              </NavLink>
            </Tooltip>

            {user ? (
              <Tooltip content="Open Skill Marketplace & Personal Dashboard" position="bottom">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </NavLink>
              </Tooltip>
            ) : (
              <Tooltip content="Login or Create New Account" position="bottom">
                <NavLink to="/auth" className={navLinkClass}>
                  <Sparkles className="w-3.5 h-3.5" /> Login / Register
                </NavLink>
              </Tooltip>
            )}
          </nav>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Tooltip content={isDark ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"} position="bottom">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-surface dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? 'sun' : 'moon'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark
                      ? <Sun className="w-5 h-5 text-amber-400" />
                      : <Moon className="w-5 h-5 text-primary" />
                    }
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </Tooltip>

            {user ? (
              <>
                {/* Credits Chip */}
                <Tooltip content="Your Credit Balance (Click to view rules)" position="bottom">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    onClick={() => setShowCreditInfo(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-600 dark:text-amber-400 font-bold text-xs transition-all duration-200 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{user.credits ?? 100}</span>
                    <span className="text-amber-500/60">Credits</span>
                    <Info className="w-3 h-3 opacity-60" />
                  </motion.button>
                </Tooltip>

                {/* User Menu */}
                <div className="relative">
                  <Tooltip content="User Account & Options Menu" position="bottom">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setUserMenuOpen(o => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-primary/40 hover:bg-surface dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-white text-xs font-bold flex items-center justify-center">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-foreground hidden sm:block max-w-[80px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>
                  </Tooltip>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-background dark:bg-zinc-900 border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => { setShowCreditInfo(true); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Coins className="w-4 h-4" />
                            {user.credits ?? 100} Credits
                          </button>
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm font-medium transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Tooltip content="Register for a new SkillBridge account" position="bottom">
                <Link
                  to="/auth/register"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-emerald-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Get Started
                </Link>
              </Tooltip>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Credit Info Modal ── */}
      <AnimatePresence>
        {showCreditInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={(e) => e.target === e.currentTarget && setShowCreditInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-background dark:bg-zinc-900 border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreditInfo(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Credit System</h3>
                  <p className="text-xs text-muted-foreground">How teaching & learning credits work</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl"
                >
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    🎓 Gain Credits by Teaching
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                    Offer a skill → receive <strong className="text-emerald-500">+10 Credits</strong> instantly!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                  className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-xl"
                >
                  <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    📖 Spend Credits to Learn
                  </p>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 space-y-1.5">
                    {[
                      { level: 'Beginner Skill', cost: '5 Credits', color: 'bg-green-500' },
                      { level: 'Intermediate Skill', cost: '10 Credits', color: 'bg-blue-500' },
                      { level: 'Expert Skill', cost: '20 Credits', color: 'bg-purple-500' },
                    ].map(item => (
                      <div key={item.level} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          {item.level}
                        </span>
                        <span className="font-bold">{item.cost}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="p-3 bg-amber-500/8 dark:bg-amber-500/5 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 border border-amber-500/15"
                >
                  💡 New users start with <strong className="text-amber-500">100 Credits</strong>. Teach more to earn more!
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreditInfo(false)}
                className="mt-5 w-full py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white font-bold rounded-xl hover:shadow-md hover:shadow-primary/30 transition-all duration-200 cursor-pointer"
              >
                Got it! ✨
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
