import React, { useEffect, useState } from 'react';
import { Clock, PauseCircle, PlayCircle } from 'lucide-react';

interface TimeTrackerProps {
  isActive: boolean;
  totalSeconds: number;
  onTick: () => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ isActive, totalSeconds, onTick }) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: number | undefined;
    if (isActive) {
      interval = window.setInterval(onTick, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, onTick]);

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono font-medium text-lg">{formatTime(totalSeconds)}</span>
      <div className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold">
        {isActive ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Tracking
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            Paused
          </>
        )}
      </div>
    </div>
  );
};
