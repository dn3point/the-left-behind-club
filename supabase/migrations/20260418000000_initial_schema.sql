-- Core tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  locale TEXT NOT NULL DEFAULT 'zh',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  description TEXT,
  description_zh TEXT,
  type TEXT NOT NULL,
  config JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS module_members_user_module_idx ON module_members(user_id, module_id);

CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FIFA 2026 tables
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_zh TEXT,
  code TEXT NOT NULL,
  flag_url TEXT,
  group_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  group_name TEXT,
  match_number INTEGER,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  starts_at TIMESTAMPTZ NOT NULL,
  lock_at TIMESTAMPTZ NOT NULL,
  venue TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guess_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  scoring_mode TEXT NOT NULL DEFAULT 'exact',
  question_text TEXT NOT NULL,
  question_text_zh TEXT,
  options JSONB NOT NULL,
  correct_answer TEXT,
  points INTEGER NOT NULL DEFAULT 3,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES guess_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  is_correct BOOLEAN,
  guessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_guesses_user_question_idx ON user_guesses(user_id, question_id);

CREATE TABLE IF NOT EXISTS tournament_winner_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  guessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS winner_guesses_user_tournament_idx ON tournament_winner_guesses(user_id, tournament_id);

CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  breakdown JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS leaderboards_module_user_idx ON leaderboards(module_id, user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE guess_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_winner_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read most data
CREATE POLICY "Allow authenticated read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON module_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON guess_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON leaderboards FOR SELECT TO authenticated USING (true);

-- Users can only read their own guesses
CREATE POLICY "Users read own guesses" ON user_guesses FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own guesses" ON user_guesses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own guesses" ON user_guesses FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users read own winner guesses" ON tournament_winner_guesses FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own winner guesses" ON tournament_winner_guesses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own winner guesses" ON tournament_winner_guesses FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON allowed_emails FOR ALL TO service_role USING (true);
