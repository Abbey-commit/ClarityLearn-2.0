import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toContainText('Learn Crypto Terms');
});

test('navigate to staking page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Stake');
  await expect(page.url()).toContain('/stake');
  await expect(page.locator('h1')).toContainText('Create Your Stake');
});

test('search terms', async ({ page }) => {
  await page.goto('http://localhost:3000/learn');
  await page.fill('input[placeholder*="Search"]', 'DeFi');
  await expect(page.locator('text=DeFi')).toBeVisible();
});