
import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSongSync } from '@/hooks/useSongSync';
import { useChat } from '@/hooks/useChat';
import { useViewStateSync } from '@/hooks/useViewStateSync';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { ViewState, Notification, Song } from '@/lib/types';
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
    seek,
    addSong
  );
  
  const {
    notifications,
    addNotification,
    removeNotification
  } = useNotifications();
  
  const {
    messages,
    unreadCount,
    sendMessage,
    clearChat,
    markAllAsRead
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
          if (songsData.length > 0) {
            songsData.forEach(song => {
              addSong(song as Song);
            });
            
            toast.success('Loaded your saved songs');
          }
        } catch (error) {
          console.error('Failed to load songs:', error);
          toast.error('Failed to load songs');
        }
      };
      
      loadSongs();
      
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
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const savedRoomId = localStorage.getItem('syncRoomId');
      if (savedRoomId) {
        connectToRoom(savedRoomId);
        toast.success('Joined music room successfully!');
      }
      
      const joinRoomId = sessionStorage.getItem('joinRoomAfterAuth');
      if (joinRoomId) {
        connectToRoom(joinRoomId);
        sessionStorage.removeItem('joinRoomAfterAuth');
        toast.success('Joined shared music room!');
      }
    }
  }, [user]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === 'partner') {
        addNotification({
          type: 'info',
          message: `New message: ${latestMessage.text}`,
          autoHide: true
        });
      }
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
  
  const handleSongUpload = async (song: any) => {
    if (user) {
      try {
        const songWithUser = {
          ...song,
          addedAt: Date.now(),
          user_id: user.id
        };
        
        addSong(songWithUser);
        
        if (!song.src.startsWith('blob:')) {
          await songService.addSong(songWithUser);
        }
        
        if (syncState.isConnected && syncState.partnerOnline) {
          toast.success("Song added and shared with your partner");
        }
      } catch (error) {
        console.error('Error saving song:', error);
        toast.error('Failed to save song');
      }
    } else {
      addSong(song);
    }
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
        addSong={handleSongUpload}
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
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
      />
    </AppLayout>
  );
};

export default Index;
