// Options page script for CodeStreak extension

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadCodingSites();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const { isTracking, trackAllSites } = await chrome.storage.local.get({
      isTracking: true,
      trackAllSites: true
    });
    
    document.getElementById('enableTracking').checked = isTracking;
    document.getElementById('trackAllSites').checked = trackAllSites;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function loadCodingSites() {
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
  
  const container = document.getElementById('codingSites');
  container.innerHTML = '';
  
  codingDomains.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'site-item';
    item.innerHTML = `
      <span>${domain}</span>
      <span style="color: #28a745;">✓ Recognized</span>
    `;
    container.appendChild(item);
  });
}

function setupEventListeners() {
  // Tracking toggle
  document.getElementById('enableTracking').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ isTracking: e.target.checked });
    showStatus('Tracking settings updated', 'success');
  });
  
  // Track all sites toggle
  document.getElementById('trackAllSites').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ trackAllSites: e.target.checked });
    showStatus('Tracking settings updated', 'success');
  });
  
  // Export data
  document.getElementById('exportData').addEventListener('click', async () => {
    try {
      const data = await chrome.storage.local.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `codestreak-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatus('Data exported successfully', 'success');
    } catch (error) {
      showStatus('Export failed: ' + error.message, 'error');
    }
  });
  
  // Clear data
  document.getElementById('clearData').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        await chrome.storage.local.clear();
        showStatus('All data cleared', 'success');
        await loadSettings();
      } catch (error) {
        showStatus('Clear failed: ' + error.message, 'error');
      }
    }
  });

  // Pair extension
  document.getElementById('pairExtension').addEventListener('click', async () => {
    const pairingCode = document.getElementById('pairingCode').value.trim().toUpperCase();
    const statusDiv = document.getElementById('pairingStatus');
    
    if (!pairingCode || pairingCode.length !== 6) {
      statusDiv.textContent = 'Please enter a valid 6-character pairing code';
      statusDiv.className = 'status error';
      return;
    }

    try {
      statusDiv.textContent = 'Connecting...';
      statusDiv.className = 'status';
      
      // Send pairing request to background script
      const response = await chrome.runtime.sendMessage({ 
        type: 'pairWithCode', 
        code: pairingCode 
      });
      
      if (response.success) {
        statusDiv.textContent = '✅ Extension connected successfully!';
        statusDiv.className = 'status success';
        document.getElementById('pairingCode').value = '';
      } else {
        throw new Error(response.error || 'Pairing failed');
      }
      
    } catch (error) {
      statusDiv.textContent = `❌ Connection failed: ${error.message}`;
      statusDiv.className = 'status error';
    }
  });
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('dataStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = '';
  }, 3000);
}

console.log('CodeStreak options page loaded');
