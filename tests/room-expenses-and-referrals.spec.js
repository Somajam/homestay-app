import { test, expect } from '@playwright/test';

test.describe('Room Extras, Billing Amount, Referral Commission & Checkout Settlement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const usernameInput = page.locator('input[placeholder="Enter admin username"]');
    if (await usernameInput.isVisible({ timeout: 2500 }).catch(() => false)) {
      await usernameInput.fill('admin');
      await page.locator('input[placeholder="Enter password"]').fill('somajam2026');
      await page.getByRole('button', { name: 'Sign In to Portal' }).click();
      await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('New booking form displays Bill Amount, Referred By, and Referral Commission inputs', async ({ page }) => {
    // Open Add Booking modal
    const addBookingBtn = page.locator('button:has-text("Add Booking")').first();
    await addBookingBtn.click();

    // Verify modal heading
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).toBeVisible();

    // Verify Billing Amount & Referral Attribution section
    await expect(page.getByText('Billing Amount & Referral Attribution')).toBeVisible();
    await expect(page.locator('[data-testid="input-bill-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-referred-by"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-referral-commission"]')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible();
  });

  test('End-to-End lifecycle: Create booking with referral, add room incidentals, and settle at checkout', async ({ page }) => {
    // 1. Open Add Booking modal
    await page.locator('button:has-text("Add Booking")').first().click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).toBeVisible();

    // 2. Fill guest details
    await page.locator('input[placeholder="e.g. Rajesh Kumar"]').fill('Dev Test Guest');
    await page.locator('input[placeholder="e.g. +91 98470 12345"]').fill('9988776655');

    // 3. Fill Referral details and custom bill
    const billInput = page.locator('[data-testid="input-bill-amount"]');
    await billInput.fill('4000');

    const referrerInput = page.locator('[data-testid="input-referred-by"]');
    await referrerInput.fill('Suresh Travel Desk');

    const commissionInput = page.locator('[data-testid="input-referral-commission"]');
    await commissionInput.fill('400');

    // 4. Submit booking (Quick Advance Booking)
    await page.locator('button:has-text("Save Quick Booking")').first().click();
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).not.toBeVisible({ timeout: 10000 });

    // 5. Navigate to Bookings list
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('h2:has-text("Bookings & Check-In")')).toBeVisible();

    // Find the newly created booking row
    const guestCell = page.locator('td:has-text("Dev Test Guest")').first();
    await expect(guestCell).toBeVisible();

    // Verify referrer name is displayed in table
    await expect(page.getByText('Suresh Travel Desk').first()).toBeVisible();

    // 6. Check In the booking with rate adjustment / bargain at check-in
    const checkInBtn = page.locator('button:has-text("Check In")').first();
    await expect(checkInBtn).toBeVisible({ timeout: 5000 });
    await checkInBtn.click();

    // Check-In modal opens - test rate adjustment input
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).toBeVisible({ timeout: 5000 });
    const checkInBillInput = page.locator('[data-testid="input-checkin-bill-amount"]');
    await expect(checkInBillInput).toBeVisible();
    // Test quick discount chip or rate adjustment at check-in (e.g. from 4000 to 3800)
    await checkInBillInput.fill('3800');

    const confirmCheckInBtn = page.locator('button:has-text("Confirm Check-In")');
    await expect(confirmCheckInBtn).toBeVisible({ timeout: 5000 });
    await confirmCheckInBtn.click();
    await expect(page.locator('h3:has-text("Guest Check-In & Verification")')).not.toBeVisible({ timeout: 10000 });

    // 7. Verify "Extras" button appears for Checked-In booking
    const extrasBtn = page.locator('button:has-text("Extras")').first();
    await expect(extrasBtn).toBeVisible({ timeout: 5000 });
    await extrasBtn.click();

    // 8. Room Expenses Modal should open
    await expect(page.locator('h3:has-text("Room Incidentals & Extra Expenses")')).toBeVisible();

    // Quick add Campfire preset
    const campfireChip = page.locator('button:has-text("Campfire Wood")');
    if (await campfireChip.isVisible()) {
      await campfireChip.click();
    }

    // Add custom expense
    await page.locator('input[placeholder="Description (e.g. Extra Bed, Campfire, Food)"]').fill('BBQ Charcoal & Grilling');
    await page.locator('input[placeholder="Amount"]').fill('1500');
    await page.locator('button:has-text("Add")').click();

    // Verify item shows in list
    await expect(page.getByText('BBQ Charcoal & Grilling').first()).toBeVisible();

    // Close expenses modal
    await page.locator('button:has-text("Close & Save")').click();
    await expect(page.locator('h3:has-text("Room Incidentals & Extra Expenses")')).not.toBeVisible();

    // 9. Open Check-Out modal
    const checkOutBtn = page.locator('button:has-text("Check Out")').first();
    await checkOutBtn.click();

    // Verify Check-Out modal shows Grand Total with extras itemized
    await expect(page.locator('h3:has-text("Guest Check-Out & Bill Settlement")')).toBeVisible();
    await expect(page.getByText('Final Settlement Breakdown')).toBeVisible();
    await expect(page.getByText('Total Standard Billed (Room + Extras):')).toBeVisible();
    await expect(page.getByText('Actual Final Amount Received (₹)')).toBeVisible();

    // Test Bargain / Discount at Check-Out:
    const receivedAmountInput = page.locator('[data-testid="input-checkout-received-amount"]');
    await expect(receivedAmountInput).toBeVisible();
    // Test quick discount chip (-₹500)
    const discount500Btn = page.locator('button:has-text("-₹500")');
    if (await discount500Btn.isVisible()) {
      await discount500Btn.click();
      await expect(page.getByText('Discount / Bargain Given:')).toBeVisible();
    }

    // 10. Complete check-out
    await page.locator('button:has-text("Settle Bill")').click();
    await expect(page.locator('h3:has-text("Guest Check-Out & Bill Settlement")')).not.toBeVisible({ timeout: 10000 });

    // Switch to "Checked Out" tab to see checked-out records
    await page.locator('button:has-text("Checked Out")').click();

    // Verify settled amount and discount badge are visible in Bookings table
    await expect(page.getByText('Settled:').first()).toBeVisible();
  });
});
