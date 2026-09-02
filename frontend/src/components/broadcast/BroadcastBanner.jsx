import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useWebSocket } from '../../context/WebSocketContext';
import { Megaphone, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BroadcastBanner = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const { lastMessage } = useWebSocket();

  const fetchBroadcasts = async () => {
    try {
      const res = await axiosClient.get('/api/broadcasts/?active_only=true');
      setBroadcasts(res.data);
    } catch {
      // Ignored if offline
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  // Update when real-time broadcast arrives
  useEffect(() => {
    if (lastMessage?.event === 'EMERGENCY_BROADCAST') {
      fetchBroadcasts();
      setIsDismissed(false);
    }
  }, [lastMessage]);

  // Auto-rotate if multiple broadcasts
  useEffect(() => {
    if (broadcasts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % broadcasts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [broadcasts.length]);

  if (broadcasts.length === 0 || isDismissed) return null;

  const current = broadcasts[currentIndex] || broadcasts[0];

  return (
    <div className="bg-red-600 border-b border-red-700 text-white px-4 py-2 shadow-xs relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-800 text-white flex-shrink-0">
            <Megaphone className="w-3 h-3" />
          </span>
          <span className="font-bold uppercase tracking-wider text-red-100 text-[10px] px-1.5 py-0.5 rounded bg-red-700 hidden sm:inline">
            Official Broadcast
          </span>
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold truncate">{current.title}:</span>
            <span className="text-red-100 truncate">{current.message}</span>
            <span className="text-red-200 text-xs hidden md:inline">({current.target_area})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/broadcast"
            className="flex items-center gap-1 text-xs font-semibold text-white hover:bg-red-700 px-2 py-0.5 rounded transition-colors"
          >
            <span>All ({broadcasts.length})</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-red-100 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastBanner;
