-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  questions_asked_today INTEGER DEFAULT 0,
  last_question_date TIMESTAMP WITH TIME ZONE
);

-- Add row level security to users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view all profiles
CREATE POLICY "Allow public read access to users" ON public.users
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to update only their own profile
CREATE POLICY "Allow authenticated users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add row level security to posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to posts
CREATE POLICY "Allow public read access to posts" ON public.posts
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own posts
CREATE POLICY "Allow authenticated users to insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create post_likes table for tracking likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts NOT NULL,
  user_id UUID REFERENCES public.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Add row level security to post_likes table
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to post_likes
CREATE POLICY "Allow public read access to post_likes" ON public.post_likes
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own likes
CREATE POLICY "Allow authenticated users to insert their own likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow authenticated users to delete their own likes
CREATE POLICY "Allow authenticated users to delete their own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to count likes for a post
CREATE OR REPLACE FUNCTION get_post_likes(post_row posts)
RETURNS TABLE (count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM post_likes
  WHERE post_id = post_row.id;
$$;

-- Create function to increment questions asked today
CREATE OR REPLACE FUNCTION increment_questions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT questions_asked_today INTO current_count FROM users WHERE id = auth.uid();
  RETURN current_count + 1;
END;
$$;
