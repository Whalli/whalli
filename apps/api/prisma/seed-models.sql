-- Seed script to populate AI models and companies in the database
-- Run this with: psql -U postgres -d whalli -f seed-models.sql

-- Insert AI companies
INSERT INTO companies (id, name, "logoUrl") VALUES
  ('openai', 'OpenAI', 'https://cdn.openai.com/assets/logo-share-card.png'),
  ('anthropic', 'Anthropic', 'https://www.anthropic.com/images/icons/anthropic-logo.svg'),
  ('xai', 'xAI', 'https://x.ai/favicon.svg'),
  ('google', 'Google', 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'),
  ('meta', 'Meta', 'https://www.meta.com/static_resource/meta-logo.svg'),
  ('mistral', 'Mistral', 'https://mistral.ai/images/logo.svg'),
  ('cohere', 'Cohere', 'https://cohere.com/favicon.svg')
ON CONFLICT (id) DO NOTHING;

-- Insert OpenAI models
INSERT INTO models (id, "companyId", name, description, capabilities, "latencyHint", "costEstimate") VALUES
  (
    'gpt-4-turbo',
    'openai',
    'GPT-4 Turbo',
    'Most capable GPT-4 model with improved performance and 128K context',
    '{"reasoning": "excellent", "coding": "excellent", "creative": "excellent", "context": "128k"}',
    'Medium (2-5s)',
    '$$$'
  ),
  (
    'gpt-4',
    'openai',
    'GPT-4',
    'Powerful model for complex tasks requiring deep reasoning',
    '{"reasoning": "excellent", "coding": "excellent", "creative": "excellent", "context": "8k"}',
    'Medium (3-6s)',
    '$$'
  ),
  (
    'gpt-3.5-turbo',
    'openai',
    'GPT-3.5 Turbo',
    'Fast and efficient for most conversational tasks',
    '{"reasoning": "good", "coding": "good", "creative": "good", "context": "16k"}',
    'Fast (1-2s)',
    '$'
  ),
  (
    'gpt-3.5-turbo-16k',
    'openai',
    'GPT-3.5 Turbo 16K',
    'Extended context version of GPT-3.5 Turbo',
    '{"reasoning": "good", "coding": "good", "creative": "good", "context": "16k"}',
    'Fast (1-2s)',
    '$'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Anthropic models
INSERT INTO models (id, "companyId", name, description, capabilities, "latencyHint", "costEstimate") VALUES
  (
    'claude-3-opus',
    'anthropic',
    'Claude 3 Opus',
    'Most powerful Claude model for complex reasoning and analysis',
    '{"reasoning": "excellent", "coding": "excellent", "creative": "excellent", "context": "200k"}',
    'Medium (3-5s)',
    '$$$'
  ),
  (
    'claude-3-sonnet',
    'anthropic',
    'Claude 3 Sonnet',
    'Balanced performance and speed for most tasks',
    '{"reasoning": "very good", "coding": "very good", "creative": "very good", "context": "200k"}',
    'Fast (2-3s)',
    '$$'
  ),
  (
    'claude-3-haiku',
    'anthropic',
    'Claude 3 Haiku',
    'Fastest Claude model for quick responses',
    '{"reasoning": "good", "coding": "good", "creative": "good", "context": "200k"}',
    'Very Fast (<1s)',
    '$'
  ),
  (
    'claude-2.1',
    'anthropic',
    'Claude 2.1',
    'Previous generation with reliable performance',
    '{"reasoning": "very good", "coding": "very good", "creative": "very good", "context": "100k"}',
    'Fast (2-3s)',
    '$$'
  ),
  (
    'grok-beta',
    'xai',
    'Grok Beta',
    'Beta version of Grok with real-time information access',
    '{"reasoning": "very good", "coding": "very good", "creative": "excellent", "context": "128k", "realtime": true}',
    'Fast (2-3s)',
    '$$'
  ),
  (
    'grok-2',
    'xai',
    'Grok 2',
    'Latest Grok model with enhanced reasoning and real-time data',
    '{"reasoning": "excellent", "coding": "excellent", "creative": "excellent", "context": "128k", "realtime": true}',
    'Medium (2-4s)',
    '$$$'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT 
  c.name as company,
  COUNT(m.id) as model_count
FROM companies c
LEFT JOIN models m ON c.id = m."companyId"
GROUP BY c.name
ORDER BY c.name;

-- Show all models
SELECT 
  c.name as company,
  m.name as model,
  m.description,
  m."latencyHint",
  m."costEstimate"
FROM models m
JOIN companies c ON m."companyId" = c.id
ORDER BY c.name, m.name;
