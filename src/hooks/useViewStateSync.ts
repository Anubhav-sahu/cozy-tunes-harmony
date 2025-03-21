
import { useState, useEffect } from 'react';
import { ViewState, SyncState } from '@/lib/types';
import { toast } from 'sonner';
import { syncService } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useViewStateSync = (syncState: SyncState, initialViewState: ViewState) => {
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const { user } = useAuth();
  
  // Sync view state changes
  useEffect(() => {
    if (!syncState.isSyncing || !syncState.roomId || !user) return;
    
    const subscription = syncService.subscribeToViewState(syncState.roomId, (newViewState) => {
      // Only update if it's different
      if (newViewState.isFullscreenBackground !== viewState.isFullscreenBackground) {
        setViewState(newViewState);
        
        // Notify about the change
        if (newViewState.isFullscreenBackground) {
          toast.info('Your partner switched to fullscreen view');
        } else {
          toast.info('Your partner switched to normal view');
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [syncState, viewState, user]);
  
  // Update view state and sync it
  const updateViewState = async (newViewState: ViewState) => {
    setViewState(newViewState);
    
    // If syncing is active, sync the view state change
    if (syncState.isSyncing && syncState.roomId && user) {
      try {
        await syncService.updateViewState(syncState.roomId, newViewState);
      } catch (error) {
        console.error('Failed to update view state:', error);
      }
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
