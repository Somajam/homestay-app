import { test, expect } from '@playwright/test';

test.describe('Somajam Homestay - Comprehensive End-to-End Master Lifecycle & Edge Cases', () => {

  test('Complete End-to-End Property Operations, Attachments & Edge Scenarios', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for deep end-to-end journey

    // -------------------------------------------------------------------------
    // STEP 1: AUTHENTICATION, RBAC & SESSION SECURITY
    // -------------------------------------------------------------------------
    await page.goto('/');

    // 1.1 Verify Login Screen loads
    const autoFillBtn = page.getByRole('button', { name: 'Auto Fill' });
    await expect(autoFillBtn).toBeVisible({ timeout: 10000 });

    // 1.2 Invalid Credentials Test (with fast timeout fallback)
    await page.fill('input[placeholder="Enter admin username"]', 'unauthorized_user');
    await page.fill('input[placeholder="Enter password"]', 'wrong_pass');
    await page.click('button:has-text("Sign In to Portal")');
    await expect(page.locator('text=Invalid Username or Password')).toBeVisible({ timeout: 5000 });

    // 1.3 Caretaker Login Test
    await page.fill('input[placeholder="Enter admin username"]', 'caretaker');
    await page.fill('input[placeholder="Enter password"]', 'caretaker2026');
    await page.click('button:has-text("Sign In to Portal")');
    await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Caretaker Access')).toBeVisible();

    // Verify Caretaker restricted action: Rooms page cannot add/edit cottages
    await page.locator('a[href="/rooms"]').first().click();
    await expect(page.locator('text=Admin permissions required to add or edit rooms')).toBeVisible();

    // 1.4 Switch to Admin / Owner
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('h1:has-text("Somajam Holidays")')).toBeVisible();
    await autoFillBtn.click();
    await page.click('button:has-text("Sign In to Portal")');
    await page.locator('a[href="/"]').first().click();
    await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Admin Access')).toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 2: COTTAGE INVENTORY, DUAL RATES & AMENITIES EDITING (/rooms)
    // -------------------------------------------------------------------------
    await page.locator('a[href="/rooms"]').first().click();
    await expect(page.locator('h2:has-text("Somajam 1BHK Cottages")')).toBeVisible();

    // Verify all 5 cottages are rendered with Cottage prefix
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`h3:has-text("Cottage No. ${i}")`)).toBeVisible();
    }

    // Verify dual rate cards (Weekday vs Weekend)
    await expect(page.locator('text=Weekday Rate').first()).toBeVisible();
    await expect(page.locator('text=Weekend Rate').first()).toBeVisible();

    // Test Maintenance Toggle on Cottage No. 4
    const markMaintBtn = page.locator('div:has(h3:has-text("Cottage No. 4")) button:has-text("Mark Maintenance")').first();
    await markMaintBtn.click();
    await expect(page.locator('div:has(h3:has-text("Cottage No. 4")) span:has-text("Maintenance")').first()).toBeVisible();

    // Restore Cottage No. 4 to Available
    const setAvailBtn = page.locator('div:has(h3:has-text("Cottage No. 4")) button:has-text("Set Available")').first();
    await setAvailBtn.click();
    await expect(page.locator('div:has(h3:has-text("Cottage No. 4")) span:has-text("Available")').first()).toBeVisible();

    // Test Edit Cottage Modal (Admin role)
    const editCottageBtn = page.locator('div:has(h3:has-text("Cottage No. 1")) button[title*="Edit Cottage"]').first();
    await editCottageBtn.click();
    await expect(page.locator('h3:has-text("Edit Cottage Rates & Amenities")')).toBeVisible();

    // Add a custom amenity tag
    const customAmenityInput = page.locator('input[placeholder*="Add custom amenity"]');
    await customAmenityInput.fill('Private Plunge Pool');
    await page.click('button:has-text("Add Amenity")');

    // Save cottage changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('h3:has-text("Edit Cottage Rates & Amenities")')).not.toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 3: QUICK BOOKING MODE A, DOUBLE-BOOKING GUARD & REPEAT GUEST CHECK
    // -------------------------------------------------------------------------
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('h2:has-text("Bookings & Check-In")')).toBeVisible();

    // Ensure List / Table view is active
    await page.click('button:has-text("List / Table")');

    // Open Booking Modal
    await page.click('button:has-text("Create New Booking")');
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).toBeVisible();

    // Mode A: Quick Booking tab is active by default
    const quickTab = page.locator('button:has-text("Quick Advance Booking")');
    if (await quickTab.isVisible()) {
      await quickTab.click();
    }

    // Dates for staying in Cottage No. 1
    const today = new Date();
    const inDateStr = `${today.getFullYear()}-12-10`;
    const outDateStr = `${today.getFullYear()}-12-13`;

    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Anand Varma');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 94470 12345');

    const dateInputs = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputs.nth(0).fill(inDateStr);
    await dateInputs.nth(1).fill(outDateStr);

    // Select Room No. 1
    const room1Btn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 1")').first();
    if (await room1Btn.isVisible()) {
      await room1Btn.click();
    }

    // Submit booking
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // Verify booking appears in table
    await expect(page.locator('td:has-text("Anand Varma")').first()).toBeVisible({ timeout: 5000 });

    // --- EDGE CASE: DOUBLE-BOOKING PREVENTION GUARD ---
    await page.click('button:has-text("Create New Booking")');
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Conflicting Guest');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 99999 00000');

    const dateInputsConflict = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputsConflict.nth(0).fill(`${today.getFullYear()}-12-11`);
    await dateInputsConflict.nth(1).fill(`${today.getFullYear()}-12-14`);

    if (await room1Btn.isVisible()) {
      await room1Btn.click();
    }

    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('text=Double Booking Blocked').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();

    // --- REPEAT GUEST AUTO-RECOGNITION ---
    await page.click('button:has-text("Create New Booking")');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 94470 12345');
    // Name should auto-populate
    await expect(page.locator('input[placeholder="e.g. Rajesh Kumar"]')).toHaveValue('Anand Varma');
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();

    // -------------------------------------------------------------------------
    // STEP 4: MULTI-ROOM GROUP BOOKING CREATION WITH PRICING CALCULATION
    // -------------------------------------------------------------------------
    await page.click('button:has-text("Create New Booking")');
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Apex Tech Retreat');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 98950 88888');

    const multiInDate = `${today.getFullYear()}-12-20`;
    const multiOutDate = `${today.getFullYear()}-12-23`;
    const dateInputsMulti = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputsMulti.nth(0).fill(multiInDate);
    await dateInputsMulti.nth(1).fill(multiOutDate);

    // Enable Multi-Room mode and select both Cottage No. 2 and Cottage No. 3
    const multiRoomCheckbox = page.locator('label:has-text("Book Multiple Cottages") input');
    if (await multiRoomCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await multiRoomCheckbox.check();
    }
    const room2Btn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 2")').first();
    const room3Btn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 3")').first();
    await room2Btn.click();
    await room3Btn.click();

    // Verify stay calculation is displayed
    await expect(page.locator('text=Stay Pricing Calculation & Breakdown').first()).toBeVisible();

    // Submit multi-room booking
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // Verify both sub-bookings appear with suffixes in the table
    await expect(page.locator('td:has-text("Apex Tech Retreat")').first()).toBeVisible();
    await expect(page.locator('td:has-text("No. 2")').first()).toBeVisible();
    await expect(page.locator('td:has-text("No. 3")').first()).toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 5: DETAILED WALK-IN BOOKING (MODE B) WITH MULTIPLE ATTACHMENTS
    // -------------------------------------------------------------------------
    await page.click('button:has-text("Create New Booking")');

    // Switch to Detailed Booking Mode B
    await page.click('button:has-text("Detailed Walk-In & Instant Check-In")');

    // Fill walk-in guest details
    await page.fill('input[placeholder="e.g. Sarah Jenkins"]', 'Priya Nair');
    await page.fill('input[placeholder="+91 / International"]', '+91 98460 54321');
    await page.fill('input[placeholder="ID / Passport Number"]', '9876 5432 1098');
    await page.fill('input[placeholder="City, State, Country"]', 'Kozhikode, Kerala');

    // Dates for today
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dateInputsDetailed = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputsDetailed.nth(0).fill(todayStr);
    await dateInputsDetailed.nth(1).fill(tomorrowStr);

    // Select Cottage No. 5
    const room5Btn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 5")').first();
    await room5Btn.click();

    // Attach simulated multiple ID photo files
    const fileInputDetailed = page.locator('.fixed.inset-0.z-50 input[type="file"]').first();
    await fileInputDetailed.setInputFiles([
      {
        name: 'priya_aadhaar_front.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-aadhaar-front-image-buffer-data'),
      },
      {
        name: 'priya_passport_scan.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-passport-image-buffer-data'),
      },
    ]);

    // Verify staged attachments list
    await expect(page.locator('text=priya_aadhaar_front.jpg').first()).toBeVisible({ timeout: 5000 });

    // Submit detailed walk-in booking
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // Verify Priya Nair is Checked In immediately
    await expect(page.locator('tr:has-text("Priya Nair") span:has-text("Checked In")').first()).toBeVisible({ timeout: 5000 });

    // -------------------------------------------------------------------------
    // STEP 6: CHECK-IN WORKFLOW, SAVING ID ATTACHMENTS & THUMBNAILS
    // -------------------------------------------------------------------------
    // Check in Anand Varma (Cottage No. 1)
    const anandRow = page.locator('tr:has-text("Anand Varma")');
    await expect(anandRow).toBeVisible();
    await anandRow.locator('button:has-text("Check In")').click();

    // Verify Check-In modal
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).toBeVisible();

    // Fill ID Number
    await page.fill('input[placeholder="e.g. 5489 1234 8901"]', '5555 4444 3333');

    // Attach ID photo
    const checkInFileInput = page.locator('.fixed.inset-0.z-50 input[type="file"]').first();
    await checkInFileInput.setInputFiles([
      {
        name: 'anand_aadhaar_card.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-aadhaar-image-buffer-for-anand'),
      },
    ]);

    // Verify thumbnail card appears
    await expect(page.locator('text=anand_aadhaar_card.jpg')).toBeVisible();

    // Confirm Check-In
    await page.click('button:has-text("Confirm Check-In")');
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).not.toBeVisible();

    // Verify status updated to Checked In
    await expect(page.locator('tr:has-text("Anand Varma") span:has-text("Checked In")')).toBeVisible({ timeout: 5000 });

    // -------------------------------------------------------------------------
    // STEP 7: MONTHLY CALENDAR VIEW & BOOKING AUDIT LOGS
    // -------------------------------------------------------------------------
    // 7.1 Switch to Monthly Calendar View
    await page.click('button:has-text("Monthly Calendar")');
    await expect(page.locator('button:has-text("Today")')).toBeVisible();

    // Test Cottage Filter in Calendar View
    const cottageFilterSelect = page.locator('select').first();
    await cottageFilterSelect.selectOption({ label: 'All Cottages (5)' });

    // 7.2 Open Booking Activity Log Modal
    await page.click('button:has-text("Activity Log")');
    await expect(page.locator('h3:has-text("Booking Activity & Audit Log")')).toBeVisible();

    // Verify audit logs contain CREATED and CHECKED_IN events
    await expect(page.locator('span:has-text("New Booking")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Checked In")').first()).toBeVisible();

    // Close audit modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Close")').click();
    await expect(page.locator('h3:has-text("Booking Activity & Audit Log")')).not.toBeVisible();

    // Switch back to List view
    await page.click('button:has-text("List / Table")');

    // -------------------------------------------------------------------------
    // STEP 8: GUEST DIRECTORY, 3-TAB DRAWER & DOCUMENT VIEWER (/guests)
    // -------------------------------------------------------------------------
    await page.locator('a[href="/guests"]').first().click();
    await expect(page.locator('h2:has-text("Guest Directory & Document Archives")')).toBeVisible();

    // Verify guests exist in table
    await expect(page.locator('td:has-text("Anand Varma")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Priya Nair")').first()).toBeVisible();

    // Test Compliance Filter: Has ID Uploaded
    const docComplianceSelect = page.locator('select').first();
    await docComplianceSelect.selectOption('has_id');
    await page.waitForTimeout(300);
    await expect(page.locator('td:has-text("Priya Nair")').first()).toBeVisible();

    // Open Priya Nair 3-Tab Drawer
    await page.click('td:has-text("Priya Nair")');
    await expect(page.locator('h3:has-text("Priya Nair")')).toBeVisible();

    // Tab 1: Personal Details
    await expect(page.locator('text=Kozhikode, Kerala').first()).toBeVisible();

    // Tab 2: Stay History
    await page.click('button:has-text("Stays History")');
    await expect(page.locator('text=No. 5').first()).toBeVisible();

    // Tab 3: Document Archives & Preview in DocumentViewerModal
    await page.click('button:has-text("Documents")');
    await expect(page.locator('text=priya_aadhaar_front.jpg').first()).toBeVisible();

    // Open Document Preview Modal
    const viewDocBtn = page.locator('button:has-text("View")').first();
    await viewDocBtn.click();
    await expect(page.locator('text=Verified ID').first()).toBeVisible();

    // Close Document Preview
    await page.locator('button:has-text("Close Document")').click();
    await page.waitForTimeout(300);

    // Close Drawer
    await page.locator('button[aria-label="Close modal"]').last().click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // STEP 9: CHECK-OUT WORKFLOW & ROOM RELEASE BACK TO AVAILABLE
    // -------------------------------------------------------------------------
    await page.locator('a[href="/bookings"]').first().click();

    // Check out Priya Nair (Cottage No. 5)
    const priyaBookingRow = page.locator('tr:has-text("Priya Nair")').first();
    await expect(priyaBookingRow).toBeVisible();
    await priyaBookingRow.locator('button:has-text("Check Out")').click();

    // Verify Check-Out modal
    await expect(page.locator('h3:has-text("Guest Check-Out Process")')).toBeVisible();
    await expect(page.locator('text=Room inspected & key returned by guest')).toBeVisible();

    // Complete Check-Out
    await page.click('button:has-text("Complete Check-Out & Release Room")');
    await expect(page.locator('h3:has-text("Guest Check-Out Process")')).not.toBeVisible();

    // Verify checked-out booking appears under Checked Out tab
    await page.click('button:has-text("Checked Out")');
    await expect(page.locator('tr:has-text("Priya Nair") span:has-text("Stay Completed")').first()).toBeVisible({ timeout: 5000 });

    // Verify Cottage No. 5 is back to Available on Rooms page
    await page.locator('a[href="/rooms"]').first().click();
    await expect(page.locator('div:has(h3:has-text("Cottage No. 5")) span:has-text("Available")').first()).toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 10: CANCELLATION WORKFLOW
    // -------------------------------------------------------------------------
    await page.locator('a[href="/bookings"]').first().click();

    // Cancel one of the Apex Tech Retreat sub-bookings
    const retreatRow = page.locator('tr:has-text("Apex Tech Retreat")').first();
    await expect(retreatRow).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await retreatRow.locator('button[title="Cancel Reservation"]').click();

    // Verify status becomes Cancelled under Cancelled tab
    await page.click('button:has-text("Cancelled")');
    await expect(page.locator('tr:has-text("Apex Tech Retreat") span:has-text("Cancelled")').first()).toBeVisible({ timeout: 5000 });

    // -------------------------------------------------------------------------
    // STEP 11: EXPENSE TRACKER, ATTACHMENTS, REIMBURSEMENT & SECURITY CONSTRAINTS
    // -------------------------------------------------------------------------
    await page.locator('a[href="/expenses"]').first().click();
    await expect(page.locator('h2:has-text("Expense Tracker & Settlement Ledger")')).toBeVisible();

    // Summary Metric Cards
    await expect(page.locator('text=Total Outlay Logged')).toBeVisible();
    await expect(page.locator('text=Pending Reimbursements')).toBeVisible();

    // Log New Expense
    await page.click('button:has-text("Log New Expense")');
    await expect(page.locator('h3:has-text("Log New Homestay Expense")')).toBeVisible();

    // Select Payer: Director 1 (Ramesh)
    await page.locator('.fixed.inset-0.z-50 select').nth(0).selectOption({ label: 'Director 1 (Ramesh) (Director)' });
    await page.fill('input[placeholder="e.g. 2500"]', '4500');

    // Select Reimbursement Status: Pending Reimbursement
    const reimbSelect = page.locator('.fixed.inset-0.z-50 select').nth(3);
    await reimbSelect.selectOption('Pending Reimbursement');

    // Description
    await page.fill('textarea[placeholder*="Purchased extra campfire wood"]', 'Campfire Wood Supply & Firewood Stash');

    // Attach receipt photo
    const expFileInput = page.locator('.fixed.inset-0.z-50 input[type="file"]').first();
    await expFileInput.setInputFiles([
      {
        name: 'firewood_receipt.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-firewood-receipt-image-data'),
      },
    ]);

    // Submit expense
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("Log New Homestay Expense")')).not.toBeVisible();

    // Verify expense appears in table
    await expect(page.locator('td:has-text("Campfire Wood Supply")').first()).toBeVisible();

    // Toggle status to Settled
    const pendingReimbBadge = page.locator('tr:has-text("Campfire Wood Supply") button:has-text("Due Reimbursement")').first();
    await pendingReimbBadge.click();
    await expect(page.locator('tr:has-text("Campfire Wood Supply") button:has-text("Settled")').first()).toBeVisible();

    // --- SECURITY CONSTRAINTS: USER DELETION PROTECTION ---
    await page.click('button:has-text("Manage Accounts")');
    await expect(page.locator('h3:has-text("Manage Expense Accounts & Users")')).toBeVisible();

    // Attempt to delete Director 1 who has active expenses
    const deleteDirector1Btn = page.locator('button[title*="Cannot delete user"]').first();
    await deleteDirector1Btn.click();
    await expect(page.locator('text=Cannot Delete User').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.fixed.inset-0.z-50 button[aria-label="Close modal"]').click();

    // --- SECURITY CONSTRAINTS: TRANSACTION DELETION AUTHORIZATION ---
    // Switch active operating user to Director 2
    const activeUserSelect = page.locator('div:has-text("Active User:") select').first();
    await activeUserSelect.selectOption({ label: 'Director 2 (Sarah) (Director)' });
    await page.waitForTimeout(300);

    // Attempt to delete Director 1's transaction
    await page.locator('tr:has-text("Campfire Wood Supply") button[title*="Delete Expense"]').first().click();
    await expect(page.locator('text=Permission Blocked').first()).toBeVisible({ timeout: 5000 });

    // Switch active operating user back to Director 1 and delete successfully
    await activeUserSelect.selectOption({ label: 'Director 1 (Ramesh) (Director)' });
    await page.waitForTimeout(800);
    await page.locator('tr:has-text("Campfire Wood Supply") button[title*="Delete Expense"]').first().click();
    await expect(page.locator('text=Expense entry removed').first()).toBeVisible({ timeout: 8000 });

    // -------------------------------------------------------------------------
    // STEP 12: REPORTS & SETTINGS 5-TAB SUITE, ZIP ARCHIVES & STORAGE PURGE
    // -------------------------------------------------------------------------
    await page.locator('a[href="/reports-settings"]').first().click();
    await expect(page.locator('text=Analytics Reports, Guest Register & Archives')).toBeVisible();

    // 12.1 Tab 1: Date-Wise Guest Register
    const registerTab = page.locator('button:has-text("Date-Wise Guest Register")');
    await registerTab.click();

    // Select "All Stays" preset
    await page.click('button:has-text("All Stays")');
    await page.waitForTimeout(300);

    // Verify Anand Varma and Priya Nair appear in register
    await expect(page.locator('td:has-text("Anand Varma")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Priya Nair")').first()).toBeVisible();

    // Export Date-Wise CSV
    const csvDownloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.click('button:has-text("Export Date-Wise CSV")');
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toContain('Somajam_Guest_Register');

    // 12.2 Tab 2: Monthly Visitor Archive & Storage Manager
    const archiveTab = page.locator('button:has-text("Monthly Archive & Free-Tier Storage")');
    await archiveTab.click();

    // Verify Supabase Cloud Storage Barometer
    await expect(page.locator('text=Supabase Cloud Free-Tier Storage Monitor')).toBeVisible();

    // Download Monthly Archive .ZIP
    const zipDownloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Archive (.ZIP)")');
    const zipDownload = await zipDownloadPromise;
    expect(zipDownload.suggestedFilename()).toContain('.zip');

    // Free Up Cloud Storage Purge Modal
    await page.click('button:has-text("Free Up Cloud Storage")');
    await expect(page.locator('h3:has-text("Reclaim Cloud Storage")')).toBeVisible();
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();
    await expect(page.locator('h3:has-text("Reclaim Cloud Storage")')).not.toBeVisible();

    // 12.3 Tab 3: Occupancy Analytics
    await page.click('button:has-text("Occupancy Analytics")');
    await expect(page.locator('text=Live Occupancy Rate')).toBeVisible();

    // 12.4 Tab 4: Historical Stays
    await page.click('button:has-text("Stays & Cancellation Logs")');
    await expect(page.locator('text=Completed Stays Log').first()).toBeVisible();

    // 12.5 Tab 5: Staff Administration
    await page.click('button:has-text("Staff Directory")');
    await expect(page.locator('text=Staff Accounts & Access Controls')).toBeVisible();

    // Add Staff Member
    await page.click('button:has-text("Add Staff Member")');
    await page.fill('input[placeholder="e.g. Rahul Varma"]', 'Suresh Menon');
    await page.fill('input[placeholder="rahul@rejchachan.com"]', 'suresh@somajamholidays.com');
    await page.fill('input[placeholder="+91 98460 00000"]', '+91 94470 99887');
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();

    // Verify Suresh Menon appears in staff directory
    await expect(page.locator('h4:has-text("Suresh Menon")').first()).toBeVisible();
  });

});
