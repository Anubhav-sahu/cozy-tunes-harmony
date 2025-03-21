
import { useRef, useState, useEffect } from 'react';
import { Song, PlaybackState } from '@/lib/types';
import { toast } from 'sonner';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    isShuffled: false,
    isRepeating: false,
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set initial volume
      audioRef.current.volume = playbackState.volume;
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleSongEnd);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('error', handleAudioError);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleSongEnd);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, []);

  // Update audio source when current song changes
  useEffect(() => {
    if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
      const song = songs[currentSongIndex];
      if (audioRef.current) {
        audioRef.current.src = song.src;
        if (playbackState.isPlaying) {
          audioRef.current.play().catch(e => {
            console.error('Failed to play audio:', e);
            setPlaybackState(prev => ({ ...prev, isPlaying: false }));
            toast.error('Failed to play song. Please try again.');
          });
        }
      }
    }
  }, [currentSongIndex, songs]);

  // Update playback state based on isPlaying
  useEffect(() => {
    if (audioRef.current) {
      if (playbackState.isPlaying) {
        audioRef.current.play().catch(e => {
          console.error('Failed to play audio:', e);
          setPlaybackState(prev => ({ ...prev, isPlaying: false }));
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [playbackState.isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playbackState.isMuted ? 0 : playbackState.volume;
    }
  }, [playbackState.volume, playbackState.isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        duration: audioRef.current?.duration || 0,
      }));
    }
  };

  const handleSongEnd = () => {
    if (playbackState.isRepeating) {
      // Repeat the current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else {
      // Play next song
      playNext();
    }
  };

  const handleAudioError = (error: any) => {
    console.error('Audio error:', error);
    toast.error('Error playing the song. Please try another song.');
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  // Player controls
  const play = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
  };

  const pause = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  const togglePlay = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const playNext = () => {
    if (songs.length === 0) return;
    
    if (playbackState.isShuffled) {
      // Play a random song (excluding current)
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && nextIndex === currentSongIndex);
      
      setCurrentSongIndex(nextIndex);
    } else {
      // Play next song in order
      setCurrentSongIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= songs.length) {
          return 0; // Loop back to first song
        }
        return nextIndex;
      });
    }
  };

  const playPrevious = () => {
    if (songs.length === 0) return;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // If current playback time > 3 seconds, restart the song
      audioRef.current.currentTime = 0;
    } else {
      // Play previous song
      setCurrentSongIndex((prev) => {
        const prevIndex = prev - 1;
        if (prevIndex < 0) {
          return songs.length - 1; // Loop to last song
        }
        return prevIndex;
      });
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlaybackState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const setVolume = (volume: number) => {
    setPlaybackState(prev => ({ ...prev, volume }));
  };

  const toggleMute = () => {
    setPlaybackState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleShuffle = () => {
    setPlaybackState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  };

  const toggleRepeat = () => {
    setPlaybackState(prev => ({ ...prev, isRepeating: !prev.isRepeating }));
  };

  const addSong = (song: Song) => {
    setSongs(prev => [...prev, song]);
    
    // If this is the first song, select it
    if (songs.length === 0) {
      setCurrentSongIndex(0);
    }
    
    toast.success(`Added "${song.title}" to your playlist`);
  };

  const removeSong = (songId: string) => {
    setSongs(prev => {
      const index = prev.findIndex(s => s.id === songId);
      if (index === -1) return prev;
      
      const newSongs = [...prev];
      newSongs.splice(index, 1);
      
      // Adjust current index if needed
      if (currentSongIndex === index) {
        // Current song is being removed
        if (newSongs.length === 0) {
          // No songs left
          setCurrentSongIndex(-1);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          setPlaybackState(prev => ({ ...prev, isPlaying: false }));
        } else if (currentSongIndex >= newSongs.length) {
          // Current index is now out of bounds
          setCurrentSongIndex(0);
        }
      } else if (currentSongIndex > index) {
        // Adjust index for songs after the removed one
        setCurrentSongIndex(prev => prev - 1);
      }
      
      return newSongs;
    });
  };

  const selectSong = (index: number) => {
    if (index >= 0 && index < songs.length) {
      setCurrentSongIndex(index);
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const toggleFavorite = (songId: string) => {
    setSongs(prev => 
      prev.map(song => 
        song.id === songId 
          ? { ...song, favorite: !song.favorite } 
          : song
      )
    );
  };

  const getCurrentSong = (): Song | null => {
    if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
      return songs[currentSongIndex];
    }
    return null;
  };

  return {
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
    toggleFavorite,
  };
};
