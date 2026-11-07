import { test, expect } from '@playwright/test';

test.describe('Somajam Homestay Web Application - Thorough E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Check if on login page and authenticate if needed
    const autoFillBtn = page.getByRole('button', { name: 'Auto Fill' });
    if (await autoFillBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await autoFillBtn.click();
      await page.getByRole('button', { name: 'Sign In to Portal' }).click();
      await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('1. Dashboard loads with room status cards and quick navigation', async ({ page }) => {
    await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Booking")').first()).toBeVisible();
    await expect(page.getByText("Today's Check-Ins", { exact: true })).toBeVisible();
    await expect(page.getByText('Occupied Rooms', { exact: true })).toBeVisible();
    await expect(page.getByText('Available Rooms', { exact: true })).toBeVisible();
  });

  test('2. Bookings page switches between List View and Monthly Calendar View', async ({ page }) => {
    // Click Bookings nav link
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('h2:has-text("Bookings & Check-In")')).toBeVisible();

    // Verify view toggle buttons exist
    const listBtn = page.locator('button:has-text("List / Table")');
    const calBtn = page.locator('button:has-text("Monthly Calendar")');
    await expect(listBtn).toBeVisible();
    await expect(calBtn).toBeVisible();

    // Default is List View: Check column headers
    await expect(page.locator('th:has-text("Booking Ref")')).toBeVisible();
    await expect(page.locator('th:has-text("Guest Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Assigned Room")')).toBeVisible();

    // Switch to Monthly Calendar View
    await calBtn.click();
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.getByText('Sun', { exact: true })).toBeVisible();
    await expect(page.getByText('Sat', { exact: true })).toBeVisible();

    // Test Cottage filter in Calendar View
    const cottageSelect = page.locator('select').first();
    await expect(cottageSelect).toBeVisible();
    await cottageSelect.selectOption({ label: 'All Cottages (5)' });

    // Test Navigation: Click Next Month then Prev Month
    const prevBtn = page.locator('button[title="Previous Month"]');
    const nextBtn = page.locator('button[title="Next Month"]');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    await nextBtn.click();
    await page.waitForTimeout(300);
    await prevBtn.click();
    await page.waitForTimeout(300);

    // Switch back to List View
    await listBtn.click();
    await expect(page.locator('th:has-text("Booking Ref")')).toBeVisible();
  });

  test('3. Date-Wise Guest Register displays filters, search, and CSV export', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await expect(page.locator('text=Analytics Reports, Guest Register & Archives')).toBeVisible();

    // Click Date-Wise Guest Register tab
    const registerTab = page.locator('button:has-text("Date-Wise Guest Register")');
    await registerTab.click();

    // Verify Date Range controls and quick presets
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Last 7 Days")')).toBeVisible();
    await expect(page.locator('button:has-text("This Month")')).toBeVisible();
    await expect(page.locator('button:has-text("All Stays")')).toBeVisible();

    // Click "All Stays" to view seeded records
    await page.click('button:has-text("All Stays")');
    await page.waitForTimeout(400);

    // Verify table columns exist
    await expect(page.locator('th:has-text("Stay Dates")')).toBeVisible();
    await expect(page.locator('th:has-text("Govt ID / Aadhaar Details")')).toBeVisible();
    await expect(page.locator('th:has-text("Cottage")')).toBeVisible();

    // Test Search input
    const searchInput = page.locator('input[placeholder*="Search guest name"]');
    await searchInput.fill('NonExistentGuestXYZ');
    await page.waitForTimeout(300);
    await expect(page.locator('text=No guest stays recorded in the selected date range.')).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Test Date-Wise CSV export action
    await page.click('button:has-text("Export Date-Wise CSV")');
    await expect(page.locator('text=records').first()).toBeVisible({ timeout: 5000 });
  });

  test('4. Monthly Archive & Free-Tier Storage Manager generates .ZIP package', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();

    // Switch to Monthly Archive tab
    const archiveTab = page.locator('button:has-text("Monthly Archive & Free-Tier Storage")');
    await archiveTab.click();

    // Verify Storage Meter Bar
    await expect(page.locator('text=Supabase Cloud Free-Tier Storage Monitor')).toBeVisible();
    await expect(page.locator('text=Cloud Bucket Used:')).toBeVisible();

    // Verify Month Selector
    await expect(page.locator('select').first()).toBeVisible();

    // Test Monthly Archive ZIP Download
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toContain('Somajam_Visitors_Archive_');
    expect(filename).toContain('.zip');
  });

  test('5. Image compressor and Guest Directory archives link', async ({ page }) => {
    await page.locator('a[href="/guests"]').first().click();
    await expect(page.locator('h2:has-text("Guest Directory & Document Archives")')).toBeVisible();

    // Verify shortcut button to Monthly Archives exists and navigate
    const archiveLink = page.locator('a:has-text("Monthly Archives & Free-Tier Storage")');
    await expect(archiveLink).toBeVisible();
    await archiveLink.click();

    // Verify it lands on reports-settings
    await expect(page.locator('text=Analytics Reports, Guest Register & Archives')).toBeVisible();
  });

  test('6. Rooms status and inventory management operates cleanly', async ({ page }) => {
    await page.locator('a[href="/rooms"]').first().click();
    await expect(page.locator('h2:has-text("Somajam 1BHK Cottages")')).toBeVisible();

    // Check cottage cards
    await expect(page.locator('h3:has-text("Cottage No. 1")')).toBeVisible();
    await expect(page.locator('h3:has-text("Cottage No. 2")')).toBeVisible();
    await expect(page.locator('button:has-text("Add New Room")')).toBeVisible();
  });

  test('7. Expense tracker ledger with dynamic payers and summary', async ({ page }) => {
    await page.locator('a[href="/expenses"]').first().click();
    await expect(page.locator('h2:has-text("Expense Tracker & Settlement Ledger")')).toBeVisible();

    // Check expense summary cards
    await expect(page.locator('text=Total Outlay Logged')).toBeVisible();
    await expect(page.locator('text=Pending Reimbursements')).toBeVisible();

    // Check Manage Accounts button
    await expect(page.locator('button:has-text("Manage Accounts")')).toBeVisible();
  });

});
