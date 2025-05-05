-- Supabase AI Chat Application - Consolidated Initial Schema
-- Version: Combined from final_0430 migrations
-- Date: [Current Date]

-- =====================================================
-- Helper Functions (Self-contained only)
-- =====================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Table Creation
-- =====================================================

-- 1. Users Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firebase_uid         TEXT NULL UNIQUE, -- Allow NULL if not all users have Firebase UID
  email                TEXT UNIQUE NOT NULL, -- Should match auth.users.email, add constraint if needed
  username             TEXT NULL,
  avatar_url           TEXT NULL,
  created_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at        TIMESTAMPTZ NULL,
  subscription_status  TEXT DEFAULT 'normal' NOT NULL, -- e.g., normal, trial, basic, pro, premium
  subscription_expires_at TIMESTAMPTZ NULL,
  metadata             JSONB NULL
);
COMMENT ON TABLE public.users IS 'User profile information, extending Supabase auth.users.';
COMMENT ON COLUMN public.users.firebase_uid IS 'UID from Firebase for migration purposes.';
COMMENT ON COLUMN public.users.subscription_status IS 'Current subscription status of the user.';
COMMENT ON COLUMN public.users.subscription_expires_at IS 'Timestamp when the current subscription expires.';

-- 2. Characters Table
CREATE TABLE IF NOT EXISTS public.characters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  avatar_url   TEXT NULL,
  gender       TEXT NULL, -- e.g., male, female, non-binary, bot
  description  TEXT NULL,
  i18n         JSONB NULL, -- Store translations like {"en": {"description": "..."}, "zh": {"description": "..."}}
  is_active    BOOLEAN DEFAULT true NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata     JSONB NULL
);
COMMENT ON TABLE public.characters IS 'Stores definitions of AI characters available for chat.';
COMMENT ON COLUMN public.characters.i18n IS 'JSON object containing multi-language versions of character fields.';

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NULL, -- Can be user-defined or auto-generated
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_archived  BOOLEAN DEFAULT false NOT NULL,
  metadata     JSONB NULL -- e.g., {"character_id": "uuid", "last_message_preview": "..."}
);
COMMENT ON TABLE public.conversations IS 'Represents a chat session between a user and an AI character.';
COMMENT ON COLUMN public.conversations.metadata IS 'Stores extra information like associated character or last message preview.';

-- 4. Messages Table
CREATE TABLE public.messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id        UUID NULL REFERENCES public.users(id) ON DELETE SET NULL, -- User who sent (if role='user')
  character_id   UUID NULL REFERENCES public.characters(id) ON DELETE SET NULL, -- Character who sent (if role='assistant')
  content        TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')), -- Role of the message sender
  created_at     TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata       JSONB NULL -- e.g., {"tts_url": "...", "sentiment": "positive", "token_count": 50}
);
COMMENT ON TABLE public.messages IS 'Stores individual messages within a conversation.';
COMMENT ON COLUMN public.messages.user_id IS 'User ID if the role is user.';
COMMENT ON COLUMN public.messages.character_id IS 'Character ID if the role is assistant.';
COMMENT ON COLUMN public.messages.metadata IS 'Extra message data like TTS audio URL, sentiment, token usage.';


-- 5. Payments Table
CREATE TABLE public.payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount       NUMERIC(10, 2) NOT NULL CHECK (amount >= 0), -- Ensure non-negative amount
  currency     TEXT NOT NULL, -- e.g., USD, EUR, JPY
  payment_method TEXT NOT NULL, -- e.g., stripe, paypal, ton, apple_iap, google_play
  status       TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, success, failed, refunded
  transaction_id TEXT NULL UNIQUE, -- ID from the payment provider
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL, -- To track status changes
  metadata     JSONB NULL -- e.g., {"provider_details": {...}, "product_id": "...", "order_id": "..."}
);
COMMENT ON TABLE public.payments IS 'Records payment transactions for subscriptions or one-time purchases.';
COMMENT ON COLUMN public.payments.transaction_id IS 'Unique transaction identifier from the payment gateway.';
COMMENT ON COLUMN public.payments.metadata IS 'Stores provider-specific details, related product/order IDs.';

