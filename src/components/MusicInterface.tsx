
import React from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import SongList from '@/components/SongList';
import UploadSong from '@/components/UploadSong';
import PlayTogether from '@/components/PlayTogether';
import ChatSection from '@/components/ChatSection';
import BackgroundUpload from '@/components/BackgroundUpload';
import FloatingPlayTogether from '@/components/FloatingPlayTogether';
import { Song, SyncState, ChatMessage, PlaybackState } from '@/lib/types';

interface MusicInterfaceProps {
  songs: Song[];
  playbackState: PlaybackState;
  currentSongIndex: number;
  syncState: SyncState;
  messages: ChatMessage[];
  backgroundImage: string | null;
  blurAmount: number;
  darknessAmount: number;
  viewState: { isFullscreenBackground: boolean };
  getCurrentSong: () => Song | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addSong: (song: Song) => void;
  removeSong: (id: string) => void;
  selectSong: (index: number) => void;
  toggleFavorite: (id: string) => void;
  toggleSync: () => void;
  shareSyncLink: () => void;
  connectToRoom: (roomId: string) => void;
  sendMessage: (text: string) => void;
  clearChat: () => void;
  toggleFullscreenBackground: () => void;
  onBackgroundChange: (url: string | null) => void;
  onBlurChange: (value: number) => void;
  onDarknessChange: (value: number) => void;
}

const MusicInterface: React.FC<MusicInterfaceProps> = ({
  songs,
  playbackState,
  currentSongIndex,
  syncState,
  messages,
  backgroundImage,
  blurAmount,
  darknessAmount,
  viewState,
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
  toggleFavorite,
  toggleSync,
  shareSyncLink,
  connectToRoom,
  sendMessage,
  clearChat,
  toggleFullscreenBackground,
  onBackgroundChange,
  onBlurChange,
  onDarknessChange
}) => {
  const currentSong = getCurrentSong();
  
  const handleToggleFavorite = async () => {
    if (currentSong) {
      toggleFavorite(currentSong.id);
    }
  };
  
  const handleSelectSong = (index: number) => {
    selectSong(index);
  };
  
  const handleRemoveSong = async (id: string) => {
    removeSong(id);
  };
  
  const handleSongFavorite = async (id: string) => {
    toggleFavorite(id);
  };
  
  return (
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
            onSelectSong={selectSong}
            onRemoveSong={removeSong}
            onToggleFavorite={toggleFavorite}
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
            onSelectConnection={connectToRoom}
          />
          
          {/* Background Customization */}
          <BackgroundUpload
            onBackgroundChange={onBackgroundChange}
            onBlurChange={onBlurChange}
            onDarknessChange={onDarknessChange}
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
      
      {/* Floating Play Together Button */}
      <FloatingPlayTogether 
        syncState={syncState}
        onToggleSync={toggleSync}
      />
    </div>
  );
};

export default MusicInterface;
