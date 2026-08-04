import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, User, CheckCheck } from 'lucide-react';

interface LiveChatProps {
  partnerId: string;
  partnerName: string;
}

interface ChatMessage {
  _id?: string;
  sender: string;
  receiver: string;
  senderName?: string;
  content: string;
  createdAt?: string;
  _tempId?: string; // for optimistic messages
}

// Deduplicate messages by _id or _tempId
const deduplicateMessages = (msgs: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    const key = m._id || m._tempId || '';
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });
};

export const LiveChat: React.FC<LiveChatProps> = ({ partnerId, partnerName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Deterministic room: sort both IDs alphabetically
  const roomId = [user?.id, partnerId].sort().join('_');

  // Fetch message history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${partnerId}`);
      if (Array.isArray(res.data)) {
        setMessages(deduplicateMessages(res.data));
      }
    } catch (err) {
      console.error('Failed to fetch message history:', err);
    }
  }, [partnerId]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Disconnect any previous socket
    socketRef.current?.disconnect();

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join room after connect
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Replace optimistic message if tempId matches, otherwise just append
        const tempIdx = prev.findIndex(
          (m) => m._tempId && m.content === msg.content && m.sender === msg.sender
        );
        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = msg; // replace optimistic with real message
          return deduplicateMessages(updated);
        }
        return deduplicateMessages([...prev, msg]);
      });
    });

    // Load history
    fetchHistory();

    return () => {
      socket.disconnect();
    };
  }, [partnerId, roomId, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !user) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Optimistically add message to UI immediately
    const optimisticMsg: ChatMessage = {
      _tempId: tempId,
      sender: user.id,
      receiver: partnerId,
      senderName: user.name,
      content: inputMsg.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const payload = {
      sender: user.id,
      receiver: partnerId,
      senderName: user.name,
      content: inputMsg.trim(),
      roomId,
    };

    socketRef.current?.emit('send_message', payload);
    setInputMsg('');
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-[540px] shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-surface rounded-t-xl">
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">{partnerName}</h3>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isConnected ? 'Socket.io Live Chat Active' : 'Connecting…'}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground bg-surface px-2 py-1 rounded-lg border border-border">
          Room: {roomId.slice(0, 12)}…
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            No messages yet. Say hello to start your skill swap!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === user?.id;
            const isOptimistic = !!msg._tempId;
            return (
              <div key={msg._id || msg._tempId || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? `bg-primary text-white rounded-br-none shadow-sm ${isOptimistic ? 'opacity-70' : 'opacity-100'}`
                      : 'bg-surface text-foreground border border-gray-200 dark:border-gray-800 rounded-bl-none'
                  }`}
                >
                  {!isMe && msg.senderName && (
                    <p className="text-[10px] font-bold text-primary mb-0.5">{msg.senderName}</p>
                  )}
                  <p>{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] opacity-60">{formatTime(msg.createdAt)}</span>
                    {isMe && !isOptimistic && <CheckCheck className="w-3 h-3 opacity-60" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e as any); }}
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-xs"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
