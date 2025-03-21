
import React, { useState } from 'react';
import { Users, Link, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncState } from '@/lib/types';
import { toast } from 'sonner';

interface PlayTogetherProps {
  syncState: SyncState;
  onToggleSync: () => void;
  onShareLink: () => void;
}

const PlayTogether: React.FC<PlayTogetherProps> = ({
  syncState,
  onToggleSync,
  onShareLink
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="glass-panel p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center">
          <Users size={20} className="text-white/80 mr-3" />
          <h3 className="text-white font-medium">Play Together</h3>
        </div>
        <div className="flex items-center">
          {syncState.isConnected && (
            <div className="flex items-center mr-3">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full mr-1",
                  syncState.partnerOnline ? "bg-green-500" : "bg-orange-500"
                )}
              ></div>
              <span className="text-white/70 text-sm">
                {syncState.partnerOnline ? "Connected" : "Connecting..."}
              </span>
            </div>
          )}
          <svg 
            className={cn(
              "w-4 h-4 text-white/70 transition-transform duration-300",
              isExpanded ? "transform rotate-180" : ""
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 animate-fade-in">
          <p className="text-white/70 text-sm mb-4">
            Sync your music with a friend and listen together in real-time.
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              className={cn(
                "glass-button px-4 py-2 flex items-center justify-center",
                syncState.isSyncing ? "bg-blue-500/30 text-white" : ""
              )}
              onClick={onToggleSync}
            >
              {syncState.isConnected ? (
                syncState.isSyncing ? (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Syncing
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="mr-2" />
                    Resume Sync
                  </>
                )
              ) : (
                <>
                  <Users size={18} className="mr-2" />
                  Connect & Sync
                </>
              )}
            </button>
            
            {syncState.isConnected && (
              <button
                className="glass-button px-4 py-2 flex items-center justify-center"
                onClick={onShareLink}
              >
                <Link size={18} className="mr-2" />
                Share Link
              </button>
            )}
          </div>
          
          {syncState.isConnected && syncState.isSyncing && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white/90 text-sm">
                <span className="font-medium">Syncing active!</span> When you change songs or pause/play, your partner will experience the same.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayTogether;