-- 6. Subscriptions Table
CREATE TABLE public.subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id      TEXT NOT NULL, -- Identifier for the subscription plan (e.g., basic_monthly, pro_yearly)
  status       TEXT NOT NULL DEFAULT 'inactive', -- e.g., active, inactive, cancelled, expired, past_due
  started_at   TIMESTAMPTZ NULL, -- When the subscription became active
  expires_at   TIMESTAMPTZ NULL, -- When the current period ends or subscription expires
  cancelled_at TIMESTAMPTZ NULL, -- When the subscription was cancelled
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL, -- Stripe-like flag
  last_payment_id UUID NULL REFERENCES public.payments(id) ON DELETE SET NULL, -- Link to the last successful payment
  provider_subscription_id TEXT NULL UNIQUE, -- Subscription ID from Stripe/PayPal etc.
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata     JSONB NULL -- e.g., {"renewal_attempts": 1, "next_billing_amount": 9.99}
);
COMMENT ON TABLE public.subscriptions IS 'Manages user subscription status and details.';
COMMENT ON COLUMN public.subscriptions.provider_subscription_id IS 'Unique subscription identifier from the payment gateway.';

-- 7. Character Stats Table
CREATE TABLE IF NOT EXISTS public.character_stats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  chat_count   INTEGER DEFAULT 0 NOT NULL CHECK (chat_count >= 0),
  last_chat_at TIMESTAMPTZ NULL,
  -- Add other stats like total_users, average_rating if needed
  metadata     JSONB NULL
);
COMMENT ON TABLE public.character_stats IS 'Tracks usage statistics for each AI character.';

-- 8. Marquee Messages Table
CREATE TABLE IF NOT EXISTS public.marquee_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT true NOT NULL,
  start_time   TIMESTAMPTZ NULL, -- Optional: when the message becomes active
  end_time     TIMESTAMPTZ NULL, -- Optional: when the message expires
  target_audience TEXT DEFAULT 'all', -- e.g., all, free_users, paid_users
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata     JSONB NULL -- e.g., {"priority": 1, "link_url": "..."}
);
COMMENT ON TABLE public.marquee_messages IS 'Stores system announcements or promotional messages.';

-- 9. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NULL REFERENCES public.users(id) ON DELETE SET NULL, -- Allow anonymous feedback
  email        TEXT NULL, -- Capture email even if anonymous, if provided
  rating       INTEGER NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)), -- 1 to 5 stars
  comment      TEXT NULL,
  page_context TEXT NULL, -- Where the feedback was submitted (e.g., 'chat_interface', 'subscription_page')
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL, -- Might be useful for status tracking
  metadata     JSONB NULL -- e.g., {"device": "mobile", "browser": "chrome", "status": "reviewed"}
);
COMMENT ON TABLE public.feedback IS 'Stores user feedback and ratings.';

-- 10. Share Rewards Table
CREATE TABLE IF NOT EXISTS public.share_rewards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL, -- e.g., wechat, twitter, facebook, link
  date         DATE NOT NULL DEFAULT current_date,
  count        INTEGER DEFAULT 1 NOT NULL CHECK (count > 0),
  last_share_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata     JSONB NULL -- e.g., {"reward_points": 10, "campaign_id": "..."}
);
COMMENT ON TABLE public.share_rewards IS 'Tracks user sharing activities for rewards.';

-- 11. Locales Table (Consider if really needed vs. file-based i18n)
CREATE TABLE IF NOT EXISTS public.locales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lang         TEXT NOT NULL, -- e.g., en, zh, ja
  key          TEXT NOT NULL, -- e.g., welcome_message, button.submit
  value        TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata     JSONB NULL -- e.g., {"source": "database", "version": 1}
);
COMMENT ON TABLE public.locales IS 'Stores dynamic localization strings (use with caution, prefer file-based).';

-- 12. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE, -- e.g., maintenance_mode, default_ai_model, stripe_publishable_key
  value        JSONB NOT NULL,
  description  TEXT NULL, -- Description of the setting
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.system_settings IS 'Stores global system configuration values.';


