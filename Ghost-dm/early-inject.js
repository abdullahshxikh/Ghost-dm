/**
 * Early injection script for Ghost DM extension
 * Runs before Instagram loads to block read receipt requests
 */

(function() {
  'use strict';
  
  // Only run on Instagram domains
  if (!window.location.hostname.includes('instagram.com')) {
    return;
  }
  
  let ghostModeEnabled = false;
  
  // Initialize Ghost Mode state from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['ghostMode'], (result) => {
      ghostModeEnabled = result.ghostMode || false;
    });
  }
  
  // Listen for Ghost Mode changes
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ghostModeChanged') {
        ghostModeEnabled = request.enabled;
      }
    });
  }
  
  // Override fetch to block read receipt requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (ghostModeEnabled && typeof url === 'string' && url.includes('/seen')) {
      // Return fake successful response
      return Promise.resolve(new Response(JSON.stringify({
        status: 'ok',
        success: true
      }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Override WebSocket to block read receipt messages
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new originalWebSocket(url, protocols);
    
    const originalSend = ws.send;
    ws.send = function(data) {
      if (ghostModeEnabled && typeof data === 'string' && data.includes('seen')) {
        return; // Block the message
      }
      
      return originalSend.apply(this, arguments);
    };
    
    return ws;
  };
  
  // Mark early injection as complete
  window.ghostDM_earlyInjection = true;
  
})(); 