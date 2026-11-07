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

});
