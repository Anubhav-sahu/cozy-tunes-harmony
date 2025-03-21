
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  src: string;
  cover?: string;
  favorite: boolean;
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
}
