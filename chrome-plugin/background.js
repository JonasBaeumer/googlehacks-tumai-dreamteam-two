// Background service worker for CodeStreak activity tracking
// Manages sessions, tracks active time, and sends data to Firebase

const ACTIVE_TICK_MS = 5000; // Check every 5 seconds
const INTERACTION_TTL_MS = 30000; // Consider user inactive after 30 seconds
const MIN_SESSION_MS = 5000; // Minimum session length to send (5 seconds)

// Session group configuration
const GROUP_ACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes of inactivity = new group
const MAX_GROUP_DURATION = 5 * 60 * 1000; // 5 minutes max for testing (will be 2 hours in prod)

// Session storage: tabId -> session data
const SESSIONS = new Map();

// Session group storage: groupId -> group data
const SESSION_GROUPS = new Map();

// Global state
let focusedWindowId = null;
let activeTabId = null;
let idleState = "active";
let ACTIVE_SESSION_GROUP = null;
let LAST_ACTIVITY_TIME = 0;

// Initialize idle detection
chrome.idle.setDetectionInterval(60); // Check every minute

// Event listeners
chrome.windows.onFocusChanged.addListener(id => {
  focusedWindowId = id;
});

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
  activeTabId = tabId;
  focusedWindowId = windowId;
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.active && tab.windowId === focusedWindowId) {
    startSession(tabId, tab);
  }
});

chrome.webNavigation.onCompleted.addListener(({tabId}) => {
  endSession(tabId, "navigation");
});

chrome.idle.onStateChanged.addListener(state => {
  idleState = state;
  if (state !== "active") {
    // End all sessions when user becomes idle
    SESSIONS.forEach((session, tabId) => {
      endSession(tabId, "idle");
    });
  }
});

