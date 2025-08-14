/**
 * Background service worker for Ghost DM extension
 * Manages extension state and declarativeNetRequest rules
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.sync.set({ ghostMode: false });
  } catch (error) {
    console.error('Error initializing Ghost DM:', error);
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await initializeGhostMode(true);
});

// Initialize when service worker starts
(async () => {
  await initializeGhostMode(true);
})();

/**
 * Initialize Ghost Mode based on stored state
 */
async function initializeGhostMode(shouldInjectTabs = false) {
  try {
    const result = await chrome.storage.sync.get(['ghostMode']);
    const ghostMode = result.ghostMode || false;
    
    if (ghostMode) {
      await enableRuleset();
      if (shouldInjectTabs) {
        await injectContentScriptToAllInstagramTabs();
        notifyContentScripts(true);
      }
    } else {
      await disableRuleset();
    }
  } catch (error) {
    console.error('Error reading Ghost Mode on startup:', error);
  }
}

// Listen for storage changes and update ruleset accordingly
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes.ghostMode) {
    const newValue = changes.ghostMode.newValue;
    const oldValue = changes.ghostMode.oldValue;
    
    try {
      if (newValue) {
        await enableRuleset();
        await injectContentScriptToAllInstagramTabs();
        notifyContentScripts(true);
      } else {
        await disableRuleset();
        notifyContentScripts(false);
      }
    } catch (error) {
      console.error('Error handling Ghost Mode change:', error);
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleGhostMode') {
    sendResponse({ success: true });
  } else if (request.action === 'getGhostMode') {
    chrome.storage.sync.get(['ghostMode'], (result) => {
      sendResponse({ enabled: result.ghostMode || false });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'injectDebug') {
    injectDebugScript()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Debug injection failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

/**
 * Enable declarativeNetRequest ruleset
 */
async function enableRuleset() {
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['ruleset_1']
    });
  } catch (error) {
    console.error('Error enabling ruleset:', error);
  }
}

/**
 * Disable declarativeNetRequest ruleset
 */
async function disableRuleset() {
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['ruleset_1']
    });
  } catch (error) {
    console.error('Error disabling ruleset:', error);
  }
}

/**
 * Inject content scripts into active tab
 */
async function injectContentScriptToActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes('instagram.com')) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['early-inject.js'],
        world: 'MAIN'
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  } catch (error) {
    console.error('Error injecting content script to active tab:', error);
  }
}

/**
 * Inject content scripts into all Instagram tabs
 */
async function injectContentScriptToAllInstagramTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.instagram.com/*' });
    
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['early-inject.js'],
          world: 'MAIN'
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (error) {
        // Tab might not be accessible
      }
    }
  } catch (error) {
    console.error('Error injecting into Instagram tabs:', error);
  }
}

/**
 * Inject debug monitoring script
 */
async function injectDebugScript() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.instagram.com/*' });
    
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['debug-requests.js']
        });
      } catch (error) {
        // Tab might not be accessible
      }
    }
  } catch (error) {
    console.error('Error injecting debug script:', error);
  }
}

/**
 * Notify content scripts of Ghost Mode changes
 */
function notifyContentScripts(enabled) {
  chrome.tabs.query({ url: '*://*.instagram.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'ghostModeChanged',
          enabled: enabled
        });
      } catch (error) {
        // Content script might not be loaded
      }
    });
  });
} 