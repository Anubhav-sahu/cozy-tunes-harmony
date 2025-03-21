
import React, { useState, useEffect } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import SongList from '@/components/SongList';
import UploadSong from '@/components/UploadSong';
import PlayTogether from '@/components/PlayTogether';
import ChatBubble from '@/components/ChatBubble';
import BackgroundUpload from '@/components/BackgroundUpload';
import FloatingPlayTogether from '@/components/FloatingPlayTogether';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSongSync } from '@/hooks/useSongSync';
import { useChat } from '@/hooks/useChat';
import { Song } from '@/lib/types';
import { toast } from 'sonner';

const Index = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(5);
  const [darknessAmount, setDarknessAmount] = useState(50);
  
  const {
    songs,
    playbackState,
    currentSongIndex,
    getCurrentSong,
    play,
    pause,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    addSong,
    removeSong,
    selectSong,
    toggleFavorite
  } = useAudioPlayer();
  
  const {
    syncState,
    toggleSync,
    shareSyncLink
  } = useSongSync(
    songs,
    currentSongIndex,
    playbackState,
    selectSong,
    togglePlay,
    seek
  );
  
  const {
    messages,
    isChatOpen,
    unreadCount,
    sendMessage,
    toggleChat,
    clearChat
  } = useChat(syncState.roomId);
  
  const currentSong = getCurrentSong();
  
  // Try to load background from localStorage
  useEffect(() => {
    const savedBackground = localStorage.getItem('background_image');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
    
    const savedBlur = localStorage.getItem('background_blur');
    if (savedBlur) {
      setBlurAmount(Number(savedBlur));
    }
    
    const savedDarkness = localStorage.getItem('background_darkness');
    if (savedDarkness) {
      setDarknessAmount(Number(savedDarkness));
    }
    
    // Also try to load songs from localStorage
    const savedSongs = localStorage.getItem('songs');
    if (savedSongs) {
      try {
        const parsedSongs = JSON.parse(savedSongs) as Song[];
        parsedSongs.forEach(song => {
          addSong(song);
        });
        toast.success('Loaded your saved songs');
      } catch (e) {
        console.error('Failed to load songs:', e);
      }
    }
  }, []);
  
  // Save songs to localStorage when they change
  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem('songs', JSON.stringify(songs));
    }
  }, [songs]);
  
  const handleToggleFavorite = () => {
    if (currentSong) {
      toggleFavorite(currentSong.id);
    }
  };
  
  const handleSelectSong = (index: number) => {
    selectSong(index);
  };
  
  const handleRemoveSong = (id: string) => {
    removeSong(id);
  };
  
  const handleSongFavorite = (id: string) => {
    toggleFavorite(id);
  };
  
  const handleBackgroundChange = (url: string | null) => {
    setBackgroundImage(url);
    if (url) {
      localStorage.setItem('background_image', url);
    } else {
      localStorage.removeItem('background_image');
    }
  };
  
  const handleBlurChange = (value: number) => {
    setBlurAmount(value);
    localStorage.setItem('background_blur', value.toString());
  };
  
  const handleDarknessChange = (value: number) => {
    setDarknessAmount(value);
    localStorage.setItem('background_darkness', value.toString());
  };
  
  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      {/* Background image */}
      <div className="bg-image-container">
        {backgroundImage ? (
          <img 
            src={backgroundImage} 
            alt="Background" 
            className="bg-image"
            style={{ filter: `blur(${blurAmount}px)` }}
          />
        ) : (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] w-full h-full"></div>
        )}
        <div 
          className="bg-overlay"
          style={{ 
            background: `rgba(0,0,0,${darknessAmount / 100})` 
          }}
        ></div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">
            Together<span className="text-blue-400">Play</span>
          </h1>
          <p className="text-white/70">Share music moments together</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Music Player */}
            <MusicPlayer
              currentSong={currentSong}
              isPlaying={playbackState.isPlaying}
              currentTime={playbackState.currentTime}
              duration={playbackState.duration}
              isShuffled={playbackState.isShuffled}
              isRepeating={playbackState.isRepeating}
              isMuted={playbackState.isMuted}
              volume={playbackState.volume}
              isSyncing={syncState.isSyncing}
              unreadMessages={unreadCount}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onPrevious={playPrevious}
              onNext={playNext}
              onToggleShuffle={toggleShuffle}
              onToggleRepeat={toggleRepeat}
              onToggleMute={toggleMute}
              onVolumeChange={setVolume}
              onToggleFavorite={handleToggleFavorite}
              onToggleSync={toggleSync}
              onToggleChat={toggleChat}
            />
            
            {/* Song List */}
            <SongList
              songs={songs}
              currentSongIndex={currentSongIndex}
              isPlaying={playbackState.isPlaying}
              onSelectSong={handleSelectSong}
              onRemoveSong={handleRemoveSong}
              onToggleFavorite={handleSongFavorite}
            />
            
            {/* Upload Button */}
            <div className="flex justify-center">
              <UploadSong onSongUpload={addSong} />
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Play Together */}
            <PlayTogether
              syncState={syncState}
              onToggleSync={toggleSync}
              onShareLink={shareSyncLink}
            />
            
            {/* Background Customization */}
            <BackgroundUpload
              onBackgroundChange={handleBackgroundChange}
              onBlurChange={handleBlurChange}
              onDarknessChange={handleDarknessChange}
              blur={blurAmount}
              darkness={darknessAmount}
            />
          </div>
        </div>
      </div>
      
      {/* Floating Play Together Button */}
      <FloatingPlayTogether 
        syncState={syncState}
        onToggleSync={toggleSync}
      />
      
      {/* Chat Bubble */}
      <ChatBubble
        isOpen={isChatOpen}
        messages={messages}
        unreadCount={unreadCount}
        onToggleChat={toggleChat}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
      />
    </div>
  );
};

export default Index;
