
import React, { useState, useEffect } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import SongList from '@/components/SongList';
import UploadSong from '@/components/UploadSong';
import PlayTogether from '@/components/PlayTogether';
import ChatSection from '@/components/ChatSection';
import BackgroundUpload from '@/components/BackgroundUpload';
import FloatingPlayTogether from '@/components/FloatingPlayTogether';
import MinimizedPlayer from '@/components/MinimizedPlayer';
import NotificationSystem from '@/components/NotificationSystem';
import Auth from '@/components/Auth';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSongSync } from '@/hooks/useSongSync';
import { useChat } from '@/hooks/useChat';
import { useViewStateSync } from '@/hooks/useViewStateSync';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Song, ViewState } from '@/lib/types';
import { songService, storageService } from '@/lib/supabase';
import { toast } from 'sonner';

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
  
  // Load songs from Supabase when authenticated
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
  
  // Save songs to Supabase when they change
  useEffect(() => {
    if (user && songs.length > 0) {
      // This would be optimized in a real implementation
      // to only save changed songs
    }
  }, [songs, user]);
  
  // Show notifications for new messages
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
  
  const handleToggleFavorite = async () => {
    if (currentSong && user) {
      try {
        await songService.toggleFavorite(currentSong.id, !currentSong.favorite);
        toggleFavorite(currentSong.id);
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        toast.error('Failed to update favorite status');
      }
    } else {
      toggleFavorite(currentSong?.id);
    }
  };
  
  const handleSelectSong = (index: number) => {
    selectSong(index);
  };
  
  const handleRemoveSong = async (id: string) => {
    if (user) {
      try {
        await songService.removeSong(id);
        removeSong(id);
      } catch (error) {
        console.error('Failed to remove song:', error);
        toast.error('Failed to remove song');
      }
    } else {
      removeSong(id);
    }
  };
  
  const handleSongFavorite = async (id: string) => {
    const song = songs.find(s => s.id === id);
    if (song && user) {
      try {
        await songService.toggleFavorite(id, !song.favorite);
        toggleFavorite(id);
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        toast.error('Failed to update favorite status');
      }
    } else {
      toggleFavorite(id);
    }
  };
  
  const handleSongUpload = async (song: Song) => {
    if (user) {
      try {
        // In a real implementation, we would upload the audio file to storage
        // and update the song.src with the public URL
        await songService.addSong(song);
        addSong(song);
      } catch (error) {
        console.error('Failed to upload song:', error);
        toast.error('Failed to upload song');
      }
    } else {
      addSong(song);
    }
  };
  
  const handleBackgroundChange = async (url: string | null) => {
    setBackgroundImage(url);
    
    if (user && url) {
      // In a real implementation, we would save the user's background preference
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
  
  // If still loading auth state, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If not authenticated, show auth page
  if (!user) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden relative">
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
        
        <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter">
              Together<span className="text-blue-400">Play</span>
            </h1>
            <p className="text-white/70">Share music moments together</p>
          </header>
          
          <Auth />
        </div>
      </div>
    );
  }
  
  // If in fullscreen background mode, only show minimal UI
  if (viewState.isFullscreenBackground) {
    return (
      <div className="min-h-screen w-full overflow-hidden relative">
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
        
        {/* Notification System */}
        <NotificationSystem 
          notifications={notifications} 
          onDismiss={removeNotification} 
        />
        
        {/* Minimized Player Control */}
        <MinimizedPlayer 
          isPlaying={playbackState.isPlaying}
          onTogglePlay={togglePlay}
          onExitFullscreen={toggleFullscreenBackground}
          currentSongTitle={currentSong?.title}
        />
      </div>
    );
  }
  
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
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onDismiss={removeNotification} 
      />
      
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
              unreadMessages={0}
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
              onToggleChat={() => {}}
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
          
          <div className="flex flex-col gap-6 h-full">
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
              onToggleFullscreen={toggleFullscreenBackground}
              isFullscreenMode={viewState.isFullscreenBackground}
            />
            
            {/* Chat Section */}
            <div className="flex-1 min-h-[400px]">
              <ChatSection
                messages={messages}
                onSendMessage={sendMessage}
                onClearChat={clearChat}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Play Together Button */}
      <FloatingPlayTogether 
        syncState={syncState}
        onToggleSync={toggleSync}
      />
    </div>
  );
};

export default Index;
