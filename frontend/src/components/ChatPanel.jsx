import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { X, Send, MessageSquare, ArrowLeft, Circle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatPanel = ({ onClose, initialUserId = null }) => {
  const { user } = useAuth();
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
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    });

    return () => unsubscribe();
  }, [addListener]);

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
      const response = await axios.get(`${API_URL}/api/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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
    } else {
      // Fallback to HTTP
      try {
        const response = await axios.post(`${API_URL}/api/messages`, {
          receiver_id: selectedUser.user_id,
          content: messageContent,
        });
        setMessages(prev => [...prev, response.data]);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-background border-l shadow-2xl animate-slide-in">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            {selectedUser ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-base">{selectedUser.user_name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">{selectedUser.user_role}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <CardTitle className="text-lg">Messages</CardTitle>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                <Circle className={`w-2 h-2 fill-current ${isConnected ? 'animate-pulse' : ''}`} />
                {isConnected ? 'Live' : 'Offline'}
              </span>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-chat-btn">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {selectedUser ? (
            /* Chat View */
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 ${
                            msg.sender_id === user.id
                              ? 'chat-bubble-sent'
                              : 'chat-bubble-received'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    data-testid="chat-input"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()} data-testid="send-message-btn">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Conversations List */
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Messages will appear here</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUser(conv)}
                      className="w-full p-3 rounded-lg hover:bg-muted transition-colors text-left flex items-center gap-3"
                      data-testid={`conversation-${conv.user_id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {conv.user_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.user_name}</p>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-primary text-primary-foreground">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPanel;
