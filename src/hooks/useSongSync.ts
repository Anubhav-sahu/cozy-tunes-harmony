
import { useEffect, useState, useRef } from 'react';
import { SyncState, Song, PlaybackState } from '@/lib/types';
import { toast } from 'sonner';
import { syncService, songService } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSongSync = (
  songs: Song[],
  currentSongIndex: number,
  playbackState: PlaybackState,
  playSong: (index: number) => void,
  togglePlay: () => void,
  seek: (time: number) => void,
  addSong: (song: Song) => void
) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    partnerOnline: false,
    roomId: null,
    isSyncing: false,
  });
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Connect to a specific room
  const connectToRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Please sign in to use the sync feature');
      return null;
    }
    
    try {
      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        roomId,
        isSyncing: true,
      }));
      
      // Save to localStorage for reconnection after page refresh
      localStorage.setItem('syncRoomId', roomId);
      
      // Simulate partner connection
      setTimeout(() => {
        setSyncState(prev => ({
          ...prev,
          partnerOnline: true,
        }));
        toast.success('Connected with partner! You can now sync music.');
      }, 1000);
      
      // Start sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      syncIntervalRef.current = setInterval(() => {
        if (syncState.isSyncing && syncState.roomId) {
          syncPlayback();
        }
      }, 1000); // Sync every second
      
      // Load shared songs from partner
      loadSharedSongs(roomId);
      
      return roomId;
    } catch (error) {
      console.error('Failed to connect to room:', error);
      toast.error('Failed to connect to room');
      return null;
    }
  };
  
  // Load shared songs from the partner
  const loadSharedSongs = async (roomId: string) => {
    try {
      const sharedSongs = await songService.getSharedSongs(roomId);
      
      // Filter out songs that are already in the local collection
      const existingIds = new Set(songs.map(song => song.id));
      const newSongs = sharedSongs.filter(song => !existingIds.has(song.id));
      
      if (newSongs.length > 0) {
        // Add the partner's songs to local collection
        for (const song of newSongs) {
          addSong(song);
        }
        
        toast.success(`Loaded ${newSongs.length} songs from your partner`);
      }
    } catch (error) {
      console.error('Failed to load shared songs:', error);
      toast.error('Failed to load shared songs');
    }
  };
  
  const disconnectFromPartner = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    setSyncState({
      isConnected: false,
      partnerOnline: false,
      roomId: null,
      isSyncing: false,
    });
    
    // Remove from localStorage
    localStorage.removeItem('syncRoomId');
    
    toast.info('Disconnected from partner');
  };
  
  const toggleSync = () => {
    if (!user) {
      toast.error('Please sign in to use the sync feature');
      return;
    }
    
    if (syncState.isConnected) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: !prev.isSyncing,
      }));
      
      if (!syncState.isSyncing) {
        toast.success('Music syncing enabled');
        // Immediately sync the current playback
        syncPlayback();
      } else {
        toast.info('Music syncing paused');
      }
    } else {
      toast.info('Please select a connection first');
    }
  };
  
  const syncPlayback = async () => {
    if (!syncState.isSyncing || !syncState.roomId || !user) return;
    
    try {
      await syncService.updatePlaybackState(syncState.roomId, {
        isPlaying: playbackState.isPlaying,
        currentTime: playbackState.currentTime,
        duration: playbackState.duration,
        volume: playbackState.volume,
        isMuted: playbackState.isMuted,
        isShuffled: playbackState.isShuffled,
        isRepeating: playbackState.isRepeating,
        currentSongIndex, // Use the parameter
      });
    } catch (error) {
      console.error('Failed to sync playback state:', error);
    }
  };
  
  // Listen for changes from partner
  useEffect(() => {
    if (!syncState.isSyncing || !syncState.roomId || !user) return;
    
    const subscription = syncService.subscribeToPlaybackState(syncState.roomId, (newPlaybackState) => {
      // Update song selection
      if (songs.length > 0 && newPlaybackState.currentSongIndex !== undefined && 
          newPlaybackState.currentSongIndex !== currentSongIndex) {
        playSong(newPlaybackState.currentSongIndex);
        toast.info('Partner changed the song');
      }
      
      // Update playback state
      if (newPlaybackState.isPlaying !== playbackState.isPlaying) {
        togglePlay();
      }
      
      // Only seek if the time difference is significant (more than 3 seconds)
      const timeDiff = Math.abs(newPlaybackState.currentTime - playbackState.currentTime);
      if (timeDiff > 3) {
        seek(newPlaybackState.currentTime);
      }
    });
    
    return () => {
      subscription.unsubscribe();
      
      // Clean up sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [
    syncState.isSyncing,
    syncState.roomId,
    currentSongIndex,
    playbackState.isPlaying,
    playbackState.currentTime,
    user
  ]);
  
  // Share the current sync link
  const shareSyncLink = () => {
    if (!syncState.roomId) {
      toast.error('No active connection to share');
      return;
    }
    
    // Create a join link
    const syncLink = `${window.location.origin}/join/${syncState.roomId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(syncLink).then(() => {
      toast.success('Sync link copied to clipboard! Share it with your partner.');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link. Please try again.');
    });
  };
  
  return {
    syncState,
    connectToRoom,
    disconnectFromPartner,
    toggleSync,
    shareSyncLink,
  };
};
