import { test, expect } from '@playwright/test';

test.describe('Monthly Financial Income & Expense Reports', () => {
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

  test('Reports page has Monthly Income & Expense Report tab with P&L statement and breakdowns', async ({ page }) => {
    // 1. Navigate to Reports & Settings
    await page.locator('a[href="/reports-settings"]').first().click();
    await expect(page.locator('h2:has-text("Analytics Reports, Guest Register & Archives")')).toBeVisible();

    // 2. Click the new tab "Monthly Income & Expense Report"
    const financialTabBtn = page.locator('button:has-text("Monthly Income & Expense Report")');
    await expect(financialTabBtn).toBeVisible();
    await financialTabBtn.click();

    // 3. Verify Period Controls
    await expect(page.getByText('Monthly Financial Period:')).toBeVisible();
    await expect(page.locator('button:has-text("This Month")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Statement CSV")')).toBeVisible();

    // 4. Verify Summary KPI Cards
    await expect(page.getByText('Total Revenue / Income')).toBeVisible();
    await expect(page.getByText('Total Operating Expenses', { exact: true })).toBeVisible();
    await expect(page.getByText('Net Operating Profit', { exact: true }).or(page.getByText('Operating Deficit'))).toBeVisible();
    await expect(page.getByText('Referrals & Incidentals')).toBeVisible();

    // 5. Verify Executive P&L Statement View (default sub-view)
    await expect(page.locator('button:has-text("Executive P&L Statement")')).toBeVisible();
    await expect(page.getByText('Revenue & Inflows Schedule')).toBeVisible();
    await expect(page.getByText('Operational Expenses by Category')).toBeVisible();
    await expect(page.getByText('GROSS OPERATING REVENUE')).toBeVisible();
    await expect(page.getByText('NET OPERATING PROFIT / SURPLUS')).toBeVisible();

    // 6. Switch to Income Details sub-view
    const incomeSubTab = page.locator('button:has-text("Income Details")');
    await expect(incomeSubTab).toBeVisible();
    await incomeSubTab.click();

    // Verify Income table headers
    await expect(page.locator('th:has-text("Ref / Cottage")')).toBeVisible();
    await expect(page.locator('th:has-text("Guest Full Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Room Bill (₹)")')).toBeVisible();
    await expect(page.locator('th:has-text("Total Billed (₹)")')).toBeVisible();

    // 7. Switch to Expense Details sub-view
    const expenseSubTab = page.locator('button:has-text("Expense Details")');
    await expect(expenseSubTab).toBeVisible();
    await expenseSubTab.click();

    // Verify Expense table headers
    await expect(page.locator('th:has-text("Paid By")')).toBeVisible();
    await expect(page.locator('th:has-text("Category")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount (₹)")')).toBeVisible();
  });
});
