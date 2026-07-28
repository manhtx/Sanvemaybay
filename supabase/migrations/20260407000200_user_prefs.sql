BEGIN;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_max NUMERIC DEFAULT 10000000, -- Default max budget 10m VND
    preferred_regions TEXT[] DEFAULT ARRAY['Domestic', 'International'],
    alert_frequency TEXT DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
    excluded_airlines TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_modtime
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMIT;
