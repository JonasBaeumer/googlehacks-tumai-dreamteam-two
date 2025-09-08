// Content script for detecting user activity and sending pings to background
// This runs on every webpage to detect user interactions

let lastPing = 0;
const PING_EVERY_MS = 5000; // Throttle pings to every 5 seconds
let extensionContextValid = true; // Track if extension context is still valid

function ping(reason) {
  const now = Date.now();
  if (now - lastPing < PING_EVERY_MS || !extensionContextValid) return;
  lastPing = now;
  
  // Check if extension context is still valid
  if (!chrome.runtime || !chrome.runtime.sendMessage) {
    extensionContextValid = false;
    return; // Extension context invalidated, skip sending
  }
  
  // Send activity ping to background script
  chrome.runtime.sendMessage({ 
    type: "activity", 
    reason, 
    ts: now, 
    visible: document.visibilityState,
    url: window.location.href,
    title: document.title
  }).catch((error) => {
    // Ignore errors if background script is not ready or context invalidated
    if (error.message && error.message.includes('Extension context invalidated')) {
      // Extension was reloaded, stop trying to send messages
      extensionContextValid = false;
      return;
    }
  });
}

// Listen for various user interaction events
const events = ["mousemove", "keydown", "scroll", "visibilitychange", "focus", "click"];

events.forEach(eventType => {
  window.addEventListener(eventType, () => ping(eventType), { 
    passive: true,
    capture: true 
  });
});

// Send initial ping when script loads
ping("init");

// Also ping when page becomes visible again
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    ping("page_visible");
  }
});

console.log("CodeStreak content script loaded - tracking activity on:", window.location.href);
