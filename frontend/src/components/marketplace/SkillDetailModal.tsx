// src/components/marketplace/SkillDetailModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { X, Coins, User, Tag, BookOpen, Send, CheckCircle2, AlertCircle, Sparkles, Award, MapPin, Globe, Compass } from 'lucide-react';
import { MapView, LocationData } from './MapView';

export interface Skill {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: 'offered' | 'wanted';
  proficiency: string;
  cost?: number;
  mode?: 'Online' | 'Offline' | 'Both';
  location?: LocationData;
  userName?: string;
  user: string;
  tags?: string[];
}

interface SkillDetailModalProps {
  skill: Skill;
  onClose: () => void;
  onOpenSwap?: (skill: Skill) => void;
  onSkillUpdated?: () => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onOpenSwap,
}) => {
  const { user, updateUserCredits } = useAuth();
  const [learning, setLearning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate cost if not provided
  const cost = skill.cost || (skill.proficiency === 'Beginner' ? 5 : skill.proficiency === 'Expert' ? 20 : 10);
  const mode = skill.mode || 'Both';

  const handleLearnSkill = async () => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Please log in to learn this skill.' });
      return;
    }

    const effectiveCredits = user.credits ?? 100;
    if (effectiveCredits < cost) {
      setFeedback({
        type: 'error',
        message: `Insufficient credits! You need ${cost} credits, but currently have ${effectiveCredits}. Teach skills to earn more!`,
      });
      return;
    }

    setLearning(true);
    setFeedback(null);
    try {
      const res = await api.post(`/skills/${skill._id}/learn`);
      const { remainingCredits, message } = res.data;
      updateUserCredits(remainingCredits);
      setFeedback({
        type: 'success',
        message: message || `Enrolled successfully! ${cost} credits deducted.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to learn skill.',
      });
    } finally {
      setLearning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-background dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              skill.type === 'offered'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
            }`}
          >
            {skill.type === 'offered' ? 'Offering to Teach' : 'Seeking to Learn'}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
              mode === 'Online'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300'
                : mode === 'Offline'
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300'
            }`}
          >
            {mode === 'Online' ? <Globe className="w-3 h-3" /> : mode === 'Offline' ? <MapPin className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
            {mode === 'Online' ? 'Online Only' : mode === 'Offline' ? 'Offline Learning' : 'Online & Offline'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> {skill.proficiency} Level
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {cost} Credits Required
          </span>
        </div>

        {/* Skill Title */}
        <h2 className="text-2xl font-extrabold text-foreground mb-2">{skill.title}</h2>

        {/* Teacher Info */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-surface p-2.5 rounded-lg border border-border">
          <User className="w-4 h-4 text-primary" />
          <span>Posted by: <strong className="text-foreground">{skill.userName || 'Community Member'}</strong></span>
          <span className="mx-1">•</span>
          <span className="text-primary font-medium">{skill.category}</span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2.5 font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* Detailed Description */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-primary" /> Detailed Description
          </h4>
          <p className="text-sm text-foreground opacity-90 leading-relaxed bg-background/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-border whitespace-pre-line">
            {skill.description}
          </p>
        </div>

        {/* Offline Map Component if Offline or Both */}
        {(mode === 'Offline' || mode === 'Both') && (
          <div className="mb-5">
            <MapView location={skill.location} />
          </div>
        )}

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topic Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-1 font-medium border border-primary/20"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Your Credits: <strong className="text-amber-500 font-bold">{user?.credits ?? 100}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {user?.id !== skill.user && onOpenSwap && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSwap(skill);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Swap Skill
              </button>
            )}

            {user?.id !== skill.user && skill.type === 'offered' && (
              <button
                type="button"
                onClick={handleLearnSkill}
                disabled={learning}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                {learning ? 'Processing...' : `Learn Skill (${cost} Credits)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
