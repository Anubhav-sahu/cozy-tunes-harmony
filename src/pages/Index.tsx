import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSongSync } from '@/hooks/useSongSync';
import { useChat } from '@/hooks/useChat';
import { useViewStateSync } from '@/hooks/useViewStateSync';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { ViewState } from '@/lib/types';
import { songService } from '@/lib/supabase';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import LandingPage from '@/components/LandingPage';
import FullscreenBackground from '@/components/FullscreenBackground';
import MusicInterface from '@/components/MusicInterface';

const Index = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(5);
  const [darknessAmount, setDarknessAmount] = useState(50);
  const { user, loading } = useAuth();
  
  const initialViewState: ViewState = {
    isFullscreenBackground: false
  };
  
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
    shareSyncLink,
    connectToRoom
  } = useSongSync(
    songs,
    currentSongIndex,
    playbackState,
    selectSong,
    togglePlay,
    seek
  );
  
  const {
    notifications,
    addNotification,
    removeNotification
  } = useNotifications();
  
  const {
    messages,
    sendMessage,
    clearChat
  } = useChat(syncState.roomId);
  
  const {
    viewState,
    toggleFullscreenBackground
  } = useViewStateSync(syncState, initialViewState);
  
  const currentSong = getCurrentSong();
  
  useEffect(() => {
    if (user) {
      const loadSongs = async () => {
        try {
          const songsData = await songService.getSongs();
          songsData.forEach(song => {
            addSong(song);
          });
          toast.success('Loaded your saved songs');
        } catch (error) {
          console.error('Failed to load songs:', error);
          toast.error('Failed to load songs');
        }
      };
      
      loadSongs();
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const savedRoomId = localStorage.getItem('syncRoomId');
      if (savedRoomId) {
        connectToRoom(savedRoomId);
        localStorage.removeItem('syncRoomId');
        toast.success('Joined music room successfully!');
      }
    }
  }, [user]);
  
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.sender === 'partner') {
        addNotification({
          message: `New message: ${message.text}`,
          type: 'info'
        });
      }
    };
    
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      handleNewMessage(latestMessage);
    }
  }, [messages.length]);
  
  const handleBackgroundChange = async (url: string | null) => {
    setBackgroundImage(url);
    
    if (user && url) {
      localStorage.setItem('background_image', url);
    } else if (!url) {
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
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (viewState.isFullscreenBackground) {
    return (
      <AppLayout
        backgroundImage={backgroundImage}
        blurAmount={blurAmount}
        darknessAmount={darknessAmount}
        notifications={notifications}
        onDismissNotification={removeNotification}
      >
        <FullscreenBackground 
          isPlaying={playbackState.isPlaying}
          onTogglePlay={togglePlay}
          onExitFullscreen={toggleFullscreenBackground}
          currentSongTitle={currentSong?.title}
        />
      </AppLayout>
    );
  }
  
  if (!user) {
    return (
      <AppLayout
        backgroundImage={backgroundImage}
        blurAmount={blurAmount}
        darknessAmount={darknessAmount}
        notifications={notifications}
        onDismissNotification={removeNotification}
      >
        <LandingPage />
      </AppLayout>
    );
  }
  
  return (
    <AppLayout
      backgroundImage={backgroundImage}
      blurAmount={blurAmount}
      darknessAmount={darknessAmount}
      notifications={notifications}
      onDismissNotification={removeNotification}
    >
      <MusicInterface 
        songs={songs}
        playbackState={playbackState}
        currentSongIndex={currentSongIndex}
        syncState={syncState}
        messages={messages}
        backgroundImage={backgroundImage}
        blurAmount={blurAmount}
        darknessAmount={darknessAmount}
        viewState={viewState}
        getCurrentSong={getCurrentSong}
        play={play}
        pause={pause}
        togglePlay={togglePlay}
        playNext={playNext}
        playPrevious={playPrevious}
        seek={seek}
        setVolume={setVolume}
        toggleMute={toggleMute}
        toggleShuffle={toggleShuffle}
        toggleRepeat={toggleRepeat}
        addSong={addSong}
        removeSong={removeSong}
        selectSong={selectSong}
        toggleFavorite={toggleFavorite}
        toggleSync={toggleSync}
        shareSyncLink={shareSyncLink}
        connectToRoom={connectToRoom}
        sendMessage={sendMessage}
        clearChat={clearChat}
        toggleFullscreenBackground={toggleFullscreenBackground}
        onBackgroundChange={handleBackgroundChange}
        onBlurChange={handleBlurChange}
        onDarknessChange={handleDarknessChange}
      />
    </AppLayout>
  );
};

export default Index;
