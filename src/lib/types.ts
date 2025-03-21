
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  src: string;
  cover?: string;
  favorite: boolean;
  lyrics?: string;
  addedAt?: number; // Timestamp when the song was added
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeating: boolean;
}

export interface SyncState {
  isConnected: boolean;
  partnerOnline: boolean;
  roomId: string | null;
  isSyncing: boolean;
  lastSyncTime?: number; // When was the last sync
}

export interface ViewState {
  isFullscreenBackground: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  autoHide?: boolean;
}
