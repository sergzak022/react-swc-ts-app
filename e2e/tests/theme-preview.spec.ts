import { test, expect } from '@playwright/test';

/**
 * Theme Preview E2E Tests
 * 
 * Purpose: Visual validation of the design token system
 * - Ensures ThemePreview page renders all token sections
 * - Validates theme toggle functionality
 * - Captures screenshots for both light and dark themes
 */

test.describe('ThemePreview', () => {
  test('renders in light mode with all token sections', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    // Verify all required sections are present
    await expect(page.getByRole('heading', { name: 'Theme Preview', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Surfaces', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Typography', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Borders', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Brand Colors', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Status Colors', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Controls', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Spacing Scale', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Border Radius', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shadows (Elevation)', level: 2 })).toBeVisible();
    
    // Verify theme toggle button is visible and shows correct state
    const themeToggle = page.getByRole('button', { name: /dark/i });
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toContainText('Dark');
    
    // Verify root element does not have .dark class (light mode)
    const htmlClass = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(htmlClass).toBe(false);
    
    // Capture full-page screenshot for light theme
    await page.screenshot({ 
      path: 'e2e/screenshots/theme-preview-light.png',
      fullPage: true 
    });
  });
  
  test('switches to dark mode correctly', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    // Find and click the dark mode toggle
    const darkToggle = page.getByRole('button', { name: /dark/i });
    await darkToggle.click();
    
    // Verify .dark class is applied to root element
    const htmlClass = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(htmlClass).toBe(true);
    
    // Verify button text changed to show light mode option
    await expect(darkToggle).toContainText('Light');
    
    // Wait a moment for theme transition
    await page.waitForTimeout(300);
    
    // Capture full-page screenshot for dark theme
    await page.screenshot({ 
      path: 'e2e/screenshots/theme-preview-dark.png',
      fullPage: true 
    });
  });
  
  test('toggles between light and dark modes multiple times', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    const themeToggle = page.getByRole('button');
    
    // Initial state: light mode
    let isDark = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);
    
    // Toggle to dark
    await themeToggle.click();
    isDark = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
    await expect(themeToggle).toContainText('Light');
    
    // Toggle back to light
    await themeToggle.click();
    isDark = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);
    await expect(themeToggle).toContainText('Dark');
    
    // Toggle to dark again
    await themeToggle.click();
    isDark = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
    await expect(themeToggle).toContainText('Light');
  });
  
  test('displays surface swatches correctly', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    // Check for surface section content
    const surfacesSection = page.locator('section').filter({ hasText: 'Surfaces' });
    await expect(surfacesSection.getByText('App Background')).toBeVisible();
    await expect(surfacesSection.getByText('Surface')).toBeVisible();
    await expect(surfacesSection.getByText('Muted')).toBeVisible();
    await expect(surfacesSection.getByText('Hover')).toBeVisible();
    await expect(surfacesSection.getByText('Active')).toBeVisible();
  });
  
  test('displays typography samples correctly', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    // Check for typography section content
    const typographySection = page.locator('section').filter({ hasText: 'Typography' });
    await expect(typographySection.getByText('Primary text')).toBeVisible();
    await expect(typographySection.getByText('Muted text')).toBeVisible();
    await expect(typographySection.getByText('Disabled text')).toBeVisible();
    await expect(typographySection.getByText('Inverse text')).toBeVisible();
    
    // Check size scale
    await expect(typographySection.getByText('Extra Small (xs) — 12px')).toBeVisible();
    await expect(typographySection.getByText('Medium (md) — 16px')).toBeVisible();
    await expect(typographySection.getByText('2X Large (2xl) — 24px')).toBeVisible();
  });
  
  test('displays status colors correctly', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    // Check for status colors
    const statusSection = page.locator('section').filter({ hasText: 'Status Colors' });
    await expect(statusSection.getByText('Success')).toBeVisible();
    await expect(statusSection.getByText('Warning')).toBeVisible();
    await expect(statusSection.getByText('Error')).toBeVisible();
    await expect(statusSection.getByText('Info')).toBeVisible();
  });
  
  test('displays interactive controls', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    const controlsSection = page.locator('section').filter({ hasText: 'Controls' });
    
    // Check for buttons
    await expect(controlsSection.getByRole('button', { name: 'Primary Button' })).toBeVisible();
    await expect(controlsSection.getByRole('button', { name: 'Secondary Button' })).toBeVisible();
    
    // Check for inputs
    const textInput = controlsSection.getByPlaceholder('Text input');
    await expect(textInput).toBeVisible();
    await textInput.fill('Test input');
    await expect(textInput).toHaveValue('Test input');
    
    const textarea = controlsSection.getByPlaceholder('Textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Test textarea content');
    await expect(textarea).toHaveValue('Test textarea content');
  });
  
  test('displays shadow elevation examples', async ({ page }) => {
    await page.goto('/library/styles/preview');
    
    const shadowsSection = page.locator('section').filter({ hasText: 'Shadows (Elevation)' });
    await expect(shadowsSection.getByText('Card')).toBeVisible();
    await expect(shadowsSection.getByText('Popover')).toBeVisible();
    await expect(shadowsSection.getByText('Dropdown')).toBeVisible();
    await expect(shadowsSection.getByText('Modal')).toBeVisible();
  });
});

