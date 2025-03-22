
import { useEffect, useState, useRef } from 'react';
import { SyncState, Song, PlaybackState } from '@/lib/types';
import { toast } from 'sonner';
import { syncService } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSongSync = (
  songs: Song[],
  currentSongIndex: number,
  playbackState: PlaybackState,
  playSong: (index: number) => void,
  togglePlay: () => void,
  seek: (time: number) => void
) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    partnerOnline: false,
    roomId: null,
    isSyncing: false,
  });
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Simulate connection with partner
  const connectWithPartner = async () => {
    if (!user) {
      toast.error('Please sign in to use the sync feature');
      return null;
    }
    
    try {
      // Create a new sync room in the database
      const room = await syncService.createSyncRoom(user.id);
      const roomId = room.id;
      
      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        roomId,
        isSyncing: true,
      }));
      
      // Check for partner online status (simulated for now)
      setTimeout(() => {
        setSyncState(prev => ({
          ...prev,
          partnerOnline: true,
        }));
        toast.success('Connected with partner! You can now sync music.');
      }, 1500);
      
      // Start sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      syncIntervalRef.current = setInterval(() => {
        if (syncState.isSyncing && syncState.roomId) {
          syncPlayback();
        }
      }, 1000); // Sync every second
      
      return roomId;
    } catch (error) {
      console.error('Failed to create sync room:', error);
      toast.error('Failed to create sync room');
      return null;
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
      connectWithPartner();
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
        currentSongIndex: currentSongIndex, // Use the parameter instead of accessing it from playbackState
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
    if (!syncState.roomId) return;
    
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
    connectWithPartner,
    disconnectFromPartner,
    toggleSync,
    shareSyncLink,
  };
};
