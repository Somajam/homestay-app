-- ====================================================================
-- SOMAJAM HOLIDAYS, PARUNTHUMPARA - SUPABASE DATABASE SCHEMA & SEED
-- Run this complete script in Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- 1. Create Rooms Table (5 1BHK Cottages)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL DEFAULT '1BHK Cottage',
  capacity INT NOT NULL DEFAULT 4,
  facilities TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Available',
  weekday_rate NUMERIC NOT NULL DEFAULT 3500,
  weekend_rate NUMERIC NOT NULL DEFAULT 4500,
  price_per_night NUMERIC NOT NULL DEFAULT 3500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS weekday_rate NUMERIC DEFAULT 3500;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS weekend_rate NUMERIC DEFAULT 4500;

-- 2. Create Guests Master Table
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  nationality TEXT NOT NULL DEFAULT 'Indian',
  id_document_type TEXT NOT NULL DEFAULT 'Aadhaar',
  id_document_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_ref TEXT NOT NULL UNIQUE,
  guest_id TEXT NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Documents Table (ID Proof Archives)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  uploaded_by TEXT DEFAULT 'Staff',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Staff Directory Table
CREATE TABLE IF NOT EXISTS public.staff_list (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  title TEXT NOT NULL DEFAULT 'Operations Staff',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Admin Users Table (For Supabase Login Credentials Management)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Admin User
INSERT INTO public.admin_users (id, username, password, full_name)
VALUES ('adm-001', 'admin', 'somajam2026', 'Somajam Admin')
ON CONFLICT (username) DO NOTHING;

-- 6. Enable Row Level Security & Allow Anonymous Read/Write Access for Staff App
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read write rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write staff_list" ON public.staff_list FOR ALL USING (true) WITH CHECK (true);

-- 7. Create Expense Payers Table
CREATE TABLE IF NOT EXISTS public.expense_payers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_tag TEXT NOT NULL DEFAULT 'Director', -- 'Director', 'Caretaker', 'Common Pool', 'Partner'
  phone TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payer_id TEXT NOT NULL REFERENCES public.expense_payers(id) ON DELETE CASCADE,
  payer_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Utilities', 'Maintenance', 'Staff Wages', 'Guest Amenities', 'Food & Kitchen', 'Govt Taxes', 'Miscellaneous'
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'UPI', -- 'Cash', 'UPI', 'Bank Transfer', 'Card'
  description TEXT NOT NULL,
  receipt_url TEXT,
  reimbursement_status TEXT NOT NULL DEFAULT 'Settled', -- 'Settled' | 'Pending Reimbursement'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Expenses
ALTER TABLE public.expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read write expense_payers" ON public.expense_payers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 9. Setup Storage Bucket for Guest ID Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-documents', 'guest-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow storage read write" ON storage.objects
FOR ALL USING (bucket_id = 'guest-documents') WITH CHECK (bucket_id = 'guest-documents');

-- ====================================================================
-- SEED MASTER DATA ONLY (5 1BHK COTTAGES, STAFF & EXPENSE PAYERS)
-- Transaction data (Guests, Bookings, Expenses, Documents) starts empty for live testing
-- ====================================================================

-- OPTIONAL CLEANUP SCRIPT: Run below statements to wipe existing dummy records from Supabase:
-- TRUNCATE TABLE public.bookings CASCADE;
-- TRUNCATE TABLE public.guests CASCADE;
-- TRUNCATE TABLE public.expenses CASCADE;
-- TRUNCATE TABLE public.documents CASCADE;
-- UPDATE public.rooms SET status = 'Available';

-- Seed Rooms Master Configuration (No. 1 to No. 5 - all Available)
INSERT INTO public.rooms (id, room_number, room_type, capacity, facilities, status, weekday_rate, weekend_rate, price_per_night) VALUES
('room-1', 'No. 1', '1BHK Cottage', 4, ARRAY['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Audio System', 'Grilling Area'], 'Available', 3500, 4500, 3500),
('room-2', 'No. 2', '1BHK Cottage', 4, ARRAY['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Valley View Patio', 'Campfire Zone'], 'Available', 3500, 4500, 3500),
('room-3', 'No. 3', '1BHK Cottage', 4, ARRAY['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Private Balcony', 'Hot Shower'], 'Available', 3500, 4500, 3500),
('room-4', 'No. 4', '1BHK Cottage', 4, ARRAY['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Drivers Lounge Access', 'Audio System'], 'Available', 3500, 4500, 3500),
('room-5', 'No. 5', '1BHK Cottage', 5, ARRAY['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Full Kitchen', 'Campfire Area', 'Mountain View'], 'Available', 4000, 5000, 4000)
ON CONFLICT (id) DO UPDATE SET
  weekday_rate = EXCLUDED.weekday_rate,
  weekend_rate = EXCLUDED.weekend_rate,
  status = EXCLUDED.status;

-- Seed Staff Master List
INSERT INTO public.staff_list (id, full_name, role, title, email, phone, status) VALUES
('stf-001', 'Somajam Management Team', 'admin', 'Property Manager', 'somajamholidays@gmail.com', '+91 92499 59035', 'Active'),
('stf-002', 'Front Desk Staff', 'staff', 'Guest Associate', 'help@somajamholidays.com', '+91 92499 59035', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Seed Expense Payers Master List (5 Directors, 1 Caretaker, 1 Common Bucket)
INSERT INTO public.expense_payers (id, name, group_tag, phone, upi_id) VALUES
('pyr-common', 'Common Homestay Account', 'Common Pool', '+91 92499 59035', 'somajam@upi'),
('pyr-dir1', 'Director 1 (Ramesh)', 'Director', '+91 98470 11111', 'ramesh@upi'),
('pyr-dir2', 'Director 2 (Sarah)', 'Director', '+91 98470 22222', 'sarah@upi'),
('pyr-dir3', 'Director 3 (George)', 'Director', '+91 98470 33333', 'george@upi'),
('pyr-dir4', 'Director 4 (Anish)', 'Director', '+91 98470 44444', 'anish@upi'),
('pyr-dir5', 'Director 5 (Deepa)', 'Director', '+91 98470 55555', 'deepa@upi'),
('pyr-caretaker', 'Caretaker (Joy)', 'Caretaker', '+91 92499 59000', 'joycaretaker@upi')
ON CONFLICT (id) DO NOTHING;

