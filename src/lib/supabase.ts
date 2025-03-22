
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
  USER_CONNECTIONS: 'user_connections',
  PROFILES: 'profiles', 
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
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    // Map database fields to our app's expected format
    return (data || []).map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender_id === supabase.auth.getUser()?.data?.user?.id ? 'me' : 'partner',
      timestamp: new Date(msg.timestamp).getTime(),
      roomId: msg.room_id
    })) as ChatMessage[];
  },
  
  async sendMessage(message: ChatMessage) {
    const { error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .insert([{
        room_id: message.roomId,
        text: message.text,
        sender_id: supabase.auth.getUser()?.data?.user?.id,
        timestamp: new Date().toISOString(),
        is_read: false
      }]);
    
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  async clearChat(roomId: string) {
    const { error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .delete()
      .eq('room_id', roomId);
    
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
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        const rawMsg = payload.new;
        const formattedMessage: ChatMessage = {
          id: rawMsg.id,
          text: rawMsg.text,
          sender: rawMsg.sender_id === supabase.auth.getUser()?.data?.user?.id ? 'me' : 'partner',
          timestamp: new Date(rawMsg.timestamp).getTime(),
          roomId: rawMsg.room_id
        };
        callback(formattedMessage);
      }
    );
    
    return channel.subscribe();
  }
};

// Connection-related functions
export const connectionService = {
  async createConnection(userId: string, partnerEmail: string) {
    try {
      // First check if the partner email exists in the system
      const { data: userCheck, error: userError } = await supabase
        .from(TABLES.PROFILES)
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
          owner_id: userId,
          partner_id: partnerId,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          active: true
        }])
        .select();
      
      if (roomError) {
        console.error('Error creating sync room:', roomError);
        throw roomError;
      }
      
      return room[0];
    } catch (error) {
      console.error("Error in createConnection:", error);
      throw error;
    }
  },
  
  async getActiveConnections(userId: string) {
    try {
      // Get rooms where the user is either owner or partner
      const { data, error } = await supabase
        .from(TABLES.SYNC_ROOMS)
        .select(`
          id, 
          created_at, 
          last_activity, 
          active, 
          owner_id, 
          partner_id, 
          profiles!owner_id(username, display_name),
          profiles!partner_id(username, display_name)
        `)
        .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching connections:', error);
        return [];
      }
      
      // Format the data to be more usable by our frontend
      return data.map(conn => {
        const isOwner = conn.owner_id === userId;
        const partnerId = isOwner ? conn.partner_id : conn.owner_id;
        const partnerProfile = isOwner ? conn.profiles.partner_id : conn.profiles.owner_id;
        
        return {
          id: conn.id,
          partnerId,
          partnerName: partnerProfile?.display_name || partnerProfile?.username || 'Unknown User',
          createdAt: conn.created_at,
          lastActivity: conn.last_activity,
          active: conn.active
        };
      });
    } catch (error) {
      console.error("Error in getActiveConnections:", error);
      return [];
    }
  },
  
  async getUserInfo(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user info:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in getUserInfo:", error);
      return null;
    }
  }
};

// Sync-related functions
export const syncService = {
  async createSyncRoom(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SYNC_ROOMS)
        .insert([{ 
          owner_id: userId,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          active: true
        }])
        .select();
      
      if (error) {
        console.error('Error creating sync room:', error);
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error("Error in createSyncRoom:", error);
      throw error;
    }
  },
  
  async updatePlaybackState(roomId: string, playbackState: PlaybackState) {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYBACK_STATE)
        .upsert([{
          room_id: roomId,
          is_playing: playbackState.isPlaying,
          current_position: playbackState.currentTime, // Renamed in DB schema
          duration_value: playbackState.duration, // Renamed in DB schema
          volume: playbackState.volume,
          is_muted: playbackState.isMuted,
          is_shuffled: playbackState.isShuffled,
          is_repeating: playbackState.isRepeating,
          current_song_index: playbackState.currentSongIndex,
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error updating playback state:', error);
        throw error;
      }
    } catch (error) {
      console.error("Error in updatePlaybackState:", error);
      throw error;
    }
  },
  
  async updateViewState(roomId: string, viewState: ViewState) {
    try {
      const { error } = await supabase
        .from(TABLES.VIEW_STATE)
        .upsert([{
          room_id: roomId,
          is_fullscreen_background: viewState.isFullscreenBackground,
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error updating view state:', error);
        throw error;
      }
    } catch (error) {
      console.error("Error in updateViewState:", error);
      throw error;
    }
  },
  
  subscribeToPlaybackState(roomId: string, callback: (state: PlaybackState) => void) {
    try {
      const channel = supabase.channel(`playback-${roomId}`);
      
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.PLAYBACK_STATE,
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const rawState = payload.new;
          // Map from DB schema to our app's expected format
          const playbackState: PlaybackState = {
            isPlaying: rawState.is_playing,
            currentTime: rawState.current_position, // Renamed in DB schema
            duration: rawState.duration_value, // Renamed in DB schema
            volume: rawState.volume,
            isMuted: rawState.is_muted,
            isShuffled: rawState.is_shuffled,
            isRepeating: rawState.is_repeating,
            currentSongIndex: rawState.current_song_index
          };
          callback(playbackState);
        }
      );
      
      return channel.subscribe();
    } catch (error) {
      console.error("Error in subscribeToPlaybackState:", error);
      // Return a dummy subscription object
      return { unsubscribe: () => {} };
    }
  },
  
  subscribeToViewState(roomId: string, callback: (state: ViewState) => void) {
    try {
      const channel = supabase.channel(`view-${roomId}`);
      
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.VIEW_STATE,
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const rawState = payload.new;
          // Map from DB schema to our app's expected format
          const viewState: ViewState = {
            isFullscreenBackground: rawState.is_fullscreen_background
          };
          callback(viewState);
        }
      );
      
      return channel.subscribe();
    } catch (error) {
      console.error("Error in subscribeToViewState:", error);
      // Return a dummy subscription object
      return { unsubscribe: () => {} };
    }
  }
};

// Auth-related functions
export const authService = {
  async signUp(email: string, password: string) {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Error signing up:', error);
        throw error;
      }
      
      // If successful, create a profile entry
      if (data.user) {
        const { error: profileError } = await supabase
          .from(TABLES.PROFILES)
          .insert([{
            id: data.user.id,
            username: email.split('@')[0], // Default username from email
            display_name: email.split('@')[0], // Default display name
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
  },
  
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Error signing in:', error);
        throw error;
      }
      
      // Update the last_online status
      if (data.user) {
        const { error: profileError } = await supabase
          .from(TABLES.PROFILES)
          .update({ last_online: new Date().toISOString() })
          .eq('id', data.user.id);
        
        if (profileError) {
          console.error('Error updating last online status:', profileError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error in signIn:", error);
      throw error;
    }
  },
  
  async signOut() {
    try {
      // Get current user before signing out
      const { data: userData } = await supabase.auth.getUser();
      
      // Update last_online before signing out
      if (userData?.user) {
        const { error: profileError } = await supabase
          .from(TABLES.PROFILES)
          .update({ last_online: new Date().toISOString() })
          .eq('id', userData.user.id);
        
        if (profileError) {
          console.error('Error updating last online status:', profileError);
        }
      }
      
      // Now sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error("Error in signOut:", error);
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
    try {
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
    } catch (error) {
      console.error("Error in uploadSong:", error);
      throw error;
    }
  },
  
  async uploadBackgroundImage(file: File, userId: string) {
    try {
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
    } catch (error) {
      console.error("Error in uploadBackgroundImage:", error);
      throw error;
    }
  }
};
