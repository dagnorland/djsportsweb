-- Supabase Database Setup for djSports Cloud Sync
-- Run this SQL in your Supabase SQL editor

-- Create the user_sync_data table
CREATE TABLE IF NOT EXISTS user_sync_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_user_id TEXT NOT NULL,
  track_start_times JSONB DEFAULT '{}'::jsonb,
  playlist_types JSONB DEFAULT '{}'::jsonb,
  device_name TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by Spotify user ID
CREATE INDEX IF NOT EXISTS idx_user_sync_data_spotify_user_id 
ON user_sync_data(spotify_user_id);

-- Create unique constraint to ensure one record per Spotify user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sync_data_unique_spotify_user 
ON user_sync_data(spotify_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_sync_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to only access their own data
-- Note: This is a basic policy. In production, you might want to implement
-- proper authentication with Supabase Auth or use service role for server-side operations
CREATE POLICY "Users can access their own sync data" ON user_sync_data
  FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_sync_data_updated_at 
  BEFORE UPDATE ON user_sync_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_sync_data TO authenticated;
GRANT ALL ON user_sync_data TO anon;

