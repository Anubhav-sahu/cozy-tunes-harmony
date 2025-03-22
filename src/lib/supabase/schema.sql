
-- Create extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Songs table to store music information
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  src TEXT NOT NULL, -- URL to the audio file
  cover TEXT, -- URL to cover art (optional)
  favorite BOOLEAN DEFAULT false,
  lyrics TEXT, -- Optional lyrics
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Sync rooms table for managing music sync sessions
CREATE TABLE sync_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- Chat messages for real-time communication
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES sync_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Playback state for syncing music between users
CREATE TABLE playback_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES sync_rooms(id) ON DELETE CASCADE,
  is_playing BOOLEAN DEFAULT false,
  current_position FLOAT DEFAULT 0, -- Renamed from current_time to avoid SQL reserved word
  duration_value FLOAT DEFAULT 0, -- Renamed from duration to avoid potential conflicts
  volume FLOAT DEFAULT 1,
  is_muted BOOLEAN DEFAULT false,
  is_shuffled BOOLEAN DEFAULT false,
  is_repeating BOOLEAN DEFAULT false,
  current_song_index INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- View state for syncing UI elements
CREATE TABLE view_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES sync_rooms(id) ON DELETE CASCADE,
  is_fullscreen_background BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User connections for managing friendships/connections
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  last_online TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Songs policies
CREATE POLICY "Users can view their own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs"
  ON songs FOR DELETE
  USING (auth.uid() = user_id);

-- Sync rooms policies
CREATE POLICY "Users can view rooms they own or are invited to"
  ON sync_rooms FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create rooms"
  ON sync_rooms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update rooms"
  ON sync_rooms FOR UPDATE
  USING (auth.uid() = owner_id);

-- Chat messages policies
CREATE POLICY "Room members can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sync_rooms
      WHERE id = chat_messages.room_id
      AND (owner_id = auth.uid() OR partner_id = auth.uid())
    )
  );

CREATE POLICY "Room members can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sync_rooms
      WHERE id = chat_messages.room_id
      AND (owner_id = auth.uid() OR partner_id = auth.uid())
    )
  );

-- Create realtime publication for syncing
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    sync_rooms, 
    chat_messages,
    playback_state,
    view_state;
COMMIT;
