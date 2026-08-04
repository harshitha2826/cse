import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
  Award,
  BarChart2,
  CheckCircle2,
  CheckSquare,
  Clock,
  Plus,
  Save,
  Sparkles,
  Square,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';

export interface Milestone {
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface SwapProgressData {
  _id: string;
  learnerName: string;
  skillTitle: string;
  progress: number;
  progressStatus: 'In Progress' | 'Practicing' | 'Mastered';
  teacherNotes: string;
  milestones: Milestone[];
  lastUpdatedByTeacher?: string;
  isTeacherView: boolean;
}

interface LearnerProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: SwapProgressData | null;
  onProgressUpdated: () => void;
}

const DEFAULT_MILESTONES: string[] = [
  '🚀 Orientation & Skill Goals Defined',
  '📚 Core Concepts & Fundamental Modules',
  '💻 Practical Exercise / Hands-on Project',
  '🔍 Code & Practice Review',
  '🎓 Final Skill Verification & Mastery',
];

export const LearnerProgressModal: React.FC<LearnerProgressModalProps> = ({
  isOpen,
  onClose,
  swapData,
  onProgressUpdated,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'In Progress' | 'Practicing' | 'Mastered'>('In Progress');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (swapData) {
      setProgress(swapData.progress || 0);
      setStatus(swapData.progressStatus || 'In Progress');
      setNotes(swapData.teacherNotes || '');

      if (swapData.milestones && swapData.milestones.length > 0) {
        setMilestones(swapData.milestones);
      } else {
        // Populate default starter milestones
        setMilestones(
          DEFAULT_MILESTONES.map((title) => ({
            title,
            completed: false,
          }))
        );
      }
    }
  }, [swapData]);

  if (!isOpen || !swapData) return null;

  const handleToggleMilestone = (index: number) => {
    const updated = [...milestones];
    const item = updated[index];
    item.completed = !item.completed;
    if (item.completed) item.completedAt = new Date().toISOString();
    else item.completedAt = undefined;
    setMilestones(updated);

    // Automatically recalculate progress based on milestones completed
    const completedCount = updated.filter((m) => m.completed).length;
    const autoProgress = Math.round((completedCount / updated.length) * 100);
    setProgress(autoProgress);
    if (autoProgress >= 90) setStatus('Mastered');
    else if (autoProgress >= 50) setStatus('Practicing');
    else setStatus('In Progress');
  };

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { title: newMilestone.trim(), completed: false }]);
    setNewMilestone('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg(null);

    try {
      await api.patch(`/swaps/${swapData._id}/progress`, {
        progress,
        progressStatus: status,
        teacherNotes: notes,
        milestones,
      });

      setFeedbackMsg({
        type: 'success',
        text: 'Learner progress updated successfully!',
      });

      setTimeout(() => {
        onProgressUpdated();
        onClose();
        setFeedbackMsg(null);
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update progress.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-2xl bg-background dark:bg-zinc-900 border border-border rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="p-6 bg-gradient-to-r from-primary/15 via-emerald-500/10 to-teal-500/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center text-xl font-bold shadow-md">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {swapData.isTeacherView ? '👑 Teacher Assessment & Progress Manager' : '📖 Learner Progress & Roadmap'}
                </span>
                <h3 className="text-xl font-black text-foreground mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {swapData.skillTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Learner: <strong className="text-foreground">{swapData.learnerName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Form */}
          <form onSubmit={handleSaveProgress} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {feedbackMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {feedbackMsg.text}
              </div>
            )}

            {/* Progress Gauge Slider */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Overall Completion Progress
                </label>
                <span className="text-xl font-black text-primary">{progress}%</span>
              </div>

              {/* Visual Bar */}
              <div className="w-full bg-border/60 h-3 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
                />
              </div>

              {/* Interactive Slider */}
              {swapData.isTeacherView && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgress(val);
                    if (val >= 90) setStatus('Mastered');
                    else if (val >= 50) setStatus('Practicing');
                    else setStatus('In Progress');
                  }}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                />
              )}

              {/* Status Pills Selector */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground font-medium">Skill Proficiency Level:</span>
                {(['In Progress', 'Practicing', 'Mastered'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    disabled={!swapData.isTeacherView}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      status === s
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-background border border-border text-muted-foreground'
                    } ${!swapData.isTeacherView ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {s === 'Mastered' ? '🏆 Mastered' : s === 'Practicing' ? '⚡ Practicing' : '⏳ In Progress'}
                  </button>
                ))}
              </div>
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-500" /> Learning Roadmap & Milestones
                </h4>
                <span className="text-xs text-muted-foreground">
                  {milestones.filter((m) => m.completed).length} / {milestones.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => swapData.isTeacherView && handleToggleMilestone(idx)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      m.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-surface border-border text-foreground'
                    } ${swapData.isTeacherView ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-3">
                      {m.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-xs font-semibold ${m.completed ? 'line-through opacity-80' : ''}`}>
                        {m.title}
                      </span>
                    </div>

                    {swapData.isTeacherView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMilestone(idx);
                        }}
                        className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Milestone */}
              {swapData.isTeacherView && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom milestone (e.g. Completed Project 1)..."
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestone();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 border border-border rounded-xl bg-surface text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="px-3.5 py-2 bg-surface hover:bg-surface/80 border border-border text-foreground text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              )}
            </div>

            {/* Teacher Assessment Notes / Feedback */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-500" /> Teacher Assessment Notes & Feedback
              </label>
              <textarea
                rows={3}
                disabled={!swapData.isTeacherView}
                placeholder={
                  swapData.isTeacherView
                    ? 'Write feedback, homework, or recommendations for your student...'
                    : 'No feedback provided by teacher yet.'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3.5 border border-border rounded-2xl bg-surface text-xs text-foreground outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none disabled:opacity-80"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-border text-foreground text-xs font-bold rounded-xl hover:bg-surface transition-colors cursor-pointer"
              >
                Close
              </button>

              {swapData.isTeacherView && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer btn-glow-cyan disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving Progress...' : 'Update & Save Learner Progress'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
