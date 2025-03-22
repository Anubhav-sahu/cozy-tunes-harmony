
import { createClient } from '@supabase/supabase-js';
import { Song, ChatMessage, ViewState, PlaybackState } from './types';

// Get environment variables or use fallback values
// In production, these should be real values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create the Supabase client only if we have valid URL
const createSupabaseClient = () => {
  if (!supabaseUrl.includes('https://') || supabaseUrl.includes('your-project-id')) {
    console.warn('Invalid Supabase URL. Please set correct environment variables.');
    // Return a mock client for development
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ error: null }),
        update: () => ({ error: null }),
        delete: () => ({ error: null }),
        eq: () => ({ data: [], error: null }),
        order: () => ({ data: [], error: null }),
        upsert: () => ({ error: null }),
      }),
      auth: {
        signUp: () => ({ data: {}, error: null }),
        signInWithPassword: () => ({ data: {}, error: null }),
        signOut: () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
        getUser: () => ({ data: { user: null }, error: null }),
        getSession: () => ({ data: { session: null }, error: null }),
      },
      storage: {
        from: () => ({
          upload: () => ({ data: {}, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
    };
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
};

export const supabase = createSupabaseClient();

// Database schema names
export const TABLES = {
  SONGS: 'songs',
  CHAT_MESSAGES: 'chat_messages',
  SYNC_ROOMS: 'sync_rooms',
  PLAYBACK_STATE: 'playback_state',
  VIEW_STATE: 'view_state',
};

// Song-related functions
export const songService = {
  async getSongs() {
    const { data, error } = await supabase
      .from(TABLES.SONGS)
      .select('*')
      .order('addedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
    
    return data as Song[];
  },
  
  async addSong(song: Song) {
    const { error } = await supabase
      .from(TABLES.SONGS)
      .insert([song]);
    
    if (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  },
  
  async updateSong(song: Song) {
    const { error } = await supabase
      .from(TABLES.SONGS)
      .update(song)
      .eq('id', song.id);
    
    if (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  },
  
  async removeSong(id: string) {
    const { error } = await supabase
      .from(TABLES.SONGS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error removing song:', error);
      throw error;
    }
  },
  
  async toggleFavorite(id: string, favorite: boolean) {
    const { error } = await supabase
      .from(TABLES.SONGS)
      .update({ favorite })
      .eq('id', id);
    
    if (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
};

// Chat-related functions
export const chatService = {
  async getMessages(roomId: string) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .select('*')
      .eq('roomId', roomId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data as ChatMessage[];
  },
  
  async sendMessage(message: ChatMessage) {
    const { error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .insert([message]);
    
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  async clearChat(roomId: string) {
    const { error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .delete()
      .eq('roomId', roomId);
    
    if (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  },
  
  subscribeToMessages(roomId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.CHAT_MESSAGES,
        filter: `roomId=eq.${roomId}`
      }, (payload) => {
        callback(payload.new as ChatMessage);
      })
      .subscribe();
  }
};

// Sync-related functions
export const syncService = {
  async createSyncRoom(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.SYNC_ROOMS)
      .insert([{ 
        ownerId: userId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Error creating sync room:', error);
      throw error;
    }
    
    return data[0];
  },
  
  async updatePlaybackState(roomId: string, playbackState: PlaybackState) {
    const { error } = await supabase
      .from(TABLES.PLAYBACK_STATE)
      .upsert([{
        roomId,
        ...playbackState,
        updatedAt: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error updating playback state:', error);
      throw error;
    }
  },
  
  async updateViewState(roomId: string, viewState: ViewState) {
    const { error } = await supabase
      .from(TABLES.VIEW_STATE)
      .upsert([{
        roomId,
        ...viewState,
        updatedAt: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error updating view state:', error);
      throw error;
    }
  },
  
  subscribeToPlaybackState(roomId: string, callback: (state: PlaybackState) => void) {
    return supabase
      .channel(`playback-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.PLAYBACK_STATE,
        filter: `roomId=eq.${roomId}`
      }, (payload) => {
        callback(payload.new as PlaybackState);
      })
      .subscribe();
  },
  
  subscribeToViewState(roomId: string, callback: (state: ViewState) => void) {
    return supabase
      .channel(`view-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.VIEW_STATE,
        filter: `roomId=eq.${roomId}`
      }, (payload) => {
        callback(payload.new as ViewState);
      })
      .subscribe();
  }
};

// Auth-related functions
export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }
    
    return data;
  },
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
    
    return data;
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_, session) => {
      callback(session);
    });
  },
  
  getCurrentUser() {
    return supabase.auth.getUser();
  },
  
  getCurrentSession() {
    return supabase.auth.getSession();
  }
};

// Storage-related functions
export const storageService = {
  async uploadSong(file: File, userId: string) {
    const filename = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('songs')
      .upload(filename, file);
    
    if (error) {
      console.error('Error uploading song:', error);
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('songs')
      .getPublicUrl(filename);
    
    return publicUrl;
  },
  
  async uploadBackgroundImage(file: File, userId: string) {
    const filename = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('backgrounds')
      .upload(filename, file);
    
    if (error) {
      console.error('Error uploading background image:', error);
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('backgrounds')
      .getPublicUrl(filename);
    
    return publicUrl;
  }
};
