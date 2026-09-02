import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const addToast = useCallback((title, message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, timestamp: new Date() }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('⚡ Connected to ResQ Real-Time WebSocket stream');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setLastMessage(payload);

          // Trigger high-visibility toast alerts based on event type
          if (payload.event === 'SOS_ALERT') {
            addToast(
              '🚨 CRITICAL SOS RECEIVED',
              `Distress call from ${payload.data.name} (${payload.data.phone}): ${payload.data.message}`,
              'danger',
              8000
            );
          } else if (payload.event === 'NEW_EMERGENCY') {
            addToast(
              `🆘 New Emergency: ${payload.data.type?.toUpperCase()}`,
              `${payload.data.address} - Severity: ${payload.data.severity}`,
              'warning',
              6000
            );
          } else if (payload.event === 'EMERGENCY_BROADCAST') {
            addToast(
              `📢 BROADCAST: ${payload.data.title}`,
              payload.data.message,
              'danger',
              10000
            );
          } else if (payload.event === 'WEATHER_ALERT') {
            addToast(
              `🌧️ Hazard Alert: ${payload.data.location}`,
              `${payload.data.level} - ${payload.data.description}`,
              'warning',
              6000
            );
          } else if (payload.event === 'ASSIGNMENT_CREATED') {
            addToast(
              '📋 Team Dispatched',
              `${payload.data.target_name} assigned to Emergency #${payload.data.emergency_id}`,
              'info',
              5000
            );
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket encountered error, reconnecting...', err);
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [addToast]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastMessage,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
