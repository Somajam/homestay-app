-- ====================================================================
-- SOMAJAM HOLIDAYS - CLEAN TRANSACTION DATA SCRIPT (PRE-DELIVERY WIPE)
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- 
-- PURPOSE:
-- Cleans all testing/temporary transaction data before client delivery:
--   ✓ Wipes all Bookings (public.bookings)
--   ✓ Wipes all Guests and their contact details (public.guests)
--   ✓ Wipes all ID Document scan records (public.documents)
--   ✓ Wipes all Booking Audit Logs & activity history (public.booking_audit_logs)
--   ✓ Deletes all uploaded attachments/scans from Storage (bucket: guest-documents)
--   ✓ Resets all 5 Cottage room statuses to 'Available'
--
-- PRESERVES MASTER DATA (DOES NOT TOUCH OR MODIFY):
--   ★ Master Room Details, Weekend/Weekday Pricing, Capacity & Amenities (public.rooms)
--   ★ Expense Payers / Users for Expense Tracker: 5 Directors, Caretaker, Common Pool (public.expense_payers)
--   ★ Staff Master Directory (public.staff_list)
--   ★ Admin & Caretaker Authentication Credentials (public.admin_users)
-- ====================================================================

-- 1. Remove all bookings transaction records
TRUNCATE TABLE public.bookings CASCADE;

-- 2. Remove all guest profiles, phone numbers, contact info & ID documents
TRUNCATE TABLE public.guests CASCADE;

-- 3. Remove all guest document upload metadata
TRUNCATE TABLE public.documents CASCADE;

-- 4. Remove all booking lifecycle audit trails & activity timestamps
TRUNCATE TABLE public.booking_audit_logs CASCADE;

-- 5. Delete all uploaded file attachments from Supabase Cloud Storage
DELETE FROM storage.objects WHERE bucket_id = 'guest-documents';

-- 6. Ensure all 5 cottages are marked 'Available' (ready for real client check-ins)
UPDATE public.rooms 
SET status = 'Available'
WHERE status != 'Available';

-- Optional: If you also want to remove test expenses logged during testing, uncomment below:
-- TRUNCATE TABLE public.expenses CASCADE;

-- ====================================================================
-- VERIFICATION QUERY
-- Run this block to confirm transaction tables are empty and master data is intact:
-- ====================================================================
SELECT 'bookings' AS table_name, count(*) AS record_count FROM public.bookings
UNION ALL
SELECT 'guests', count(*) FROM public.guests
UNION ALL
SELECT 'documents', count(*) FROM public.documents
UNION ALL
SELECT 'booking_audit_logs', count(*) FROM public.booking_audit_logs
UNION ALL
SELECT 'rooms (master - preserved)', count(*) FROM public.rooms
UNION ALL
SELECT 'expense_payers (master - preserved)', count(*) FROM public.expense_payers
UNION ALL
SELECT 'staff_list (master - preserved)', count(*) FROM public.staff_list
UNION ALL
SELECT 'admin_users (master - preserved)', count(*) FROM public.admin_users;

