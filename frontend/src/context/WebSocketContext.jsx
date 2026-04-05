import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const listenersRef = useRef(new Set());

  const connect = useCallback(() => {
    if (!token || wsRef.current) return;

    const wsUrl = "wss://api.shramsetu.in";
    const ws = new WebSocket(`${wsUrl}/ws/${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
      listenersRef.current.forEach(listener => listener(data));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (isAuthenticated) connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, connect]);

  const sendMessage = useCallback((receiverId, content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        receiver_id: receiverId,
        content: content
      }));
    }
  }, []);

  const addListener = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        messages,
        sendMessage,
        addListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
