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
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "activity" && sender.tab) {
    // Record activity for session group tracking
    recordActivity();
    
    // Update individual session
    const session = ensureSession(sender.tab.id, sender.tab);
    session.lastUserPing = Date.now();
    session.lastActivity = msg.reason;
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
    const userActive = (Date.now() - session.lastUserPing) <= INTERACTION_TTL_MS;
    const isActive = tab.active && windowFocused && idleState === "active" && userActive;
    
    if (isActive) {
      session.activeMs += ACTIVE_TICK_MS;
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
    
    // For now, just log the data. We'll add Firebase integration next
    // TODO: Replace with actual Firebase endpoint
    const response = await fetch("https://your-firebase-endpoint.com/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${idToken}` // Will add when we set up Firebase Auth
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

console.log("CodeStreak background script loaded");
