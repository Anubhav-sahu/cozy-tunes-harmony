
import React from 'react';
import MinimizedPlayer from '@/components/MinimizedPlayer';

interface FullscreenBackgroundProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExitFullscreen: () => void;
  currentSongTitle: string | undefined;
}

const FullscreenBackground: React.FC<FullscreenBackgroundProps> = ({
  isPlaying,
  onTogglePlay,
  onExitFullscreen,
  currentSongTitle
}) => {
  return (
    <MinimizedPlayer 
      isPlaying={isPlaying}
      onTogglePlay={onTogglePlay}
      onExitFullscreen={onExitFullscreen}
      currentSongTitle={currentSongTitle}
    />
  );
};

export default FullscreenBackground;
