import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { 
  X, Send, MessageSquare, ArrowLeft, Circle, 
  Clock, Shield, User, Info, MoreVertical, 
  Check, CheckCheck, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ChatPanel = ({ onClose, initialUserId = null }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { sendMessage, addListener, isConnected } = useWebSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    
    // Listen for new messages
    const unsubscribe = addListener((data) => {
      if (data.type === 'new_message' || data.type === 'message_sent') {
        // If message belongs to current conversation, add it
        if (selectedUser && (String(data.message.sender_id) === String(selectedUser.user_id) || String(data.message.receiver_id) === String(selectedUser.user_id))) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update conversations list to show last message
        fetchConversations();
      }
    });

    return () => unsubscribe();
  }, [addListener, selectedUser]);

  useEffect(() => {
    if (initialUserId) {
      const fetchInitialUser = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/users/${initialUserId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setSelectedUser({
            user_id: response.data.id,
            user_name: response.data.name,
            user_role: response.data.role,
            profile_photo: response.data.profile_photo
          });
        } catch (error) {
          console.error('Failed to fetch initial user:', error);
        }
      };
      fetchInitialUser();
    }
  }, [initialUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConversations(response.data);
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error(parseApiError(error, 'Failed to load message history'));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Send via WebSocket if connected
    if (isConnected) {
      sendMessage(selectedUser.user_id, messageContent);
      // Wait for WebSocket response or optimistic update
      // For now, assume WebSocket context will trigger listener
    } else {
      // Fallback to HTTP
      try {
        const response = await axios.post(`${API_URL}/api/messages`, {
          receiver_id: selectedUser.user_id,
          content: messageContent,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessages(prev => [...prev, response.data]);
        fetchConversations();
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error(parseApiError(error, 'Failed to send message'));
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_URL}/${path}`;
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString(language === 'hi' ? 'hi-IN' : (language === 'or' ? 'or-IN' : 'en-IN'), { month: 'long', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  }, [messages, language]);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-50 bg-[#0A0A0C] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-slide-in flex flex-col">
      {/* Header Overhaul */}
      <div className="p-4 border-b border-white/10 bg-[#121215]/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center justify-between">
          {selectedUser ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="hover:bg-white/5 rounded-full text-white/50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-white/10 shadow-lg">
                  <AvatarImage src={getPhotoUrl(selectedUser.profile_photo)} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {selectedUser.user_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isConnected && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#121215] animate-pulse shadow-sm" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-tight">{selectedUser.user_name}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-1.5 h-4 border-none ${
                    selectedUser.user_role === 'employer' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedUser.user_role}
                  </Badge>
                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <Circle className={`w-1.5 h-1.5 fill-current ${isConnected ? 'text-green-500' : 'text-white/20'}`} />
                    {isConnected ? t('online_now') : t('offline')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white tracking-tighter uppercase italic">{t('secure_chat')}</CardTitle>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('encrypted')}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-500/10 hover:text-red-500 rounded-full text-white/30 transition-all">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedUser ? (
          /* Premium Chat View */
          <>
            <ScrollArea className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
              <div className="space-y-8 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center relative">
                      <MessageSquare className="w-10 h-10 text-white/10" />
                      <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-white/80 font-bold">{t('start_journey')}</p>
                      <p className="text-xs text-white/40 max-w-[200px] mt-2">{t('chat_desc')}</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex items-center justify-center">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 whitespace-nowrap">
                          {date === new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : (language === 'or' ? 'or-IN' : 'en-IN'), { month: 'long', day: 'numeric', year: 'numeric' }) ? t('today_label') : date}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      
                      {msgs.map((msg, index) => {
                        const isSelf = 
                          (msg.sender_id && user?.id && String(msg.sender_id) === String(user.id)) ||
                          (msg.sender_id && user?._id && String(msg.sender_id) === String(user._id)) ||
                          (msg.sender_id && user?.user_id && String(msg.sender_id) === String(user.user_id));
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: isSelf ? 20 : -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`group relative max-w-[85%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] ${
                                  isSelf
                                    ? `bg-gradient-to-br ${user.role === 'employer' ? 'from-emerald-500 to-teal-600 shadow-emerald-500/20' : 'from-blue-600 to-indigo-700 shadow-blue-500/20'} text-white rounded-br-none`
                                    : 'bg-[#1E1E22] text-white/90 border border-white/5 rounded-bl-none backdrop-blur-sm'
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                              </div>
                              <div className={`mt-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter ${
                                isSelf ? 'text-white/30' : 'text-white/30'
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isSelf && (
                                  <span className="flex items-center">
                                    <CheckCheck className="w-3 h-3 text-primary" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Premium Glass Input Area */}
            <div className="p-4 bg-[#121215] border-t border-white/10 pb-8">
              <form onSubmit={handleSendMessage} className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/20 transition-all" />
                <div className="relative flex items-center gap-3 bg-[#1E1E22] border border-white/10 rounded-2xl p-1 shadow-2xl focus-within:border-primary/50 transition-all">
                  <Input
                    placeholder={`${t('message')}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/20 text-sm py-6 pl-4"
                    data-testid="chat-input"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim()} 
                    className={`rounded-xl h-11 w-11 shadow-lg transition-all ${
                       newMessage.trim() 
                       ? (user.role === 'employer' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-primary hover:bg-primary/90 text-white') 
                       : 'bg-white/5 text-white/20'
                    }`}
                    data-testid="send-message-btn"
                  >
                    <Send className={`w-5 h-5 ${newMessage.trim() ? 'animate-in zoom-in' : ''}`} />
                  </Button>
                </div>
              </form>
              <p className="text-[9px] text-center mt-3 font-bold uppercase tracking-widest text-white/10">{t('press_enter')}</p>
            </div>
          </>
        ) : (
          /* Conversations List Overhaul */
          <ScrollArea className="flex-1 bg-[#0A0A0C]">
            <div className="px-6 py-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">{t('recent_conv')}</h4>
               {loading ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-white/40 text-sm font-bold">{t('active_threads')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUser(conv)}
                      className="w-full p-4 rounded-2xl bg-[#121215] hover:bg-[#1E1E22] border border-white/5 hover:border-white/10 transition-all flex items-center gap-4 group"
                      data-testid={`conversation-${conv.user_id}`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12 border border-white/5 shadow-md">
                          <AvatarImage src={getPhotoUrl(conv.profile_photo)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                            {conv.user_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-[#0A0A0C]">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-white group-hover:text-primary transition-colors truncate tracking-tight">{conv.user_name}</p>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-tighter">
                             {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </p>
                        </div>
                        <p className="text-xs text-white/40 truncate font-medium">{conv.last_message || 'Start a conversation'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

// Simple Chevron Icon locally for convenience
const ChevronRight = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default ChatPanel;
