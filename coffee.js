// coffee.js - Support / Buy Me a Coffee modal & browsing session timer
import { dom } from './dom.js';
import { BUY_ME_A_COFFEE_URL } from './shared/site.js';

const DISMISSED_KEY = 'unblot_coffee_dismissed';
const START_KEY = 'unblot_browse_start';
const TWO_MINUTES_MS = 2 * 60 * 1000; // 2 minutes browsing before initial prompt
const SNOOZE_MS = 10 * 60 * 1000; // 10 minutes snooze across all actions

let activeTimer = null;

export function openCoffeeModal() {
  if (!dom.coffeeModalBg) return;
  dom.coffeeModalBg.classList.remove('hidden');
}

export function closeCoffeeModal() {
  if (!dom.coffeeModalBg) return;
  dom.coffeeModalBg.classList.add('hidden');
  try {
    const expiry = Date.now() + SNOOZE_MS;
    localStorage.setItem(DISMISSED_KEY, String(expiry));
  } catch (e) {}

  // Schedule to show again after 10 minutes
  scheduleNextPrompt(SNOOZE_MS);
}

function scheduleNextPrompt(delayMs) {
  if (activeTimer) clearTimeout(activeTimer);

  activeTimer = setTimeout(() => {
    try {
      const checkDismissed = parseInt(localStorage.getItem(DISMISSED_KEY) || '0', 10);
      if (Date.now() < checkDismissed) {
        // Still snoozed, schedule remaining time
        scheduleNextPrompt(checkDismissed - Date.now());
        return;
      }
    } catch (e) {}

    // Open modal if not already open
    if (dom.coffeeModalBg && dom.coffeeModalBg.classList.contains('hidden')) {
      openCoffeeModal();
    }
  }, Math.max(0, delayMs));
}

export function initCoffeeSupport() {
  // Sync Buy Me a Coffee link
  const targetUrl = window.BUY_ME_A_COFFEE_URL || BUY_ME_A_COFFEE_URL || 'https://buymeacoffee.com/unblot';
  if (dom.coffeeModalBtn) {
    dom.coffeeModalBtn.href = targetUrl;
  }

  // Open modal on sidebar button click
  if (dom.navCoffee) {
    dom.navCoffee.addEventListener('click', (e) => {
      e.preventDefault();
      openCoffeeModal();
    });
  }

  // Open modal on footer link click
  if (dom.footerCoffee) {
    dom.footerCoffee.addEventListener('click', (e) => {
      e.preventDefault();
      openCoffeeModal();
    });
  }

  // Close handlers
  if (dom.coffeeModalClose) {
    dom.coffeeModalClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeCoffeeModal();
    });
  }

  if (dom.coffeeModalLater) {
    dom.coffeeModalLater.addEventListener('click', (e) => {
      e.preventDefault();
      closeCoffeeModal();
    });
  }

  if (dom.coffeeModalBtn) {
    dom.coffeeModalBtn.addEventListener('click', () => {
      closeCoffeeModal();
    });
  }

  // Backdrop click to dismiss
  if (dom.coffeeModalBg) {
    dom.coffeeModalBg.addEventListener('click', (e) => {
      if (e.target === dom.coffeeModalBg) {
        closeCoffeeModal();
      }
    });
  }

  // Escape key to dismiss
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.coffeeModalBg && !dom.coffeeModalBg.classList.contains('hidden')) {
      closeCoffeeModal();
    }
  });

  // Start initial browsing timer
  startBrowsingTimer();
}

function startBrowsingTimer() {
  try {
    const dismissedUntil = parseInt(localStorage.getItem(DISMISSED_KEY) || '0', 10);
    const now = Date.now();

    // If currently snoozed, wait for snooze to finish
    if (dismissedUntil && now < dismissedUntil) {
      scheduleNextPrompt(dismissedUntil - now);
      return;
    }

    // Otherwise, track initial 2-minute browsing time
    let start = parseInt(sessionStorage.getItem(START_KEY) || '0', 10);
    if (!start) {
      start = now;
      sessionStorage.setItem(START_KEY, String(start));
    }

    const elapsed = now - start;
    const remaining = Math.max(0, TWO_MINUTES_MS - elapsed);
    scheduleNextPrompt(remaining);
  } catch (err) {
    console.error('Coffee timer error:', err);
  }
}
