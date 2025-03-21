
import React from 'react';
import { 
  Play, Pause, Music, Clock, Heart, Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Song } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface SongListProps {
  songs: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  onSelectSong: (index: number) => void;
  onRemoveSong: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const SongList: React.FC<SongListProps> = ({
  songs,
  currentSongIndex,
  isPlaying,
  onSelectSong,
  onRemoveSong,
  onToggleFavorite
}) => {
  if (songs.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <Music size={40} className="mx-auto mb-3 text-white/50" />
        <h3 className="text-white text-lg font-medium mb-2">Your playlist is empty</h3>
        <p className="text-white/70 text-sm">
          Upload some music to get started
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-2">
      <div className="mb-2 px-4 pt-3 pb-1 flex items-center text-white/60 text-xs font-medium">
        <div className="w-10 text-center">#</div>
        <div className="flex-1 pl-2">TITLE</div>
        <div className="w-8 mr-3"><Heart size={14} /></div>
        <div className="w-14 text-center"><Clock size={14} className="inline" /></div>
        <div className="w-8"></div>
      </div>
      
      <div className="max-h-80 overflow-y-auto px-2">
        {songs.map((song, index) => (
          <div 
            key={song.id}
            className={cn(
              "flex items-center p-2 rounded-md transition-all duration-300 group",
              currentSongIndex === index
                ? "bg-white/20"
                : "hover:bg-white/10"
            )}
          >
            {/* Song Number / Play Button */}
            <div className="w-10 text-center flex justify-center">
              {currentSongIndex === index && isPlaying ? (
                <button
                  className="text-white"
                  onClick={() => onSelectSong(index)}
                >
                  <Pause size={20} />
                </button>
              ) : (
                <button 
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    currentSongIndex === index ? "text-white" : "text-white/70"
                  )}
                  onClick={() => onSelectSong(index)}
                >
                  <Play size={20} />
                </button>
              )}
              
              <span 
                className={cn(
                  "group-hover:opacity-0 transition-opacity duration-300",
                  currentSongIndex === index ? "text-white" : "text-white/70"
                )}
              >
                {index + 1}
              </span>
            </div>
            
            {/* Song Title */}
            <div className="flex-1 pl-2">
              <div 
                className={cn(
                  "font-medium truncate",
                  currentSongIndex === index ? "text-white" : "text-white/90"
                )}
              >
                {song.title}
              </div>
              <div className="text-white/60 text-sm truncate">
                {song.artist}
              </div>
            </div>
            
            {/* Favorite Button */}
            <div className="w-8 mr-3">
              <button
                className={cn(
                  "transition-all duration-300",
                  song.favorite ? "text-red-500" : "text-white/40 hover:text-white/70"
                )}
                onClick={() => onToggleFavorite(song.id)}
                title={song.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={16} fill={song.favorite ? "#ef4444" : "none"} />
              </button>
            </div>
            
            {/* Duration */}
            <div className="w-14 text-center text-white/70">
              {formatTime(song.duration)}
            </div>
            
            {/* Remove Button */}
            <div className="w-8">
              <button
                className="text-white/40 hover:text-white/70 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                onClick={() => onRemoveSong(song.id)}
                title="Remove song"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongList;
