
import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, Share2, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Song } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffled: boolean;
  isRepeating: boolean;
  isMuted: boolean;
  volume: number;
  isSyncing: boolean;
  unreadMessages: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleFavorite: () => void;
  onToggleSync: () => void;
  onToggleChat: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  isShuffled,
  isRepeating,
  isMuted,
  volume,
  isSyncing,
  unreadMessages,
  onTogglePlay,
  onSeek,
  onPrevious,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onToggleMute,
  onVolumeChange,
  onToggleFavorite,
  onToggleSync,
  onToggleChat,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Format the current time and duration
  const formattedCurrentTime = formatTime(currentTime);
  const formattedDuration = formatTime(duration);
  
  // Calculate progress percentage
  const progressPercent = duration > 0 
    ? (isDragging ? dragProgress : (currentTime / duration) * 100) 
    : 0;
  
  // Handle progress bar interaction
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setDragProgress(percentage * 100);
  };
  
  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percentage * duration;
    onSeek(newTime);
    setIsDragging(false);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    onVolumeChange(newVolume);
  };
  
  // Auto-hide volume slider after 3 seconds of inactivity
  useEffect(() => {
    if (showVolumeSlider) {
      const timeoutId = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [showVolumeSlider]);
  
  return (
    <div className="glass-panel p-6 w-full max-w-lg mx-auto">
      {/* Song Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-white text-xl font-semibold truncate">
            {currentSong?.title || 'No song selected'}
          </h2>
          <p className="text-white/70 text-sm truncate">
            {currentSong?.artist || 'Select a song to play'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className={cn(
              "rounded-full p-2 transition-all duration-300 relative",
              currentSong?.favorite
                ? "text-red-500 bg-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={onToggleFavorite}
            disabled={!currentSong}
            title="Favorite"
          >
            <Heart size={18} fill={currentSong?.favorite ? "#ef4444" : "none"} />
          </button>
          
          <button 
            className={cn(
              "rounded-full p-2 transition-all duration-300",
              isSyncing
                ? "text-blue-400 bg-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={onToggleSync}
            title={isSyncing ? "Syncing with partner" : "Play together"}
          >
            <Share2 size={18} />
          </button>
          
          <button 
            className={cn(
              "rounded-full p-2 transition-all duration-300 relative",
              "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={onToggleChat}
            title="Chat"
          >
            <MessageCircle size={18} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        className="h-2 bg-white/10 rounded-full cursor-pointer mb-2 relative"
        onClick={handleProgressBarClick}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full absolute top-0 left-0 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Time Display */}
      <div className="flex justify-between text-xs text-white/60 mb-4">
        <span>{formattedCurrentTime}</span>
        <span>{formattedDuration}</span>
      </div>
      
      {/* Player Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isShuffled 
                ? "text-blue-400 bg-white/20" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={onToggleShuffle}
            title={isShuffled ? "Shuffle on" : "Shuffle off"}
          >
            <Shuffle size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            onClick={onPrevious}
            disabled={!currentSong}
            title="Previous"
          >
            <SkipBack size={24} />
          </button>
          
          <button
            className="glow-button bg-white/20 hover:bg-white/30 w-14 h-14 rounded-full flex items-center justify-center text-white animate-pulse-glow"
            onClick={onTogglePlay}
            disabled={!currentSong}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
          </button>
          
          <button
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            onClick={onNext}
            disabled={!currentSong}
            title="Next"
          >
            <SkipForward size={24} />
          </button>
        </div>
        
        <div className="flex items-center">
          <button
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isRepeating 
                ? "text-blue-400 bg-white/20" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={onToggleRepeat}
            title={isRepeating ? "Repeat on" : "Repeat off"}
          >
            <Repeat size={20} />
          </button>
        </div>
      </div>
      
      {/* Volume Control */}
      <div className="flex items-center mt-4">
        <button
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
          onClick={onToggleMute}
          onMouseEnter={() => setShowVolumeSlider(true)}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        
        {showVolumeSlider && (
          <div 
            className="ml-2 flex-1 max-w-[100px] h-5 flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="w-full h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
