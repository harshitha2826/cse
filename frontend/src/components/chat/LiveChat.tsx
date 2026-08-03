import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, User } from 'lucide-react';

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
}

export const LiveChat: React.FC<LiveChatProps> = ({ partnerId, partnerName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const roomId = [user?.id, partnerId].sort().join('_');

  useEffect(() => {
    // Connect Socket.io
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.emit('join_room', roomId);

    socketRef.current.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Fetch message history from backend REST API
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${partnerId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch message history:', err);
      }
    };

    fetchHistory();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !user) return;

    const payload = {
      sender: user.id,
      receiver: partnerId,
      senderName: user.name,
      content: inputMsg,
      roomId,
    };

    // Emit live message via Socket.io
    socketRef.current?.emit('send_message', payload);
    setInputMsg('');
  };

  return (
    <div className="glass rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-[500px] shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-surface rounded-t-xl">
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{partnerName}</h3>
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Socket.io Live Chat Active
          </span>
        </div>
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
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none shadow-sm'
                      : 'bg-surface text-foreground border border-gray-200 dark:border-gray-800 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
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
          className="flex-1 px-3 py-2 border rounded-lg bg-background dark:bg-background-dark outline-none focus:ring-2 focus:ring-primary text-xs"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
