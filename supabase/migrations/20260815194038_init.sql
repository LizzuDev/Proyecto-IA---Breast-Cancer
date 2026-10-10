-- PostgreSQL schema for Sisu Health & Wellness Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  ai_features_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-create the profiles row on signup from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, ai_features_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'ai_features_enabled')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Mood Check-Ins Table
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL, -- Calm, Happy, Anxious, Overwhelmed, Exhausted, Hopeful
  energy_level INT DEFAULT 3, -- 1 to 5 scale
  tags TEXT[] DEFAULT '{}',
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Beliefs (recurring thought the user re-works over time)
CREATE TABLE IF NOT EXISTS public.beliefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  statement VARCHAR(1000) NOT NULL,
  meaning_to_me VARCHAR(1000),
  origin_historical VARCHAR(1000),
  status TEXT DEFAULT 'active',  -- active | resolved | archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3b. Belief practices (one row per session; same belief_id = re-practice)
CREATE TABLE IF NOT EXISTS public.belief_practices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  belief_id UUID REFERENCES public.beliefs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  initial_belief_score INT NOT NULL CHECK (initial_belief_score BETWEEN 1 AND 100),
  advantages VARCHAR(1000),
  disadvantages VARCHAR(1000),
  chosen_alternative_thought VARCHAR(1000),
  chosen_new_action VARCHAR(1000),
  final_belief_score INT CHECK (final_belief_score BETWEEN 1 AND 100),
  ai_assisted BOOLEAN DEFAULT FALSE,
  practiced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Friends circle (store raw answers; tier is derived by the app)
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  contact_frequency SMALLINT CHECK (contact_frequency BETWEEN 1 AND 5),     -- Q1
  conversation_depth SMALLINT CHECK (conversation_depth BETWEEN 1 AND 4),   -- Q2
  emotional_reliability SMALLINT CHECK (emotional_reliability BETWEEN 1 AND 4), -- Q3
  vulnerability_depth SMALLINT CHECK (vulnerability_depth BETWEEN 1 AND 4),     -- Q4
  tier TEXT,  -- close_friend | friend | acquaintance
  tier_source TEXT DEFAULT 'auto' CHECK (tier_source IN ('auto', 'manual')), -- auto (questionnaire) | manual (dragged)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Completed Resources Table (which wellness guides the user finished)
CREATE TABLE IF NOT EXISTS public.completed_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, resource_id)
);

-- 6. Breathing Streak Table (one row per user; mirrors local streak state)
CREATE TABLE IF NOT EXISTS public.breathing_streaks (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  count INT DEFAULT 0,
  last_completed_date DATE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belief_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breathing_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own mood checkins" ON public.mood_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own beliefs" ON public.beliefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own belief practices" ON public.belief_practices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own friends" ON public.friends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own completed resources" ON public.completed_resources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own breathing streak" ON public.breathing_streaks FOR ALL USING (auth.uid() = user_id);
