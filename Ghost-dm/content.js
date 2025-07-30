/**
 * Content script for Ghost DM extension
 * Provides comprehensive read receipt blocking on Instagram pages
 */

let ghostModeEnabled = false;
let blockingActive = false;

// Initialize content script
(function() {
  // Check initial Ghost Mode state
  chrome.runtime.sendMessage({ action: 'getGhostMode' }, (response) => {
    if (response) {
      ghostModeEnabled = response.enabled;
      if (ghostModeEnabled) {
        initializeBlocking();
        showToast('Ghost Mode is active', 'info');
      }
    }
  });
  
  // Listen for Ghost Mode changes
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ghostModeChanged') {
      ghostModeEnabled = request.enabled;
      
      if (ghostModeEnabled) {
        initializeBlocking();
        showToast('Ghost Mode enabled', 'success');
      } else {
        showToast('Ghost Mode disabled', 'info');
      }
    }
  });
})();

/**
 * Initialize comprehensive request blocking
 */
function initializeBlocking() {
  if (blockingActive) return;
  blockingActive = true;
  
  // Block fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (!ghostModeEnabled) {
      return originalFetch.apply(this, args);
    }
    
    const url = args[0];
    const options = args[1] || {};
    
    if (typeof url === 'string' && shouldBlockRequest(url, options)) {
      showToast('Read receipt blocked', 'success');
      
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
  
  // Block XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._ghostDM_url = url;
    this._ghostDM_method = method;
    this._ghostDM_blocked = ghostModeEnabled && shouldBlockRequest(url, { method });
    
    if (this._ghostDM_blocked) {
      showToast('Read receipt blocked', 'success');
      
      // Create fake XHR that appears successful
      this.readyState = 4;
      this.status = 200;
      this.statusText = 'OK';
      this.responseText = '{"status":"ok","success":true}';
      this.response = this.responseText;
      
      // Set up fake event handling
      setTimeout(() => {
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
        if (this.onload) {
          this.onload();
        }
      }, 1);
      
      return;
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    if (this._ghostDM_blocked) {
      return; // Already handled in open()
    }
    return originalXHRSend.apply(this, arguments);
  };
  
  // Block WebSocket messages
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new originalWebSocket(url, protocols);
    
    const originalSend = ws.send;
    ws.send = function(data) {
      if (ghostModeEnabled && shouldBlockWebSocketMessage(data)) {
        showToast('WebSocket read receipt blocked', 'success');
        return; // Block the message
      }
      
      return originalSend.apply(this, arguments);
    };
    
    return ws;
  };
}

/**
 * Determine if a request should be blocked based on URL and options
 */
function shouldBlockRequest(url, options = {}) {
  if (!url || typeof url !== 'string') return false;
  
  const method = options.method || 'GET';
  const lowerUrl = url.toLowerCase();
  const requestBody = options.body ? options.body.toString().toLowerCase() : '';
  
  // Instagram read receipt patterns
  const blockPatterns = [
    '/direct_v2/threads/',
    '/api/v1/direct/',
    '/web/direct_v2/',
    '/graphql/',
    '/seen',
    'mark_seen',
    'seen_indicator',
    'seen_state',
    'read_receipt',
    '/direct/thread/',
    '/mark_read',
    '/update_read_state',
    '/direct_v2/mark_seen',
    '/direct_v2/inbox/mark_seen'
  ];
  
  const hasBlockPattern = blockPatterns.some(pattern => lowerUrl.includes(pattern));
  
  // GraphQL mutation blocking
  if (lowerUrl.includes('/graphql/') && requestBody) {
    const graphqlBlockMutations = [
      'markdirectinboxitemseen',
      'directmarkseenmutation', 
      'updatethreadseenstate',
      'markthreadseen'
    ];
    
    const isBlockedMutation = graphqlBlockMutations.some(mutation => 
      requestBody.includes(mutation)
    );
    
    if (isBlockedMutation || requestBody.includes('seen')) {
      return true;
    }
  }
  
  // Block POST/PUT/PATCH requests to read receipt endpoints
  if (hasBlockPattern && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    return true;
  }
  
  // Block any URL specifically mentioning "seen"
  if (lowerUrl.includes('seen')) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a WebSocket message should be blocked
 */
function shouldBlockWebSocketMessage(data) {
  if (!data || typeof data !== 'string') return false;
  
  try {
    const parsed = JSON.parse(data);
    const dataStr = JSON.stringify(parsed).toLowerCase();
    
    const blockKeywords = [
      'seen', 'read_receipt', 'mark_read', 'seen_indicator',
      'direct', 'thread', 'inbox', 'message'
    ];
    
    return blockKeywords.some(keyword => dataStr.includes(keyword));
  } catch (e) {
    // If not JSON, check raw string
    const lowerData = data.toLowerCase();
    return lowerData.includes('seen') || 
           lowerData.includes('read_receipt') || 
           lowerData.includes('mark_read');
  }
}

/**
 * Display toast notification
 */
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('ghost-dm-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'ghost-dm-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `ghost-dm-toast ghost-dm-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  toastContainer.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Hide and remove toast
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
} 