-- =====================================================
-- Indexes and Constraints (After Tables are Created)
-- =====================================================

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON public.messages(character_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at); -- For ordering

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);


-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON public.subscriptions(provider_subscription_id);

-- Unique constraint for character stats
-- Ensure constraint is dropped if exists before adding
ALTER TABLE public.character_stats DROP CONSTRAINT IF EXISTS unique_character_stat;
ALTER TABLE public.character_stats ADD CONSTRAINT unique_character_stat UNIQUE (character_id);

-- Indexes for character_stats
CREATE INDEX IF NOT EXISTS idx_character_stats_chat_count ON public.character_stats(chat_count DESC); -- For popularity sorting

-- Indexes for marquee_messages
CREATE INDEX IF NOT EXISTS idx_marquee_messages_active_dates ON public.marquee_messages(is_active, start_time, end_time);

-- Indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Unique constraint per user, platform, date for share_rewards
ALTER TABLE public.share_rewards DROP CONSTRAINT IF EXISTS unique_user_platform_date_share;
ALTER TABLE public.share_rewards ADD CONSTRAINT unique_user_platform_date_share UNIQUE (user_id, platform, date);

-- Indexes for share_rewards
CREATE INDEX IF NOT EXISTS idx_share_rewards_user_id_date ON public.share_rewards(user_id, date);

-- Unique constraint for locales
ALTER TABLE public.locales DROP CONSTRAINT IF EXISTS unique_lang_key;
ALTER TABLE public.locales ADD CONSTRAINT unique_lang_key UNIQUE (lang, key);

-- Indexes for locales
CREATE INDEX IF NOT EXISTS idx_locales_lang ON public.locales(lang);

-- =====================================================
-- Triggers (After Tables are Created)
-- =====================================================

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for characters updated_at
DROP TRIGGER IF EXISTS handle_characters_updated_at ON public.characters;
CREATE TRIGGER handle_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS handle_conversations_updated_at ON public.conversations;
CREATE TRIGGER handle_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for payments updated_at
DROP TRIGGER IF EXISTS handle_payments_updated_at ON public.payments;
CREATE TRIGGER handle_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER handle_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for marquee_messages updated_at
DROP TRIGGER IF EXISTS handle_marquee_messages_updated_at ON public.marquee_messages;
CREATE TRIGGER handle_marquee_messages_updated_at
BEFORE UPDATE ON public.marquee_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for feedback updated_at
DROP TRIGGER IF EXISTS handle_feedback_updated_at ON public.feedback;
CREATE TRIGGER handle_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for locales updated_at
DROP TRIGGER IF EXISTS handle_locales_updated_at ON public.locales;
CREATE TRIGGER handle_locales_updated_at
BEFORE UPDATE ON public.locales
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for system_settings updated_at
DROP TRIGGER IF EXISTS handle_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER handle_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to sync on new user creation in auth.users (Using handle_new_user from final_0430_002.sql)
-- Function Definition
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, avatar_url, metadata)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url', -- Extract avatar_url from metadata if available
    new.raw_user_meta_data -- Store all raw metadata potentially including name, etc.
  );
  return new;
end;
$$;

-- Apply Trigger (after function is defined)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =====================================================
-- Row Level Security (RLS) Policies (AFTER Tables, Triggers, Functions)
-- =====================================================

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marquee_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies Definitions

-- users: Users can view/update their own profile.
DROP POLICY IF EXISTS "Allow user full access to own data" ON public.users;
CREATE POLICY "Allow user full access to own data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- characters: All authenticated users can read active characters.
DROP POLICY IF EXISTS "Allow read access to active characters for authenticated users" ON public.characters;
CREATE POLICY "Allow read access to active characters for authenticated users" ON public.characters
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- conversations: Users can manage their own conversations.
DROP POLICY IF EXISTS "Allow user full access to own conversations" ON public.conversations;
CREATE POLICY "Allow user full access to own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- messages: Users can manage messages in their own conversations.
DROP POLICY IF EXISTS "Allow user access to messages in own conversations" ON public.messages;
CREATE POLICY "Allow user access to messages in own conversations" ON public.messages
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.conversations WHERE id = conversation_id)
  );

