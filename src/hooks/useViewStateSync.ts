
import { useState, useEffect } from 'react';
import { ViewState, SyncState } from '@/lib/types';
import { toast } from 'sonner';

export const useViewStateSync = (syncState: SyncState, initialViewState: ViewState) => {
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  
  // Sync view state changes
  useEffect(() => {
    if (!syncState.isSyncing || !syncState.roomId) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== `viewState_${syncState.roomId}` || !e.newValue) return;
      
      try {
        const parsedViewState = JSON.parse(e.newValue) as ViewState;
        
        // Only update if it's different
        if (parsedViewState.isFullscreenBackground !== viewState.isFullscreenBackground) {
          setViewState(parsedViewState);
          
          // Notify about the change
          if (parsedViewState.isFullscreenBackground) {
            toast.info('Your partner switched to fullscreen view');
          } else {
            toast.info('Your partner switched to normal view');
          }
        }
      } catch (error) {
        console.error('Failed to parse view state data:', error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncState, viewState]);
  
  // Update view state and sync it
  const updateViewState = (newViewState: ViewState) => {
    setViewState(newViewState);
    
    // If syncing is active, sync the view state change
    if (syncState.isSyncing && syncState.roomId) {
      localStorage.setItem(`viewState_${syncState.roomId}`, JSON.stringify(newViewState));
    }
  };
  
  const toggleFullscreenBackground = () => {
    const newViewState = {
      ...viewState,
      isFullscreenBackground: !viewState.isFullscreenBackground
    };
    updateViewState(newViewState);
  };
  
  return {
    viewState,
    updateViewState,
    toggleFullscreenBackground
  };
};
