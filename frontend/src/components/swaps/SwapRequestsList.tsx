import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Check, X, MessageSquare, Award, Clock, BarChart2 } from 'lucide-react';
import { LearnerProgressModal, SwapProgressData } from './LearnerProgressModal';
import { CertificateModal, CertificateData } from '../common/CertificateModal';

interface SwapRequestItem {
  _id: string;
  requester: string;
  provider: string;
  requesterName?: string;
  providerName?: string;
  offeredSkillTitle?: string;
  requestedSkillTitle?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  progress?: number;
  progressStatus?: 'In Progress' | 'Practicing' | 'Mastered';
  teacherNotes?: string;
  milestones?: any[];
  createdAt: string;
}

export const SwapRequestsList: React.FC<{ onOpenChat: (partnerId: string, partnerName: string) => void }> = ({ onOpenChat }) => {
  const { user, updateUserCredits } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [selectedProgressSwap, setSelectedProgressSwap] = useState<SwapProgressData | null>(null);
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/swaps');
      setSwaps(res.data);
    } catch (err) {
      console.error('Failed to fetch swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/swaps/${id}/status`, { status });
      
      // Update global user credits dynamically based on backend response
      if (updateUserCredits) {
        if (res.data.teacherCredits !== undefined && user?.id === res.data.swap?.provider) {
          updateUserCredits(res.data.teacherCredits);
        } else if (res.data.learnerCredits !== undefined && user?.id === res.data.swap?.requester) {
          updateUserCredits(res.data.learnerCredits);
        }
      }
      
      fetchSwaps();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const incomingSwaps = swaps.filter((s) => s.provider === user?.id || (s.requester !== user?.id && activeTab === 'incoming'));
  const outgoingSwaps = swaps.filter((s) => s.requester === user?.id);

  const displayedSwaps = activeTab === 'incoming' ? incomingSwaps : outgoingSwaps;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Skill Swap Proposals</h2>
          <p className="text-sm text-foreground opacity-80">
            Manage your skill exchange proposals, track status, and evaluate learner progress.
          </p>
        </div>
        <button
          onClick={fetchSwaps}
          className="p-2 border rounded-lg hover:bg-surface text-foreground transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'incoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-foreground'
          }`}
        >
          Incoming Proposals ({incomingSwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'outgoing'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-foreground'
          }`}
        >
          My Outgoing Proposals ({outgoingSwaps.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm opacity-60">Loading proposals...</div>
      ) : displayedSwaps.length === 0 ? (
        <div className="py-12 text-center glass rounded-xl p-8 border border-dashed border-gray-300 dark:border-gray-700">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-base font-medium text-foreground">No {activeTab} swap proposals yet.</p>
          <p className="text-xs text-foreground opacity-75 mt-1">
            Browse the marketplace and click "Swap Skill" on a listing to start exchanging!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedSwaps.map((swap) => {
            const partnerId = swap.requester === user?.id ? swap.provider : swap.requester;
            const partnerName = swap.requester === user?.id ? (swap.providerName || 'Partner') : (swap.requesterName || 'Partner');
            const isTeacher = swap.provider === user?.id;
            const isCompleted = swap.status === 'completed' || (swap.progress !== undefined && swap.progress >= 100);

            return (
              <div
                key={swap._id}
                className="glass rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        swap.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : swap.status === 'completed'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : swap.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {swap.status}
                    </span>

                    <span className="text-xs font-semibold text-foreground">
                      Target Skill: {swap.requestedSkillTitle || 'Skill Swap'}
                    </span>
                  </div>

                  <p className="text-sm text-foreground">
                    <strong className="text-primary">{partnerName}</strong>: "{swap.message}"
                  </p>

                  {swap.teacherNotes && (
                    <div className="p-2.5 bg-surface border border-border rounded-xl text-xs text-muted-foreground">
                      <strong className="text-purple-400">Teacher Notes:</strong> "{swap.teacherNotes}"
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Requested on: {new Date(swap.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {swap.status === 'pending' && swap.provider === user?.id && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'accepted')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'rejected')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {(swap.status === 'accepted' || swap.status === 'completed') && (
                    <>
                      <button
                        onClick={() => onOpenChat(partnerId, partnerName)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Live Chat
                      </button>

                      {/* Dedicated Teacher Progress Assessment Button */}
                      <button
                        onClick={() =>
                          setSelectedProgressSwap({
                            _id: swap._id,
                            learnerName: isTeacher ? (swap.requesterName || 'Learner') : (swap.providerName || 'Teacher'),
                            skillTitle: swap.requestedSkillTitle || 'Skill Swap',
                            progress: swap.progress || 0,
                            progressStatus: swap.progressStatus || 'In Progress',
                            teacherNotes: swap.teacherNotes || '',
                            milestones: swap.milestones || [],
                            isTeacherView: isTeacher,
                          })
                        }
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        {isTeacher ? 'Update Learner Progress 📊' : 'View Roadmap & Feedback 📊'}
                      </button>

                      {/* Verified Certificate Button */}
                      {swap.status === 'completed' && swap.progress === 100 && (
                        <button
                          onClick={() =>
                            setSelectedCert({
                              learnerName: swap.requesterName || user?.name || 'Learner Exchanger',
                              teacherName: swap.providerName || 'SkillBridge Mentor',
                              skillTitle: swap.requestedSkillTitle || 'Skill Exchange Mastery',
                              completedDate: new Date().toLocaleDateString(),
                              certId: `SB-CERT-${swap._id.slice(-6).toUpperCase()}`,
                            })
                          }
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 text-black font-extrabold rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
                        >
                          <Award className="w-3.5 h-3.5 text-black" />
                          🎓 Verified Certificate
                        </button>
                      )}

                      {swap.status === 'accepted' && (
                        <button
                          onClick={() => handleStatusUpdate(swap._id, 'completed')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" /> Complete Swap
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Management Modal */}
      <LearnerProgressModal
        isOpen={!!selectedProgressSwap}
        onClose={() => setSelectedProgressSwap(null)}
        swapData={selectedProgressSwap}
        onProgressUpdated={fetchSwaps}
      />

      {/* Verified Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        data={selectedCert}
      />
    </div>
  );
};
