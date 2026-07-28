-- Add real booking_url and flight number to deals table

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS booking_url TEXT,
ADD COLUMN IF NOT EXISTS flight_number TEXT;
