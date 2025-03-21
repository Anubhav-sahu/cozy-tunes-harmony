
import React, { useState, useEffect } from 'react';
import { Users, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncState } from '@/lib/types';
import { toast } from 'sonner';

interface FloatingPlayTogetherProps {
  syncState: SyncState;
  onToggleSync: () => void;
}

const FloatingPlayTogether: React.FC<FloatingPlayTogetherProps> = ({
  syncState,
  onToggleSync
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Add pulse animation when the sync state changes
  useEffect(() => {
    if (syncState.isSyncing || syncState.isConnected) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [syncState.isSyncing, syncState.isConnected]);
  
  return (
    <button
      className={cn(
        "fixed bottom-20 right-8 z-40 p-3 rounded-full shadow-lg backdrop-blur-md",
        "border border-white/20 transition-all duration-300",
        syncState.isSyncing
          ? "bg-blue-500/50 text-white hover:bg-blue-500/70"
          : "bg-white/20 text-white/80 hover:bg-white/30 hover:text-white",
        isAnimating && "animate-pulse"
      )}
      onClick={onToggleSync}
      title={syncState.isSyncing ? "Playing Together (Click to Stop)" : "Play Together"}
    >
      <div className="relative">
        {syncState.isSyncing && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
        {syncState.isConnected && !syncState.isSyncing && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
        )}
        <Users size={24} />
      </div>
    </button>
  );
};

export default FloatingPlayTogether;
