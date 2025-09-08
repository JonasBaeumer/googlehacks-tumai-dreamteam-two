// Popup script for CodeStreak extension
// Shows current stats and activity status

document.addEventListener('DOMContentLoaded', async () => {
  // Set default auth status first
  const authElement = document.getElementById('authStatus');
  authElement.textContent = '⏳ Initializing...';
  authElement.className = 'auth-status guest';
  
  await updateStats();
  await updateCurrentSite();
  await updateStatus();
  await updateAuthStatus();
  
  // Set up event listeners
  document.getElementById('viewDashboard').addEventListener('click', () => {
    // For now, just open a placeholder page
    chrome.tabs.create({ url: 'https://github.com' });
  });
  
  // Auth button event listeners
  document.getElementById('signInAnonymously').addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'signInAnonymously' });
      if (response.success) {
        console.log('Anonymous sign-in successful');
        await updateAuthStatus();
      } else {
        console.error('Anonymous sign-in failed:', response.error);
      }
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
    }
  });
  
  document.getElementById('pairWithCode').addEventListener('click', () => {
    // Open options page for pairing
    chrome.runtime.openOptionsPage();
  });
  
  document.getElementById('testDatabase').addEventListener('click', async () => {
    try {
      console.log('Testing database connection...');
      const response = await chrome.runtime.sendMessage({ type: 'testDatabase' });
      if (response.success) {
        console.log('✅ Test entry created successfully:', response.sessionId);
        alert('✅ Test entry created successfully!\nSession ID: ' + response.sessionId);
      } else {
        console.error('❌ Test failed:', response.error);
        alert('❌ Test failed: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert('❌ Test failed: ' + error.message);
    }
  });
  
  // Refresh stats every 5 seconds
  setInterval(updateStats, 5000);
});

async function updateStats() {
  try {
    // Get stored stats from local storage
    const { stats } = await chrome.storage.local.get({ 
      stats: {
        todayTime: 0,
        streak: 0,
        sessions: 0
      }
    });
    
    // Update UI
    document.getElementById('todayTime').textContent = formatMinutes(stats.todayTime);
    document.getElementById('streak').textContent = stats.streak + ' days';
    document.getElementById('sessions').textContent = stats.sessions;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

async function updateCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      document.getElementById('siteTitle').textContent = tab.title || 'Untitled';
      document.getElementById('siteUrl').textContent = tab.url || 'No URL';
      
      // Check if this is a coding-related site
      const isCodingSite = isCodingRelated(tab.url);
      const siteElement = document.getElementById('currentSite');
      
      if (isCodingSite) {
        siteElement.style.background = '#d4edda';
        siteElement.style.border = '1px solid #c3e6cb';
      } else {
        siteElement.style.background = '#fff3cd';
        siteElement.style.border = '1px solid #ffeaa7';
      }
    }
  } catch (error) {
    console.error('Error updating current site:', error);
  }
}

async function updateStatus() {
  try {
    const { isTracking } = await chrome.storage.local.get({ isTracking: true });
    const statusElement = document.getElementById('status');
    
    if (isTracking) {
      statusElement.textContent = '🟢 Tracking activity';
      statusElement.className = 'status tracking';
    } else {
      statusElement.textContent = '⏸️ Tracking paused';
      statusElement.className = 'status idle';
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

function isCodingRelated(url) {
  if (!url) return false;
  
  const codingDomains = [
    'stackoverflow.com',
    'stackexchange.com', 
    'github.com',
    'gist.github.com',
    'leetcode.com',
    'huggingface.co',
    'kaggle.com',
    'docs.python.org',
    'developer.mozilla.org',
    'developer.chrome.com',
    'dev.to',
    'w3schools.com',
    'geeksforgeeks.org',
    'codepen.io',
    'jsfiddle.net',
    'repl.it',
    'codesandbox.io',
    'gitlab.com',
    'bitbucket.org',
    'npmjs.com',
    'pypi.org',
    'rubygems.org',
    'crates.io',
    'nuget.org',
    'docs.microsoft.com',
    'reactjs.org',
    'vuejs.org',
    'angular.io',
    'nodejs.org',
    'python.org',
    'ruby-lang.org',
    'golang.org',
    'rust-lang.org',
    'kotlinlang.org',
    'dart.dev',
    'flutter.dev',
    'docs.aws.amazon.com',
    'cloud.google.com',
    'firebase.google.com',
    'vercel.com',
    'netlify.com'
  ];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return codingDomains.some(codingDomain => 
      domain === codingDomain || domain.endsWith('.' + codingDomain)
    );
  } catch {
    return false;
  }
}

function formatMinutes(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  return minutes + ' min';
}

async function updateAuthStatus() {
  try {
    const authElement = document.getElementById('authStatus');
    const authButtons = document.getElementById('authButtons');
    
    // Get auth status from background script
    const authStatus = await chrome.runtime.sendMessage({ type: 'getAuthStatus' });
    console.log('Auth status from background:', authStatus);
    
    if (authStatus && authStatus.isAuthenticated) {
      if (authStatus.isAnonymous) {
        authElement.textContent = '👤 Guest Mode';
        authElement.className = 'auth-status guest';
      } else {
        authElement.textContent = '✅ Connected';
        authElement.className = 'auth-status connected';
      }
      authButtons.style.display = 'none';
    } else {
      authElement.textContent = '⏳ Ready for Backend';
      authElement.className = 'auth-status guest';
      authButtons.style.display = 'block';
    }
  } catch (error) {
    console.error('Error updating auth status:', error);
    // Fallback to default status
    const authElement = document.getElementById('authStatus');
    const authButtons = document.getElementById('authButtons');
    authElement.textContent = '⏳ Ready for Backend';
    authElement.className = 'auth-status guest';
    authButtons.style.display = 'block';
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statsUpdated') {
    updateStats();
  }
});

console.log('CodeStreak popup loaded');