-- payments: Users can view their own payments.
DROP POLICY IF EXISTS "Allow user read access to own payments" ON public.payments;
CREATE POLICY "Allow user read access to own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- subscriptions: Users can view their own subscriptions.
DROP POLICY IF EXISTS "Allow user read access to own subscriptions" ON public.subscriptions;
CREATE POLICY "Allow user read access to own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- character_stats: All authenticated users can read.
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.character_stats;
CREATE POLICY "Allow read access for authenticated users" ON public.character_stats
  FOR SELECT USING (auth.role() = 'authenticated');

-- marquee_messages: All authenticated users can read active messages.
DROP POLICY IF EXISTS "Allow read access to active marquees for authenticated users" ON public.marquee_messages;
CREATE POLICY "Allow read access to active marquees for authenticated users" ON public.marquee_messages
  FOR SELECT USING (
    is_active = true
    AND (start_time IS NULL OR start_time <= timezone('utc'::text, now()))
    AND (end_time IS NULL OR end_time >= timezone('utc'::text, now()))
    AND auth.role() = 'authenticated'
    -- Add audience checks if needed, e.g., AND (target_audience = 'all' OR (target_audience = 'paid_users' AND ...))
  );

-- feedback: Users can insert feedback.
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON public.feedback;
CREATE POLICY "Allow authenticated users to insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- share_rewards: Users can manage their own rewards.
DROP POLICY IF EXISTS "Allow user full access to own share rewards" ON public.share_rewards;
CREATE POLICY "Allow user full access to own share rewards" ON public.share_rewards
  FOR ALL USING (auth.uid() = user_id);

-- locales: All authenticated users can read.
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.locales;
CREATE POLICY "Allow read access for authenticated users" ON public.locales
  FOR SELECT USING (auth.role() = 'authenticated');

-- system_settings: Access restricted (Placeholder - Define specific access if needed, e.g., via functions or service role).
DROP POLICY IF EXISTS "Allow admin full access to system settings" ON public.system_settings;
-- Placeholder for admin access policy, adjust as needed:
-- CREATE POLICY "Allow admin full access to system settings" ON public.system_settings FOR ALL USING (is_admin(auth.uid()));


-- =====================================================
-- Initial Data (Optional) - Add sample data for testing
-- =====================================================

-- Add a default AI character
INSERT INTO public.characters (id, name, avatar_url, gender, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'AI Assistant', 'https://example.com/default-avatar.png', 'bot', 'A helpful AI assistant ready to chat with you about anything.', true)
ON CONFLICT (id) DO NOTHING;

-- Add a default system setting key for the default character (if needed by app logic)
INSERT INTO public.system_settings (key, value, description)
VALUES ('default_character_id', '"00000000-0000-0000-0000-000000000001"', 'Default character used if none selected')
ON CONFLICT (key) DO NOTHING;

-- Add a mock marquee message for testing
INSERT INTO public.marquee_messages (content, is_active, target_audience)
VALUES
  ('Welcome to AI Chat Application! Explore conversations with our AI characters.', true, 'all')
ON CONFLICT DO NOTHING;

-- Add subscription plans info as a system setting
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('subscription_plans',
   '[
     {"id": "basic_monthly", "name": "Basic Plan", "price": 9.99, "currency": "USD", "interval": "month", "features": ["Unlimited conversations", "Basic characters"]},
     {"id": "premium_monthly", "name": "Premium Plan", "price": 19.99, "currency": "USD", "interval": "month", "features": ["Unlimited conversations", "All characters", "Priority support"]},
     {"id": "premium_yearly", "name": "Premium Yearly", "price": 199.99, "currency": "USD", "interval": "year", "features": ["Unlimited conversations", "All characters", "Priority support", "17% discount"]}
   ]',
   'Available subscription plans and their details')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- End of Migration
-- =====================================================
COMMENT ON DATABASE postgres IS 'AI Chat Application Schema Initialized.';