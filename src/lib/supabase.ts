import { createClient } from '@supabase/supabase-js';
import { Song, ChatMessage, ViewState, PlaybackState } from './types';

// Get environment variables or use fallback values
// In production, these should be real values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ihwgjwjduubefnvqawte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod2dqd2pkdXViZWZudnFhd3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2ODE3OTcsImV4cCI6MjA1ODI1Nzc5N30.uASFz3ApaWWMzyfax6hwDK7qYqQAC0rZLGhwYC_Y020';

// Create the Supabase client only if we have valid URL
const createSupabaseClient = () => {
  if (!supabaseUrl.includes('https://') || supabaseUrl.includes('your-project-id')) {
    console.warn('Invalid Supabase URL. Please set correct environment variables.');
    // Return a mock client for development
    return {
      from: () => ({
        select: () => {
          const response = { data: [], error: null };
          response.order = () => response;
          response.eq = () => response;
          return response;
        },
        insert: () => ({ error: null }),
        update: () => {
          const response = { error: null };
          response.eq = () => response;
          return response;
        },
        delete: () => {
          const response = { error: null };
          response.eq = () => response;
          return response;
        },
        upsert: () => ({ error: null }),
      }),
      auth: {
        signUp: () => ({ data: { user: null }, error: null }),
        signInWithPassword: () => ({ data: { user: null, session: null }, error: null }),
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
      channel: (name) => ({
        on: (type, config, callback) => {
          // Mock return for channel subscription
          return {
            subscribe: () => ({ unsubscribe: () => {} })
          };
        },
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
  USER_CONNECTIONS: 'user_connections', // New table for managing user connections
};

// Song-related functions
export const songService = {
  async getSongs() {
    const { data, error } = await supabase
      .from(TABLES.SONGS)
      .select('*');
    
    if (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
    
    // Sort the data in JavaScript instead of using .order()
    return (data as Song[]).sort((a, b) => {
      const dateA = a.addedAt || 0;
      const dateB = b.addedAt || 0;
      return dateB - dateA; // Sort descending (newest first)
    });
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
      .select('*');
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Filter and sort in JavaScript
    return (data as ChatMessage[])
      .filter(msg => msg.roomId === roomId)
      .sort((a, b) => a.timestamp - b.timestamp);
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
    // Use Supabase channel for real-time updates
    const channel = supabase.channel(`chat-${roomId}`);
    
    // Subscribe to all insert events on the chat_messages table for this room
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.CHAT_MESSAGES,
        filter: `roomId=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    );
    
    return channel.subscribe();
  }
};

// Connection-related functions (new service)
export const connectionService = {
  async createConnection(userId: string, partnerEmail: string) {
    // First check if the partner email exists in the system
    const { data: userCheck, error: userError } = await supabase
      .from('auth.users')  // This may need to be adjusted based on your Supabase schema
      .select('id')
      .eq('email', partnerEmail);
    
    if (userError || !userCheck || userCheck.length === 0) {
      console.error('User not found:', userError || 'No user with that email');
      throw new Error('User not found with that email');
    }
    
    const partnerId = userCheck[0].id;
    
    // Create a sync room for the connection
    const { data: room, error: roomError } = await supabase
      .from(TABLES.SYNC_ROOMS)
      .insert([{ 
        ownerId: userId,
        partnerId: partnerId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }])
      .select();
    
    if (roomError) {
      console.error('Error creating sync room:', roomError);
      throw roomError;
    }
    
    return room[0];
  },
  
  async getActiveConnections(userId: string) {
    // Get rooms where the user is either owner or partner
    const { data, error } = await supabase
      .from(TABLES.SYNC_ROOMS)
      .select('*')
      .or(`ownerId.eq.${userId},partnerId.eq.${userId}`);
    
    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
    
    return data;
  },
  
  async getUserInfo(userId: string) {
    const { data, error } = await supabase
      .from('profiles') // Assuming you have a profiles table
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
    
    return data;
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
    const channel = supabase.channel(`playback-${roomId}`);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.PLAYBACK_STATE,
        filter: `roomId=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new as PlaybackState);
      }
    );
    
    return channel.subscribe();
  },
  
  subscribeToViewState(roomId: string, callback: (state: ViewState) => void) {
    const channel = supabase.channel(`view-${roomId}`);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.VIEW_STATE,
        filter: `roomId=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new as ViewState);
      }
    );
    
    return channel.subscribe();
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
