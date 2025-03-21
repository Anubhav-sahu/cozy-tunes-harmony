
import React from 'react';
import { Play, Pause, Music, Maximize, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinimizedPlayerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExitFullscreen: () => void;
  currentSongTitle: string | undefined;
}

const MinimizedPlayer: React.FC<MinimizedPlayerProps> = ({
  isPlaying,
  onTogglePlay,
  onExitFullscreen,
  currentSongTitle
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 glass-panel py-2 px-4 
                rounded-full shadow-lg flex items-center gap-3 z-50 animate-fade-in">
      <button
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <div className="flex items-center gap-2">
        <Music size={16} className="text-white/80" />
        <span className="text-white text-sm font-medium max-w-[200px] truncate">
          {currentSongTitle || 'No song playing'}
        </span>
      </div>
      
      <button
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center ml-2",
          "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
        )}
        onClick={onExitFullscreen}
        title="Show All Components"
      >
        <Eye size={16} />
      </button>
    </div>
  );
};

export default MinimizedPlayer;