// Handle activity pings from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "activity" && sender.tab) {
    // Record activity for session group tracking
    recordActivity();
    
    // Update individual session
    const session = ensureSession(sender.tab.id, sender.tab);
    session.lastUserPing = Date.now();
    session.lastActivity = msg.reason;
  } else if (msg.type === "getAuthStatus") {
    // Return current auth status from storage
    chrome.storage.local.get({ authState: null }, ({ authState }) => {
      const status = authState || {
        isAuthenticated: false,
        isAnonymous: false,
        userId: null
      };
      console.log('Returning auth status:', status);
      sendResponse(status);
    });
    return true; // Keep message channel open for async response
  } else if (msg.type === "signInAnonymously") {
    // Handle anonymous sign-in
    handleAnonymousSignIn(sendResponse);
    return true; // Keep message channel open for async response
  } else if (msg.type === "pairWithCode") {
    // Handle pairing with code
    handlePairingCode(msg.code, sendResponse);
    return true; // Keep message channel open for async response
  } else if (msg.type === "testDatabase") {
    // Handle test database entry
    handleTestDatabase(sendResponse);
    return true; // Keep message channel open for async response
  } else if (msg.type === "endCurrentSession") {
    // Handle manual session ending
    handleEndCurrentSession(sendResponse);
    return true; // Keep message channel open for async response
  } else if (msg.type === "getCurrentSessionInfo") {
    // Handle getting current session info
    handleGetCurrentSessionInfo(sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Main activity tracking loop
setInterval(() => {
  tickActive();
}, ACTIVE_TICK_MS);

// Session group timeout check (every minute)
setInterval(() => {
  checkSessionGroupTimeouts();
}, 60000);

function ensureSession(tabId, tab) {
  if (!SESSIONS.has(tabId)) {
    startSession(tabId, tab);
  }
  return SESSIONS.get(tabId);
}

function startSession(tabId, tab) {
  // End any existing session for this tab
  endSession(tabId, "new_session");
  
  // Record activity for session group tracking
  recordActivity();
  
  const url = new URL(tab.url || "about:blank");
  const session = {
    url: tab.url,
    title: tab.title,
    domain: url.hostname,
    path: url.pathname,
    start: Date.now(),
    activeMs: 0,
    lastUserPing: Date.now(),
    lastActivity: "session_start",
    sessionGroupId: ACTIVE_SESSION_GROUP
  };
  
  SESSIONS.set(tabId, session);
  
  // Add site to session group
  addSiteToSessionGroup(url.hostname);
  
  console.log("Started session for:", tab.url, "Group:", ACTIVE_SESSION_GROUP);
}

function endSession(tabId, reason) {
  const session = SESSIONS.get(tabId);
  if (!session) {
    console.log("No session found for tab:", tabId);
    return;
  }
  
  // Update session group count
  if (session.sessionGroupId) {
    const group = SESSION_GROUPS.get(session.sessionGroupId);
    if (group) {
      group.sessionCount++;
    }
  }
  
  const payload = serializeSession(session, reason);
  SESSIONS.delete(tabId);
  
  console.log("Ending session:", reason, "Active time:", payload.active_ms + "ms", "Group:", session.sessionGroupId);
  
  // Only send sessions that are long enough
  if (payload.active_ms >= MIN_SESSION_MS) {
    console.log("Session meets minimum time, sending event");
    sendEvent(payload, reason);
  } else {
    console.log("Dropped micro-session:", payload.active_ms + "ms (minimum:", MIN_SESSION_MS + "ms)");
  }
}

function tickActive() {
  if (!activeTabId || !SESSIONS.has(activeTabId)) return;
  
  chrome.tabs.get(activeTabId, tab => {
    if (chrome.runtime.lastError || !tab) return;
    
    const session = SESSIONS.get(activeTabId);
    const windowFocused = (tab.windowId === focusedWindowId);
    
    // For now, assume user is active if tab is active and window is focused
    // In the future, we can add content script pings for more accurate tracking
    const userActive = true; // Simplified for now - always assume active if tab is focused
    const isActive = tab.active && windowFocused && idleState === "active" && userActive;
    
    if (isActive) {
      session.activeMs += ACTIVE_TICK_MS;
      console.log(`Activity tick: +${ACTIVE_TICK_MS}ms, total: ${session.activeMs}ms`);
    }
  });
}

function serializeSession(session, reason) {
  const group = SESSION_GROUPS.get(session.sessionGroupId);
  const groupSites = group ? group.sites : [];
  const groupDuration = group ? group.totalDuration : 0;
  
  return {
    ts_start: new Date(session.start).toISOString(),
    ts_end: new Date().toISOString(),
    active_ms: session.activeMs,
    url: session.url,
    title: session.title,
    domain: session.domain,
    path: session.path,
    reason: reason,
    last_activity: session.lastActivity,
    session_group_id: session.sessionGroupId,
    session_group_duration: groupDuration,
    session_group_sites: groupSites,
    session_group_position: group ? group.sessionCount + 1 : 1
  };
}

async function sendEvent(payload, reason) {
  try {
    console.log("Sending event:", payload);
    
    // Get auth state from storage
    const { authState } = await chrome.storage.local.get({ authState: null });
    
    if (!authState || !authState.isAuthenticated) {
      console.warn("No authenticated user, queueing for later");
      queueOffline(payload);
      return;
    }
    
    // Get ID token from storage (stored by auth manager)
    const { idToken } = await chrome.storage.local.get({ idToken: null });
    
    if (!idToken) {
      console.warn("No ID token available, queueing for later");
      queueOffline(payload);
      return;
    }
    
    console.log("Sending activity data to Firebase with authentication...");
    console.log("Using ID token:", idToken);
    
    // Send to real Firebase endpoint with authentication
    const response = await fetch("https://us-central1-tum-cdtm25mun-8774.cloudfunctions.net/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log("Event sent successfully");
  } catch (error) {
    console.warn("Send failed, queueing for later:", error);
    queueOffline(payload);
  }
}

function queueOffline(payload) {
  chrome.storage.local.get({ queue: [] }, ({ queue }) => {
    queue.push({ ...payload, queued_at: Date.now() });
    chrome.storage.local.set({ queue });
  });
}

// Process offline queue when extension starts
chrome.runtime.onStartup.addListener(() => {
  processOfflineQueue();
});

async function processOfflineQueue() {
  const { queue } = await chrome.storage.local.get({ queue: [] });
  if (queue.length === 0) return;
  
  console.log(`Processing ${queue.length} queued events`);
  
  for (const payload of queue) {
    try {
      await sendEvent(payload, "retry");
    } catch (error) {
      console.warn("Retry failed:", error);
      break; // Stop retrying if we hit an error
    }
  }
  
  // Clear successfully sent items
  chrome.storage.local.set({ queue: [] });
}

// Session Group Management Functions

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function recordActivity() {
  const now = Date.now();
  LAST_ACTIVITY_TIME = now;
  
  // Check if we need a new session group
  if (!ACTIVE_SESSION_GROUP || isGroupExpired()) {
    startNewSessionGroup();
  }
  
  // Update current group
  updateActiveSessionGroup(now);
}

function startNewSessionGroup() {
  ACTIVE_SESSION_GROUP = generateUUID();
  SESSION_GROUPS.set(ACTIVE_SESSION_GROUP, {
    id: ACTIVE_SESSION_GROUP,
    start: Date.now(),
    lastActivity: Date.now(),
    sites: [],
    totalDuration: 0,
    sessionCount: 0
  });
  
  console.log("Started new session group:", ACTIVE_SESSION_GROUP);
}

function updateActiveSessionGroup(now) {
  const group = SESSION_GROUPS.get(ACTIVE_SESSION_GROUP);
  if (group) {
    group.lastActivity = now;
    group.totalDuration = now - group.start;
  }
}

function isGroupExpired() {
  if (!ACTIVE_SESSION_GROUP) return true;
  
  const now = Date.now();
  const timeSinceLastActivity = now - LAST_ACTIVITY_TIME;
  const group = SESSION_GROUPS.get(ACTIVE_SESSION_GROUP);
  
  if (!group) return true;
  
  // Check activity timeout (10+ minutes inactive)
  if (timeSinceLastActivity > GROUP_ACTIVITY_TIMEOUT) {
    console.log("Session group expired due to inactivity:", timeSinceLastActivity + "ms");
    return true;
  }
  
  // Check max duration (5 minutes for testing)
  if ((now - group.start) > MAX_GROUP_DURATION) {
    console.log("Session group expired due to max duration:", (now - group.start) + "ms");
    return true;
  }
  
  return false;
}

function checkSessionGroupTimeouts() {
  const now = Date.now();
  
  // Check activity timeout for active group
  if (ACTIVE_SESSION_GROUP && 
      (now - LAST_ACTIVITY_TIME) > GROUP_ACTIVITY_TIMEOUT) {
    closeSessionGroup(ACTIVE_SESSION_GROUP, "activity_timeout");
  }
  
  // Check max duration for all groups
  SESSION_GROUPS.forEach((group, groupId) => {
    if ((now - group.start) > MAX_GROUP_DURATION) {
      closeSessionGroup(groupId, "max_duration");
    }
  });
}

function closeSessionGroup(groupId, reason) {
  const group = SESSION_GROUPS.get(groupId);
  if (!group) return;
  
  console.log("Closing session group:", groupId, "Reason:", reason, "Duration:", group.totalDuration + "ms");
  
  // Send group summary to backend (optional)
  // sendGroupSummary(group, reason);
  
  // Clean up
  SESSION_GROUPS.delete(groupId);
  
  if (ACTIVE_SESSION_GROUP === groupId) {
    ACTIVE_SESSION_GROUP = null;
  }
}

function addSiteToSessionGroup(domain) {
  if (!ACTIVE_SESSION_GROUP) return;
  
  const group = SESSION_GROUPS.get(ACTIVE_SESSION_GROUP);
  if (group && !group.sites.includes(domain)) {
    group.sites.push(domain);
    console.log("Added site to session group:", domain, "Sites:", group.sites);
  }
}

async function handleAnonymousSignIn(sendResponse) {
  try {
    console.log("Handling anonymous sign-in");
    
    // For now, simulate anonymous authentication
    // In a real implementation, you'd use Firebase Admin SDK or a different approach
    const mockUserId = 'anonymous_' + Date.now();
    
    const authState = {
      isAuthenticated: true,
      isAnonymous: true,
      userId: mockUserId,
      email: null,
      lastUpdated: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ authState });
    
    // Generate a mock ID token (in real implementation, this would come from Firebase)
    const mockIdToken = 'mock_token_' + mockUserId;
    await chrome.storage.local.set({ idToken: mockIdToken });
    
    console.log('Anonymous sign-in successful:', mockUserId);
    console.log('Stored mock ID token:', mockIdToken);
    sendResponse({ success: true, userId: mockUserId });
  } catch (error) {
    console.error("Anonymous sign-in failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePairingCode(code, sendResponse) {
  try {
    console.log("Handling pairing code:", code);
    
    // Call the claimCode function
    const response = await fetch('https://us-central1-tum-cdtm25mun-8774.cloudfunctions.net/claimCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const { customToken } = await response.json();
    
    // For now, simulate signing in with custom token
    // In a real implementation, you'd use Firebase Admin SDK
    const mockUserId = 'user_' + Date.now();
    
    const authState = {
      isAuthenticated: true,
      isAnonymous: false,
      userId: mockUserId,
      email: null,
      lastUpdated: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ 
      authState,
      customToken: customToken,
      pairedAt: new Date().toISOString(),
      pairingCode: code
    });
    
    // Generate a mock ID token (in real implementation, this would come from Firebase)
    const mockIdToken = 'mock_token_' + mockUserId;
    await chrome.storage.local.set({ idToken: mockIdToken });
    
    console.log('Pairing successful:', mockUserId);
    sendResponse({ success: true, userId: mockUserId });
  } catch (error) {
    console.error("Pairing failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTestDatabase(sendResponse) {
  try {
    console.log("Creating test database entry...");
    
    // Get current auth state
    const { authState, idToken } = await chrome.storage.local.get({ 
      authState: null, 
      idToken: null 
    });
    
    if (!authState || !authState.isAuthenticated) {
      throw new Error("Not authenticated. Please sign in first.");
    }
    
    // Create test activity data
    const testData = {
      active_ms: 10000, // 10 seconds
      domain: "test.com",
      url: "https://test.com/test-page",
      title: "Test Page - Database Connection Test",
      ts_start: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago
      ts_end: new Date().toISOString(),
      session_group_id: "test-group-" + Date.now(),
      session_group_position: 1,
      session_group_duration: 10000,
      session_group_sites: ["test.com"]
    };
    
    console.log("Sending test data:", testData);
    
    // Send to Firebase
    const response = await fetch('https://us-central1-tum-cdtm25mun-8774.cloudfunctions.net/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Test entry created successfully:', result);
    sendResponse({ success: true, sessionId: result.sessionId });
    
  } catch (error) {
    console.error("Test database entry failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleEndCurrentSession(sendResponse) {
  try {
    console.log("Manually ending current session...");
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found");
    }
    
    // Check if there's an active session for this tab
    const session = SESSIONS.get(tab.id);
    if (!session) {
      throw new Error("No active session found for current tab");
    }
    
    // End the session manually
    endSession(tab.id, "manual_end");
    
    const message = `Session ended manually. Active time: ${Math.round(session.activeMs / 1000)}s on ${session.domain}`;
    console.log(message);
    
    sendResponse({ 
      success: true, 
      message: message,
      sessionData: {
        domain: session.domain,
        activeMs: session.activeMs,
        duration: Math.round(session.activeMs / 1000) + 's'
      }
    });
    
  } catch (error) {
    console.error("Failed to end current session:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetCurrentSessionInfo(sendResponse) {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ hasActiveSession: false });
      return;
    }
    
    // Check if there's an active session for this tab
    const session = SESSIONS.get(tab.id);
    if (!session) {
      sendResponse({ hasActiveSession: false });
      return;
    }
    
    sendResponse({
      hasActiveSession: true,
      activeMs: session.activeMs,
      domain: session.domain,
      url: session.url,
      title: session.title,
      sessionGroupId: session.sessionGroupId,
      startTime: session.start,
      lastActivity: session.lastActivity
    });
    
  } catch (error) {
    console.error("Failed to get current session info:", error);
    sendResponse({ hasActiveSession: false, error: error.message });
  }
}

// Initialize extension
console.log("CodeStreak background script loaded");
