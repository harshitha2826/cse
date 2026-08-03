import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Check, X, MessageSquare, Award, Clock } from 'lucide-react';

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
  createdAt: string;
}

export const SwapRequestsList: React.FC<{ onOpenChat: (partnerId: string, partnerName: string) => void }> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

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
      await api.patch(`/swaps/${id}/status`, { status });
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
            Manage your skill exchange proposals and track exchange status.
          </p>
        </div>
        <button
          onClick={fetchSwaps}
          className="p-2 border rounded-lg hover:bg-surface text-foreground transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'incoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-foreground'
          }`}
        >
          Incoming Proposals ({incomingSwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
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

            return (
              <div
                key={swap._id}
                className="glass rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        swap.status === 'accepted'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : swap.status === 'completed'
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : swap.status === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
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
                  <p className="text-[11px] text-gray-400">
                    Requested on: {new Date(swap.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {swap.status === 'pending' && swap.provider === user?.id && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'accepted')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'rejected')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {swap.status === 'accepted' && (
                    <>
                      <button
                        onClick={() => onOpenChat(partnerId, partnerName)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Live Chat
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'completed')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" /> Complete Swap
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
