-- ====================================================================
-- MIGRATION: ADD BILL AMOUNT, REFERRAL, COMMISSION & ROOM EXPENSES
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS bill_amount NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_amount_received NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS referral_commission NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_expenses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_nights INT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS weekday_nights INT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS weekend_nights INT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS weekday_rate NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS weekend_rate NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;

