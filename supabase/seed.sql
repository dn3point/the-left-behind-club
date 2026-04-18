-- Seed allowed emails (add your group members here)
INSERT INTO allowed_emails (email) VALUES
  ('dn3point@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Seed the FIFA 2026 module
INSERT INTO modules (slug, name, name_zh, description, description_zh, type, status) VALUES
  ('fifa2026', 'FIFA World Cup 2026', '2026年FIFA世界杯', 'Predict matches & win glory', '预测比赛，赢取荣耀', 'tournament', 'active')
ON CONFLICT (slug) DO NOTHING;
