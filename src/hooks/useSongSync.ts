
import { useEffect, useState, useRef } from 'react';
import { SyncState, Song, PlaybackState } from '@/lib/types';
import { toast } from 'sonner';

// Mock implementation of sync functionality using localStorage
// In a real app, you'd use WebSockets or Firebase Realtime Database
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
  
  // Simulate connection with partner
  const connectWithPartner = () => {
    // Create a unique room ID (in a real app, this would come from a server)
    const roomId = `music-sync-${Math.random().toString(36).substring(2, 9)}`;
    
    setSyncState(prev => ({
      ...prev,
      isConnected: true,
      roomId,
      isSyncing: true,
    }));
    
    // In a real app, this would be a connection to a server
    // For this demo, we'll use localStorage to simulate syncing
    
    // Store the room ID in localStorage
    localStorage.setItem('musicSync_roomId', roomId);
    
    // Check for partner online status (simulated)
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
      if (syncState.isSyncing) {
        syncPlayback();
      }
    }, 1000); // Sync every second
    
    return roomId;
  };
  
  const disconnectFromPartner = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    localStorage.removeItem('musicSync_roomId');
    localStorage.removeItem('musicSync_currentSong');
    localStorage.removeItem('musicSync_playbackState');
    
    setSyncState({
      isConnected: false,
      partnerOnline: false,
      roomId: null,
      isSyncing: false,
    });
    
    toast.info('Disconnected from partner');
  };
  
  const toggleSync = () => {
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
  
  const syncPlayback = () => {
    if (!syncState.isSyncing || !syncState.roomId) return;
    
    // In a real app, this would send data to the server
    // For this demo, we'll use localStorage
    
    // Store current song and playback state
    localStorage.setItem('musicSync_currentSong', JSON.stringify({
      index: currentSongIndex,
      timestamp: Date.now()
    }));
    
    localStorage.setItem('musicSync_playbackState', JSON.stringify({
      isPlaying: playbackState.isPlaying,
      currentTime: playbackState.currentTime,
      timestamp: Date.now()
    }));
  };
  
  // Listen for changes from partner (simulated)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!syncState.isSyncing) return;
      
      // Check if the change is for our sync
      if (e.key === 'musicSync_currentSong' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.index !== currentSongIndex) {
            playSong(data.index);
            toast.info('Partner changed the song');
          }
        } catch (error) {
          console.error('Failed to parse song sync data:', error);
        }
      }
      
      if (e.key === 'musicSync_playbackState' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          
          // Update playback state
          if (data.isPlaying !== playbackState.isPlaying) {
            togglePlay();
          }
          
          // Only seek if the time difference is significant (more than 3 seconds)
          const timeDiff = Math.abs(data.currentTime - playbackState.currentTime);
          if (timeDiff > 3) {
            seek(data.currentTime);
          }
        } catch (error) {
          console.error('Failed to parse playback sync data:', error);
        }
      }
    };
    
    // Listen for storage events (simulating partner actions)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      
      // Clean up sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [
    syncState.isSyncing, 
    currentSongIndex, 
    playbackState.isPlaying, 
    playbackState.currentTime
  ]);
  
  // Share the current sync link
  const shareSyncLink = () => {
    if (!syncState.roomId) return;
    
    // In a real app, this would generate a join link
    // For this demo, we'll just create a fictitious link
    const syncLink = `https://yourmusicapp.com/join/${syncState.roomId}`;
    
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
