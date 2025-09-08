# CodeStreak Chrome Extension

A Chrome extension that tracks your coding activity and helps you build streaks like Duolingo for developers!

## Features

### ✅ Currently Implemented
- **Activity-Based Session Grouping**: Groups related sessions into meaningful "coding flows"
- **Smart Activity Detection**: Detects when you're actively using any website
- **Session Management**: Tracks time spent on each site with smart idle detection
- **Coding Site Recognition**: Automatically identifies 40+ popular coding platforms
- **Beautiful Popup**: Shows your daily coding time, streak, and current site status
- **Settings Page**: Configure tracking preferences and manage your data
- **Offline Support**: Queues data when offline and syncs when back online
- **Session Group Timeouts**: Prevents forgotten tabs with smart timeout management

### 🔄 How It Works

1. **Content Script** (`content.js`): Runs on every webpage, detects user interactions (mouse, keyboard, scroll)
2. **Background Service Worker** (`background.js`): Manages sessions, session groups, tracks active time, handles data sending
3. **Popup Interface** (`hello.html` + `popup.js`): Shows stats and current activity status
4. **Options Page** (`options.html` + `options.js`): Settings and data management

### 🎯 Activity-Based Session Grouping

The extension groups related sessions into meaningful "coding flows":

- **Same Group**: User activity within 10 minutes of last activity
- **New Group**: 10+ minutes of inactivity (user walked away, took break, etc.)
- **Max Duration**: 5 minutes for testing (2 hours in production)
- **Activity Detection**: Any mouse/keyboard/scroll interaction OR site navigation

**Example Flow:**
```
9:00 AM: LeetCode (30 min) → Session Group 1
9:30 AM: Stack Overflow (10 min) → Same Group (within 10 min)
9:40 AM: LeetCode (20 min) → Same Group (within 10 min)
10:00 AM: Break (15 min gap)
10:15 AM: GitHub (45 min) → New Group (gap > 10 min)
```

### 🎯 Smart Activity Detection

The extension only counts time as "active" when:
- Tab is focused and window is active
- User is not OS-idle (system idle detection)
- Recent user interaction (within 30 seconds)
- Page is visible (not hidden in background)

### 📊 Recognized Coding Sites

- Stack Overflow & Stack Exchange
- GitHub & GitLab
- LeetCode, HackerRank
- Documentation sites (MDN, Python docs, Chrome Dev docs, etc.)
- Code editors (CodePen, JSFiddle, CodeSandbox)
- Package managers (npm, PyPI, etc.)
- Framework docs (React, Vue, Angular, etc.)
- Cloud platforms (AWS, Google Cloud, Firebase, etc.)
- And many more!

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this `chrome-plugin` folder
4. The extension will appear in your toolbar

## 📊 Data Structure

The extension sends rich activity data to your backend:

```json
{
  "session_id": "uuid-001",
  "session_group_id": "uuid-group-123",
  "session_group_duration": 1800000,
  "session_group_sites": ["leetcode.com", "stackoverflow.com"],
  "session_group_position": 3,
  "active_ms": 600000,
  "domain": "leetcode.com",
  "path": "/problems/two-sum",
  "reason": "navigation",
  "ts_start": "2025-09-08T20:31:05Z",
  "ts_end": "2025-09-08T20:38:12Z"
}
```

## Next Steps (Firebase Integration)

The extension is ready to connect to your Firebase backend! You'll need to:

1. **Set up Firebase Auth**: Add Firebase Anonymous Auth to get user tokens
2. **Create Cloud Function**: Deploy the `/ingest` endpoint to receive activity data
3. **Update Endpoint**: Replace the placeholder URL in `background.js` with your Firebase function URL
4. **Configure Timeouts**: Change `MAX_GROUP_DURATION` from 5 minutes to 2 hours for production

## Data Privacy

- ✅ Only tracks URLs, titles, and time spent
- ✅ No page content is ever accessed or stored
- ✅ All data stays local until you choose to sync
- ✅ Easy data export and deletion options

## 🎮 Gamification Features

The session grouping system enables powerful gamification:

- **Coding Flows**: Track meaningful coding sessions across multiple sites
- **Streaks**: Based on daily session groups, not individual sessions
- **Progress Tracking**: "Session 16 of 20 in current coding flow"
- **Pattern Analysis**: Which sites users visit together
- **Achievements**: "3-hour coding marathon", "5-day streak"

## Development

The extension uses Chrome Manifest V3 and follows modern extension best practices. All files are well-commented and ready for further development.

### Key Configuration
```javascript
const CONFIG = {
  GROUP_ACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  MAX_GROUP_DURATION: 5 * 60 * 1000, // 5 minutes (testing), 2 hours (production)
  MIN_SESSION_MS: 5000, // 5 seconds
  ACTIVE_TICK_MS: 5000, // 5 seconds
  INTERACTION_TTL_MS: 30000 // 30 seconds
};
```

---

**Ready for your hackathon!** 🚀
