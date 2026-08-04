import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, User, CheckCheck, Paperclip, Image as ImageIcon, FileText, MapPin, Contact as ContactIcon, X } from 'lucide-react';

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
  attachment?: {
    type: 'image' | 'document' | 'location' | 'contact';
    data: string;
    metadata?: any;
  };
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

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

  const sendPayload = (contentStr: string, attach?: ChatMessage['attachment']) => {
    if (!user) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMsg: ChatMessage = {
      _tempId: tempId,
      sender: user.id,
      receiver: partnerId,
      senderName: user.name,
      content: contentStr || (attach ? 'Shared an attachment' : ''),
      attachment: attach,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const payload = {
      sender: user.id,
      receiver: partnerId,
      senderName: user.name,
      content: optimisticMsg.content,
      attachment: attach,
      roomId,
    };
    socketRef.current?.emit('send_message', payload);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      sendPayload('', {
        type,
        data: reader.result as string,
        metadata: { filename: file.name, size: file.size }
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendPayload('', {
          type: 'location',
          data: `${position.coords.latitude},${position.coords.longitude}`
        });
        setShowAttachMenu(false);
      },
      () => {
        alert('Unable to retrieve your location. Please check browser permissions.');
      }
    );
  };

  const handleShareContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    sendPayload('', {
      type: 'contact',
      data: contactName.trim(),
      metadata: { phone: contactPhone.trim() }
    });
    setShowContactModal(false);
    setShowAttachMenu(false);
    setContactName('');
    setContactPhone('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendPayload(inputMsg.trim());
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
                  {msg.attachment && (
                    <div className="mb-2 max-w-full">
                      {msg.attachment.type === 'image' && (
                        <img src={msg.attachment.data} alt="attachment" className="max-w-full h-auto rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-border" onClick={() => window.open(msg.attachment!.data, '_blank')} />
                      )}
                      {msg.attachment.type === 'document' && (
                        <a href={msg.attachment.data} download={msg.attachment.metadata?.filename} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary/10 text-primary hover:bg-primary/20'} transition-colors border border-current/10`}>
                          <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{msg.attachment.metadata?.filename || 'Document'}</span>
                        </a>
                      )}
                      {msg.attachment.type === 'location' && (
                        <a href={`https://maps.google.com/?q=${msg.attachment.data}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'} transition-colors border border-current/10`}>
                          <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate">View Live Location</span>
                        </a>
                      )}
                      {msg.attachment.type === 'contact' && (
                        <div className={`flex flex-col gap-1 p-2.5 rounded-lg text-xs border border-current/10 ${isMe ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'}`}>
                          <div className="flex items-center gap-1.5 font-bold"><ContactIcon className="w-4 h-4 shrink-0" /> <span className="truncate">{msg.attachment.data}</span></div>
                          <div className="opacity-90 pl-5.5 truncate">{msg.attachment.metadata?.phone}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.content && msg.content !== 'Shared an attachment' && <p>{msg.content}</p>}
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
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 items-end relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="h-[36px] w-[36px] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border shadow-xl rounded-xl p-2 z-50 flex flex-col gap-1">
              <button type="button" onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface rounded-lg text-left font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Image / Media
              </button>
              <button type="button" onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface rounded-lg text-left font-medium">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Document (PDF)
              </button>
              <button type="button" onClick={handleShareLocation} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface rounded-lg text-left font-medium">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> Live Location
              </button>
              <button type="button" onClick={() => { setShowContactModal(true); setShowAttachMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface rounded-lg text-left font-medium">
                <ContactIcon className="w-3.5 h-3.5 text-purple-500" /> Contact Share
              </button>
            </div>
          )}
        </div>
        
        {/* Hidden File Inputs */}
        <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
        <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />

        <input
          type="text"
          placeholder="Type a message..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e as any); }}
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-xs h-[36px]"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim()}
          className="px-4 h-[36px] bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Contact Share Modal */}
      {showContactModal && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleShareContact} className="bg-card border border-border p-5 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><ContactIcon className="w-4 h-4 text-purple-500" /> Share Contact</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input type="text" autoFocus required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number</label>
                <input type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-md">Share</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
