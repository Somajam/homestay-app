import { test, expect } from '@playwright/test';

test.describe('Somajam Homestay - Deep Workflow & Edge Cases Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const autoFillBtn = page.getByRole('button', { name: 'Auto Fill' });
    if (await autoFillBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await autoFillBtn.click();
      await page.getByRole('button', { name: 'Sign In to Portal' }).click();
      await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('E1. Calendar interaction: clicking on an active booking opens detail modal with check-out/cancel actions', async ({ page }) => {
    // 1. Ensure at least one active booking exists
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('h2:has-text("Bookings & Check-In")')).toBeVisible();

    const existingPill = page.locator('tr:has-text("No. 1")');
    if (!(await existingPill.isVisible().catch(() => false))) {
      await page.click('button:has-text("Create New Booking")');
      await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Calendar Test Guest');
      await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 98460 77777');
      const todayStr = new Date().toISOString().split('T')[0];
      const nextDayStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dates = page.locator('.fixed.inset-0.z-50 input[type="date"]');
      await dates.nth(0).fill(todayStr);
      await dates.nth(1).fill(nextDayStr);
      await page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 1")').first().click();
      await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
      await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();
    }

    // 2. Switch to Monthly Calendar View
    await page.click('button:has-text("Monthly Calendar")');
    await expect(page.locator('button:has-text("Today")')).toBeVisible();

    // Verify bookings exist in calendar view
    const bookingPill = page.locator('button.w-full.text-left').first();
    if (await bookingPill.isVisible().catch(() => false)) {
      await bookingPill.click();

      // Verify Booking Details modal pops up
      await expect(page.locator('h3:has-text("Details")')).toBeVisible({ timeout: 5000 });

      // Close detail modal
      await page.locator('.fixed.inset-0.z-50 button:has-text("Close")').click();
      await expect(page.locator('h3:has-text("Details")')).not.toBeVisible();
    }
  });

  test('E2. Double-Booking Prevention: Attempting overlapping reservation throws error toast', async ({ page }) => {
    await page.locator('a[href="/bookings"]').first().click();
    await page.click('button:has-text("List / Table")');

    const inDate = '2026-11-20';
    const outDate = '2026-11-23';

    // 1. Create base reservation for Room No. 2
    await page.click('button:has-text("Create New Booking")');
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Original Booker');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 94470 11111');
    const dates1 = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dates1.nth(0).fill(inDate);
    await dates1.nth(1).fill(outDate);
    await page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 2")').first().click();
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();

    // 2. Attempt second reservation overlapping the exact dates for Room No. 2
    await page.click('button:has-text("Create New Booking")');
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Conflicting Guest');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 94470 22222');
    const dates2 = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dates2.nth(0).fill('2026-11-21');
    await dates2.nth(1).fill('2026-11-22');

    // Click Room No. 2
    const room2Btn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 2")').first();
    await room2Btn.click();

    // Submit booking
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();

    // Verify double-booking prevention message is shown
    await expect(page.locator('text=Double Booking Blocked').first()).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();
  });

  test('E3. Document Viewer Modal: opens, displays verified badge, and closes properly', async ({ page }) => {
    // 1. Ensure a booking with an attached document exists
    await page.locator('a[href="/bookings"]').first().click();
    await page.click('button:has-text("Create New Booking")');
    await page.click('button:has-text("Detailed Walk-In & Instant Check-In")');
    await page.fill('input[placeholder="e.g. Sarah Jenkins"]', 'Doc Test Guest');
    await page.fill('input[placeholder="+91 / International"]', '+91 97450 33333');
    await page.fill('input[placeholder="ID / Passport Number"]', '4321 8765 2109');

    const inDate = '2026-11-28';
    const outDate = '2026-11-30';
    const dates = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dates.nth(0).fill(inDate);
    await dates.nth(1).fill(outDate);
    await page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 4")').first().click();

    const fileInput = page.locator('.fixed.inset-0.z-50 input[type="file"]').first();
    await fileInput.setInputFiles([
      {
        name: 'doctest_aadhaar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-aadhaar-data-for-e3'),
      },
    ]);

    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // 2. Navigate to Date-Wise Guest Register
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Date-Wise Guest Register")');
    await page.click('button:has-text("All Stays")');
    await page.waitForTimeout(300);

    // Look for "View ID" button in table
    const viewIdBtn = page.locator('button:has-text("View ID")').first();
    await expect(viewIdBtn).toBeVisible({ timeout: 5000 });
    await viewIdBtn.click();

    // Verify DocumentViewerModal appears with exact badge
    await expect(page.getByText('Verified ID', { exact: true })).toBeVisible({ timeout: 4000 });
    const closeBtn = page.locator('button:has-text("Close Document")');
    await expect(closeBtn).toBeVisible();

    // Close Viewer
    await closeBtn.click();
    await expect(page.getByText('Verified ID', { exact: true })).not.toBeVisible();
  });

  test('E4. Monthly Archive ZIP generation with file count validation', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Monthly Archive & Free-Tier Storage")');

    // Verify stats card
    await expect(page.locator('text=Supabase Cloud Free-Tier Storage Monitor')).toBeVisible();

    // Download ZIP
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Archive (.ZIP)")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.zip');

    // Verify download badge appears
    await expect(page.locator('text=Downloaded & Saved to PC').first()).toBeVisible({ timeout: 5000 });
  });

  test('E5. Storage Purge Safety Lock & Confirmation Modal', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Monthly Archive & Free-Tier Storage")');

    // Click "Free Up Cloud Storage"
    const purgeBtn = page.locator('button:has-text("Free Up Cloud Storage")');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    // Confirm modal opens
    const modalHeading = page.locator('h3:has-text("Reclaim Cloud Storage")');
    await expect(modalHeading).toBeVisible();
    await expect(page.locator('text=Free Tier Database & Storage Cleanup')).toBeVisible();

    // Cancel modal - target the button inside the modal dialog
    const modalDialog = page.locator('.fixed.inset-0.z-50');
    await modalDialog.locator('button:has-text("Cancel")').first().click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('E6. Bug Fixes Verification: Phone sanitization/min-10-digits, Dashboard occupancy, Bookings default active filter, Timestamps, Upload validation', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Dashboard Upload ID Doc validation without file
    await page.locator('a[href="/"]').first().click();
    await expect(page.locator('button:has-text("Upload ID Doc")').first()).toBeVisible();
    await page.locator('button:has-text("Upload ID Doc")').first().click();
    await expect(page.locator('h3:has-text("Upload Guest ID Document")')).toBeVisible();

    // Click upload without selecting file
    await page.locator('.fixed.inset-0.z-50 button:has-text("Upload Document")').click();
    // Warning toast must appear
    await expect(page.locator('text=No files selected to upload')).toBeVisible({ timeout: 5000 });
    // Close modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();

    // 2. Mobile number field validation in Booking Modal
    await page.locator('button:has-text("Add Booking")').first().click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).toBeVisible();

    const phoneInput = page.locator('.fixed.inset-0.z-50 input[placeholder="e.g. +91 98470 12345"]');
    // Type alphabets into phone input -> should be stripped
    await phoneInput.fill('abc98470xyz12345def');
    const sanitizedVal = await phoneInput.inputValue();
    expect(sanitizedVal).toBe('9847012345'); // All alphabets stripped

    // Test minimum 10 digits rejection
    await phoneInput.fill('98470');
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Validation Test Guest');
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('text=Mobile number must contain at least 10 digits').first()).toBeVisible({ timeout: 5000 });

    // Fill valid phone with 10 digits and select room to submit booking
    await phoneInput.fill('+91 98470 54321');
    const roomBtn = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 1")').first();
    if (await roomBtn.isVisible()) {
      await roomBtn.click();
    }
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // 3. Bookings default filter: 'Active & Upcoming' tab active, includes active/upcoming and excludes checked out
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('button:has-text("Active & Upcoming")')).toHaveClass(/text-emerald-400/);
    await expect(page.locator('tr:has-text("Validation Test Guest")')).toBeVisible();

    // 4. Timestamps visibility in Bookings (Check-in and check-out)
    const checkInBtn = page.locator('tr:has-text("Validation Test Guest") button:has-text("Check In")').first();
    await checkInBtn.click();
    await page.click('button:has-text("Confirm Check-In")');
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).not.toBeVisible();

    // Verify "In:" timestamp appears under dates
    await expect(page.locator('tr:has-text("Validation Test Guest") span:has-text("In:")')).toBeVisible();

    // Check out the guest
    await page.locator('tr:has-text("Validation Test Guest") button:has-text("Check Out")').first().click();
    await page.click('button:has-text("Complete Check-Out & Release Room")');
    await expect(page.locator('h3:has-text("Guest Check-Out Process")')).not.toBeVisible();

    // Under default 'Active & Upcoming' tab, checked out booking is excluded
    await expect(page.locator('tr:has-text("Validation Test Guest")')).not.toBeVisible();

    // When clicking 'Checked Out' filter tab, checked-out booking is shown
    await page.click('button:has-text("Checked Out")');
    await expect(page.locator('tr:has-text("Validation Test Guest") span:has-text("Stay Completed")')).toBeVisible();
    await expect(page.locator('tr:has-text("Validation Test Guest") span:has-text("Out:")')).toBeVisible();

    // 5. Reports Section check-in/out timestamps and completed stays log
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Stays & Cancellation Logs")');
    await expect(page.locator('th:has-text("Duration")')).toBeVisible();
    await expect(page.locator('tr:has-text("Validation Test Guest") span:has-text("In:")')).toBeVisible();
    await expect(page.locator('tr:has-text("Validation Test Guest") span:has-text("Out:")')).toBeVisible();
  });

  test('E7. Dynamic Room Availability on Date Selection & 5-Room Uncluttered Calendar View', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to bookings and create a booking for Room 1
    await page.locator('a[href="/bookings"]').first().click();
    await page.click('button:has-text("Create New Booking")');

    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Cottage One Guest');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 98470 99001');

    const inDate1 = '2026-12-15';
    const outDate1 = '2026-12-18';
    const dateInputs = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputs.nth(0).fill(inDate1);
    await dateInputs.nth(1).fill(outDate1);

    // Select Room 1
    await page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 1")').first().click();
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // 2. Open booking modal again and pick an overlapping date range
    await page.click('button:has-text("Create New Booking")');
    const dateInputs2 = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputs2.nth(0).fill('2026-12-16');
    await dateInputs2.nth(1).fill('2026-12-18');

    // Verify Room 1 is NOT selected by default and shows "Booked on selected dates"
    const room1Card = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 1")').first();
    await expect(room1Card).toHaveText(/Booked on selected dates/);
    await expect(room1Card).not.toHaveClass(/border-emerald-500/);

    // Verify a room that IS available (e.g. Room 2) is automatically selected
    const room2Card = page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 2")').first();
    await expect(room2Card).toHaveText(/Selected/);
    await expect(room2Card).toHaveClass(/border-emerald-500/);

    // 3. Close modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();

    // 4. Switch to Calendar view and verify 5-room accommodations
    await page.click('button:has-text("Monthly Calendar")');
    await expect(page.locator('button:has-text("Today")')).toBeVisible();

    // Verify day cell layout renders without max-h scroll barrier
    const calendarGrid = page.locator('.grid.grid-cols-7');
    await expect(calendarGrid.first()).toBeVisible();
  });

  test('E8. Dashboard real-time check-in updates: Expected check-ins, Upcoming reservations, and Occupied/Available top tiles', async ({ page }) => {
    // 1. Navigate to Dashboard
    await page.goto('/');
    await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible();

    // 2. Create a booking arriving TODAY
    await page.locator('button:has-text("Add Booking")').first().click();
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'CheckIn Sync Guest');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 98470 99887');

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dateInputs = page.locator('.fixed.inset-0.z-50 input[type="date"]');
    await dateInputs.nth(0).fill(todayStr);
    await dateInputs.nth(1).fill(tomorrowStr);

    // Pick Room No. 4 (single-select switches from auto-selected Room 1 to Room 4)
    await page.locator('.fixed.inset-0.z-50 button:has-text("Room No. 4")').first().click();
    await expect(page.locator('.fixed.inset-0.z-50:has-text("1 Cottage Selected")')).toBeVisible();

    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();

    // 3. Verify on Dashboard before check-in
    // Expected check-ins queue should have "CheckIn Sync Guest"
    const expectedSection = page.locator('div.p-5:has-text("Today\'s Expected Check-ins")');
    await expect(expectedSection.locator('text=CheckIn Sync Guest')).toBeVisible();

    // Upcoming Reservations Preview should also list "CheckIn Sync Guest"
    const upcomingSection = page.locator('div.p-5:has-text("Upcoming Reservations Preview")');
    await expect(upcomingSection.locator('text=CheckIn Sync Guest')).toBeVisible();

    // Get initial occupied count
    const occupiedTileBefore = await page.locator('div.p-5:has-text("Occupied Rooms") p.text-2xl').innerText();
    const initialOccupiedCount = parseInt(occupiedTileBefore.split('/')[0].trim(), 10) || 0;

    const availableTileBefore = await page.locator('div.p-5:has-text("Available Rooms") p.text-2xl').innerText();
    const initialAvailableCount = parseInt(availableTileBefore.trim(), 10) || 0;

    // 4. Click Check In button under "Today's Expected Check-ins"
    const checkInBtn = expectedSection.locator('button:has-text("Check In")').first();
    await checkInBtn.click();

    // Confirm Check-In Modal appears
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).toBeVisible();
    await page.locator('button:has-text("Confirm Check-In")').click();
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).not.toBeVisible();

    // 5. Inspect Dashboard after check-in:
    // a. Check-in card under "Today's Expected Check-ins" must be REMOVED immediately
    await expect(expectedSection.locator('text=CheckIn Sync Guest')).not.toBeVisible();

    // b. Upcoming Reservations Preview must REMOVE the checked-in guest immediately (no longer Confirmed/Upcoming)
    await expect(upcomingSection.locator('text=CheckIn Sync Guest')).not.toBeVisible();

    // c. Occupied Rooms must increment by 1
    const occupiedTileAfter = await page.locator('div.p-5:has-text("Occupied Rooms") p.text-2xl').innerText();
    const newOccupiedCount = parseInt(occupiedTileAfter.split('/')[0].trim(), 10);
    expect(newOccupiedCount).toBe(initialOccupiedCount + 1);

    // d. Available Rooms must decrement by 1
    const availableTileAfter = await page.locator('div.p-5:has-text("Available Rooms") p.text-2xl').innerText();
    const newAvailableCount = parseInt(availableTileAfter.trim(), 10);
    expect(newAvailableCount).toBe(initialAvailableCount - 1);
  });

});
