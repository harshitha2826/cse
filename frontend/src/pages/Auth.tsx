// src/pages/Auth.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  CheckCircle2, AlertCircle, Zap, BookOpen, Repeat, Trophy
} from 'lucide-react';



const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type AuthFormData = {
  name?: string;
  email: string;
  password: string;
};

const floatingFeatures = [
  { icon: <BookOpen className="w-4 h-4" />, label: '100+ Skills', color: 'from-emerald-400 to-teal-500' },
  { icon: <Repeat className="w-4 h-4" />, label: 'Skill Swaps', color: 'from-blue-400 to-indigo-500' },
  { icon: <Trophy className="w-4 h-4" />, label: 'Earn XP', color: 'from-amber-400 to-orange-500' },
];

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({ resolver: zodResolver(authSchema) });

  const passwordValue = watch('password', '');
  const passwordStrength = passwordValue.length === 0 ? 0
    : passwordValue.length < 6 ? 1
    : passwordValue.length < 10 ? 2 : 3;

  const toggleMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setServerError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    reset();
  };

  const onSubmit: SubmitHandler<AuthFormData> = async (data) => {
    setServerError(null);
    setSuccessMsg(null);
    if (mode === 'register' && !data.name?.trim()) {
      setServerError('Name is required for registration.');
      return;
    }
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
        navigate('/dashboard');
      } else {
        const msg = await registerUser(data.name || '', data.email, data.password);
        setSuccessMsg(msg);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred. Please try again.';
      setServerError(msg);
    }
  };



  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/20 to-emerald-400/10 blur-[80px]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-purple-500/15 to-blue-500/10 blur-[80px]"
        />
      </div>

      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 lg:gap-0 items-center">
        {/* ── Left Panel (Hero copy) ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-center flex-1 pr-12 space-y-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-primary">Skill</span>Bridge
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-foreground leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {mode === 'login' ? 'Welcome back,' : 'Join the'}{' '}
              <span className="gradient-text">
                {mode === 'login' ? 'exchanger! 👋' : 'community! 🚀'}
              </span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {mode === 'login'
                ? 'Your skills are waiting. Sign in and continue your journey of learning and teaching.'
                : 'Start with 100 free credits. Trade what you know for what you want to learn. No money involved — just knowledge.'}
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {floatingFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${f.color} text-white text-sm font-semibold shadow-md`}
              >
                {f.icon}
                {f.label}
              </motion.div>
            ))}
          </div>

          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-4 bg-gradient-to-r from-primary/10 to-emerald-500/5 rounded-2xl border border-primary/20"
            >
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                🎁 Welcome Bonus: 100 Credits on signup!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use them to request skills from any community member instantly.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ── Auth Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 25 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
            {/* Mode Tabs */}
            <div className="flex p-2 bg-surface/50 dark:bg-zinc-800/50 m-4 rounded-2xl gap-1">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => toggleMode(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                    mode === m
                      ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'login' ? '👋 Sign In' : '✨ Register'}
                </button>
              ))}
            </div>

            <div className="px-7 pb-7">
              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mb-5"
                >
                  <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {mode === 'login' ? 'Sign into your account' : 'Create your account'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mode === 'login'
                      ? 'Enter your credentials to continue'
                      : 'Fill in the details below to get started'}
                  </p>
                </motion.div>
              </AnimatePresence>



              {/* Alerts */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {serverError}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider" htmlFor="name">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="name"
                          type="text"
                          placeholder="Alex Chen"
                          {...register('name')}
                          className="w-full pl-10 pr-4 py-3 bg-surface/60 dark:bg-zinc-800/60 border border-border dark:border-zinc-700 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 hover:border-primary/40 focus:border-primary"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.name.message}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                      className="w-full pl-10 pr-4 py-3 bg-surface/60 dark:bg-zinc-800/60 border border-border dark:border-zinc-700 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 hover:border-primary/40 focus:border-primary"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full pl-10 pr-10 py-3 bg-surface/60 dark:bg-zinc-800/60 border border-border dark:border-zinc-700 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 hover:border-primary/40 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength bar (register only) */}
                  {mode === 'register' && passwordValue.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(s => (
                          <div
                            key={s}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength >= s
                                ? s === 1 ? 'bg-red-400' : s === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                                : 'bg-border'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] font-medium ${
                        passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Moderate' : 'Strong'} password
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 btn-glow-cyan cursor-pointer ${
                    isSubmitting
                      ? 'opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-emerald-500 shadow-xl shadow-primary/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      {mode === 'login' ? 'Sign In' : 'Create Account – Free'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Switch Mode */}
              <p className="text-center text-sm text-muted-foreground mt-5">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => toggleMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary font-bold hover:underline"
                >
                  {mode === 'login' ? 'Register free' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center mt-5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors font-medium">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
