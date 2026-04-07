-- Create Deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "from" TEXT NOT NULL,
  from_code TEXT NOT NULL,
  "to" TEXT NOT NULL,
  to_code TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('asia', 'europe', 'americas', 'oceania', 'africa', 'middle_east', 'domestic')),
  image TEXT NOT NULL,
  price BIGINT NOT NULL,
  normal_price BIGINT NOT NULL,
  discount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  airline TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE NOT NULL,
  duration TEXT NOT NULL,
  stops INT NOT NULL DEFAULT 0,
  stop_city TEXT,
  seats_left INT NOT NULL DEFAULT 0,
  expires_in TEXT NOT NULL,
  ai_insight JSONB NOT NULL,
  hidden_costs JSONB NOT NULL,
  advertised_total BIGINT NOT NULL,
  real_total BIGINT NOT NULL,
  is_trending BOOLEAN DEFAULT FALSE,
  is_flash_deal BOOLEAN DEFAULT FALSE,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('international', 'domestic')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Price History table for anomaly detection
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_code TEXT NOT NULL,
  to_code TEXT NOT NULL,
  date DATE NOT NULL,
  price BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create User Alerts table
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  destination TEXT NOT NULL,
  budget BIGINT,
  notify_telegram BOOLEAN DEFAULT FALSE,
  telegram_id TEXT,
  notify_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Simplified for v1)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Allow users to manage only their alerts" ON public.user_alerts USING (auth.uid() = user_id);
