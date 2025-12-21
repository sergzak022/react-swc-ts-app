/**
 * Theme Toggle Utility
 * 
 * Provides functions to initialize and toggle the dark theme by adding/removing
 * the .dark class on the document element. Persists theme preference to localStorage.
 */

const THEME_KEY = 'theme-preference';

/**
 * Initialize theme on app startup
 * 
 * Reads saved theme preference from localStorage and applies it.
 * If no preference is found, uses system preference.
 */
export function initTheme(): void {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Toggle dark theme
 * 
 * Toggles the .dark class on the document element and saves preference.
 * Returns true if dark theme is now active.
 */
export function toggleTheme(): boolean {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  return isDark;
}

/**
 * Get current theme
 * 
 * Returns 'dark' or 'light' based on current .dark class.
 */
export function getCurrentTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Set theme explicitly
 * 
 * Sets theme to 'dark' or 'light' and saves preference.
 */
export function setTheme(theme: 'dark' | 'light'): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(THEME_KEY, theme);
}

