-- Migration Script: Create chat_usage table

CREATE TABLE public.chat_usage (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- Changed from SERIAL for Supabase convention
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Assumes users are in auth.users, adjust if in public.users and ensure FK is correct
  date DATE NOT NULL,
  used_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- Will be handled by existing trigger logic if function is shared
  UNIQUE (user_id, date)
);

-- Optional: Index for optimizing queries on user_id and date
CREATE INDEX idx_chat_usage_user_date ON public.chat_usage(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chat usage
CREATE POLICY "Allow individual user read access to their own chat_usage"
ON public.chat_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow backend service role to perform all operations
-- Note: Backend operations (incrementing count) should ideally use the service_role key
-- to bypass RLS. If inserts/updates are done by users directly (not recommended for this),
-- specific INSERT/UPDATE policies would be needed. For this design, we assume backend handles increments.

-- Trigger to update 'updated_at' timestamp
-- Assumes 'public.handle_updated_at()' function already exists from 'final_0505_initschema.sql'
-- and is compatible.
DROP TRIGGER IF EXISTS on_chat_usage_updated ON public.chat_usage; -- Add this to be safe
CREATE TRIGGER on_chat_usage_updated
BEFORE UPDATE ON public.chat_usage
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); -- Use existing function

COMMENT ON TABLE public.chat_usage IS 'Tracks daily chat usage for users.';
COMMENT ON COLUMN public.chat_usage.user_id IS 'Foreign key to the user who performed the chat.';
COMMENT ON COLUMN public.chat_usage.date IS 'The specific date (UTC) for which the usage is recorded.';
COMMENT ON COLUMN public.chat_usage.used_count IS 'Number of chats used by the user on this date.';
