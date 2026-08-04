import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../ui/Tooltip';
import { Search, Filter, Sparkles, User, Tag, Send, CheckCircle2, AlertCircle, Coins, Eye, MapPin, Globe, Compass, BookOpen } from 'lucide-react';
import { SkillDetailModal, Skill } from './SkillDetailModal';
import { AISkillMatcher } from '../ai/AISkillMatcher';

interface Props {
  onPostClick: () => void;
}

export const ExploreMarketplace: React.FC<Props> = ({ onPostClick }) => {
  const { user: currentUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [proposalMsg, setProposalMsg] = useState('');
  const [onlyLearn, setOnlyLearn] = useState(false);
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categories = ['All', 'Technology', 'Design', 'Languages', 'Music', 'Business', 'Lifestyle'];

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'All') params.category = category;
      if (modeFilter !== 'All') params.mode = modeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/skills', { params });
      setSkills(res.data);
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [category, modeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSkills();
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;

    setSubmittingSwap(true);
    setSwapFeedback(null);

    try {
      const res = await api.post('/swaps', {
        targetSkillId: selectedSkill._id,
        skillId: selectedSkill._id,
        targetUserId: selectedSkill.user,
        offeredSkillTitle: 'Skill Exchange Proposal',
        requestedSkillTitle: selectedSkill.title,
        message: proposalMsg || `Hi! I would love to swap skills regarding "${selectedSkill.title}".`,
        onlyLearn: onlyLearn,
      });

      setSwapFeedback({
        type: 'success',
        message: res.data?.message || 'Proposal sent successfully!',
      });

      setTimeout(() => {
        setSelectedSkill(null);
        setProposalMsg('');
        setSwapFeedback(null);
      }, 2000);
    } catch (err: any) {
      setSwapFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit proposal.',
      });
    } finally {
      setSubmittingSwap(false);
    }
  };

  const getCost = (skill: Skill) => {
    if (skill.cost) return skill.cost;
    if (skill.proficiency === 'Beginner') return 5;
    if (skill.proficiency === 'Expert') return 20;
    return 10;
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Sparkles className="w-6 h-6 text-amber-500" /> Explore Community Skill Marketplace
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect with community members online or offline with location maps. Earn credits by teaching!
          </p>
        </div>
        <Tooltip content="Publish a new skill listing & earn +10 Credits" position="left">
          <button
            onClick={onPostClick}
            className="btn-cyber rounded-xl"
          >
            + Post a Skill (+10 Credits)
          </button>
        </Tooltip>
      </div>

      {/* Search & Category / Mode Filter Bar */}
      <div className="p-4 glass rounded-2xl space-y-4 shadow-sm border border-border">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search skills by title, technology, city, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-foreground outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <Tooltip content="Search marketplace listings" position="top">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-light transition-colors cursor-pointer"
            >
              Search
            </button>
          </Tooltip>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Mode Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-bold text-muted-foreground">Mode:</span>
            {['All', 'Online', 'Offline'].map((m) => (
              <Tooltip key={m} content={`Filter listings by ${m} mode`} position="top">
                <button
                  onClick={() => setModeFilter(m)}
                  className={`px-3 py-1 rounded-xl border transition-all font-semibold cursor-pointer ${
                    modeFilter === m
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface hover:bg-surface/80 text-foreground border-border'
                  }`}
                >
                  {m}
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-bold text-muted-foreground shrink-0">Category:</span>
            {categories.map((cat) => (
              <Tooltip key={cat} content={`Show ${cat} skills`} position="top">
                <button
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-xl border transition-all shrink-0 font-semibold cursor-pointer ${
                    category === cat
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface hover:bg-surface/80 text-foreground border-border'
                  }`}
                >
                  {cat}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {!loading && skills.length > 0 && (
        <AISkillMatcher
          skills={skills}
          onPropose={(skill: Skill) => {
            setSelectedSkill(skill);
            setOnlyLearn(false);
            setProposalMsg(`Hi ${skill.userName || ''}! I noticed your listing for "${skill.title}" and would love to propose a skill exchange with you.`);
          }}
        />
      )}

      {/* Skills Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading marketplace skills...</div>
      ) : skills.length === 0 ? (
        <div className="py-12 text-center glass rounded-2xl p-8 border border-dashed border-border">
          <p className="text-lg font-bold text-foreground">No skills found matching your query.</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to post a skill in this category!</p>
          <button
            onClick={onPostClick}
            className="mt-4 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-light transition-colors cursor-pointer"
          >
            Post a Skill Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => {
            const cost = getCost(skill);
            const mode = skill.mode || 'Both';
            return (
              <div
                key={skill._id}
                onClick={() => setDetailSkill(skill)}
                className="glass rounded-2xl p-5 border border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer group relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          skill.type === 'offered'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {skill.type === 'offered' ? 'Offering' : 'Seeking'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                          mode === 'Online'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : mode === 'Offline'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {mode === 'Online' ? <Globe className="w-2.5 h-2.5" /> : mode === 'Offline' ? <MapPin className="w-2.5 h-2.5" /> : <Compass className="w-2.5 h-2.5" />}
                        {mode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground bg-surface border border-border px-2 py-0.5 rounded-md">
                        {skill.proficiency}
                      </span>

                      <Tooltip content={`Course enrollment cost: ${cost} Credits`} position="top">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Coins className="w-3 h-3 text-amber-500" />
                          {cost} Cr
                        </span>
                      </Tooltip>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {skill.title}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {skill.userName || 'Community Member'}
                    </span>

                    {skill.location?.city && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {skill.location.city}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip content="View full skill details & location map" position="top" className="flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailSkill(skill);
                        }}
                        className="w-full py-2 bg-surface hover:bg-surface/80 border border-border text-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </Tooltip>

                    {currentUser && currentUser.email !== (skill as any).userEmail && (
                      <>
                        <Tooltip content="Propose a 1-on-1 skill exchange" position="top" className="flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSkill(skill);
                              setOnlyLearn(false);
                              setProposalMsg(`Hi ${skill.userName || ''}! I noticed your listing for "${skill.title}" and would love to propose a skill exchange with you.`);
                            }}
                            className="btn-cyber w-full rounded-xl"
                            style={{ '--border-color': 'linear-gradient(-45deg, #0d9488, #34d399, #06b6d4)' } as any}
                          >
                            <Send className="w-3.5 h-3.5" /> Swap
                          </button>
                        </Tooltip>

                        <Tooltip content="Propose to only learn this skill" position="top" className="flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSkill(skill);
                              setOnlyLearn(true);
                              setProposalMsg(`Hi ${skill.userName || ''}! I noticed your listing for "${skill.title}" and would love to learn this from you.`);
                            }}
                            className="btn-cyber w-full rounded-xl"
                            style={{ '--border-color': 'linear-gradient(-45deg, #3b82f6, #6366f1, #8b5cf6)' } as any}
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Learn
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Swap Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Propose Skill Swap
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Proposing a swap with <strong className="text-foreground">{selectedSkill.userName}</strong> for{' '}
              <span className="text-primary font-semibold">"{selectedSkill.title}"</span>.
            </p>

            {swapFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                  swapFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}
              >
                {swapFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{swapFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Message to Mentor:</label>
                <textarea
                  value={proposalMsg}
                  onChange={(e) => setProposalMsg(e.target.value)}
                  rows={3}
                  placeholder="Introduce yourself and mention what skills you can offer in return..."
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="onlyLearn"
                  checked={onlyLearn}
                  onChange={(e) => setOnlyLearn(e.target.checked)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="onlyLearn" className="text-sm text-foreground">
                  Only learn (don’t teach)
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSkill(null);
                    setOnlyLearn(false);
                  }}
                  className="px-4 py-2 bg-surface hover:bg-surface/80 border border-border text-foreground font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSwap}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-emerald-500 text-white font-bold text-xs rounded-xl hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingSwap ? 'Sending...' : 'Send Proposal ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skill Detail Modal */}
      {detailSkill && (
        <SkillDetailModal
          skill={detailSkill}
          onClose={() => setDetailSkill(null)}
          onOpenSwap={(s: Skill) => {
            setDetailSkill(null);
            setSelectedSkill(s);
            setProposalMsg(`Hi ${s.userName || ''}! I noticed your listing for "${s.title}" and would love to propose a skill exchange with you.`);
          }}
        />
      )}
    </div>
  );
};
