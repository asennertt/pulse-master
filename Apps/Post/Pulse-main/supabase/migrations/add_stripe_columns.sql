-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jfyfbjybbbsiovihrpal/sql/new

-- Add Stripe columns to dealerships table
ALTER TABLE public.dealerships 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_dealerships_stripe_customer_id 
ON public.dealerships(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;
