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
  
  // Bridge: dispatch a CustomEvent to the page to set enabled state
  function dispatchSetEnabledToPage(enabled) {
    try {
      window.dispatchEvent(new CustomEvent('GhostDMSetEnabled', { detail: !!enabled }));
    } catch (e) {}
  }
  
  // Inject a script tag that runs in the page's main world
  function injectMainWorldScript(initialEnabled) {
    const code = `(() => {
      'use strict';
      try {
        if (window.__ghostDM_injected) { return; }
        window.__ghostDM_injected = true;
        const GHOST_EVENT_BLOCKED = 'GhostDMBlocked';
        const GHOST_EVENT_SET_ENABLED = 'GhostDMSetEnabled';
        let ghostModeEnabled = ${initialEnabled ? 'true' : 'false'};
        
        // Listen for state updates from the extension world
        window.addEventListener(GHOST_EVENT_SET_ENABLED, (e) => {
          try { ghostModeEnabled = !!(e && e.detail); } catch (_) {}
        });
        
        function dispatchBlocked(detail) {
          try { window.dispatchEvent(new CustomEvent(GHOST_EVENT_BLOCKED, { detail })); } catch (_) {}
        }
        
        function toLowerSafe(value) {
          try { return (value || '').toString().toLowerCase(); } catch (_) { return ''; }
        }
        
        function bodyToString(body) {
          try {
            if (!body) return '';
            if (typeof body === 'string') return body;
            if (body instanceof URLSearchParams) return body.toString();
            if (body instanceof FormData) {
              const parts = [];
              for (const [k, v] of body.entries()) { parts.push(k + '=' + (typeof v === 'string' ? v : 'blob')); }
              return parts.join('&');
            }
            // Try JSON stringify for objects
            return JSON.stringify(body);
          } catch (_) {
            return '';
          }
        }
        
        function shouldBlockUrlAndMethod(url, method, requestBodyStr) {
          if (!url) return false;
          const lowerUrl = toLowerSafe(url);
          const m = toLowerSafe(method || 'get');
          const isWrite = m === 'post' || m === 'put' || m === 'patch';
          
          // Focus only on write requests
          if (!isWrite) {
            return false;
          }
          
          // Primary REST patterns used by Instagram DMs
          const patterns = [
            '/direct_v2/threads/',
            '/api/v1/direct_v2/',
            '/web/direct_v2/',
            '/direct/thread/',
            '/direct/',
          ];
          const hasDmPath = patterns.some(p => lowerUrl.includes(p));
          
          // Blockers in either URL or body
          const keywords = [
            '/seen',
            'mark_seen',
            'mark_read',
            'seen_indicator',
            'seen_state',
            'read_receipt',
            '/update_read_state',
            '/inbox/mark_seen',
          ];
          const hasKeywordsInUrl = keywords.some(k => lowerUrl.includes(k));
          
          if (hasDmPath && hasKeywordsInUrl) {
            return true;
          }
          
          // GraphQL mutations
          if (lowerUrl.includes('/graphql')) {
            const body = toLowerSafe(requestBodyStr);
            if (!body) return false;
            const gqlKeywords = [
              'markdirectinboxitemseen',
              'directmarkseenmutation',
              'updatethreadseenstate',
              'markthreadseen',
              'mark_seen',
              'seen'
            ];
            if (gqlKeywords.some(k => body.includes(k))) return true;
          }
          
          // Generic fallback: any DM URL explicitly containing 'seen'
          if (hasDmPath && lowerUrl.includes('seen')) return true;
          return false;
        }
        
        // fetch
        try {
          const originalFetch = window.fetch;
          if (typeof originalFetch === 'function') {
            window.fetch = function(input, init) {
              if (!ghostModeEnabled) {
                return originalFetch.apply(this, arguments);
              }
              try {
                const url = (typeof input === 'string') ? input : (input && input.url);
                const method = init && (init.method || (input && input.method));
                const bodyStr = init && bodyToString(init.body);
                if (shouldBlockUrlAndMethod(url, method, bodyStr)) {
                  dispatchBlocked({ type: 'fetch', url });
                  return Promise.resolve(new Response(JSON.stringify({ status: 'ok', success: true }), {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'Content-Type': 'application/json' }
                  }));
                }
              } catch (_) {}
              return originalFetch.apply(this, arguments);
            };
          }
        } catch (_) {}
        
        // XHR
        try {
          const originalOpen = XMLHttpRequest.prototype.open;
          const originalSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function(method, url) {
            this.__ghostDM = { method, url, blocked: false };
            try {
              const bodyStr = '';
              if (ghostModeEnabled && shouldBlockUrlAndMethod(url, method, bodyStr)) {
                this.__ghostDM.blocked = true;
              }
            } catch (_) {}
            return originalOpen.apply(this, arguments);
          };
          XMLHttpRequest.prototype.send = function(body) {
            try {
              if (this.__ghostDM && !this.__ghostDM.blocked && ghostModeEnabled) {
                const { method, url } = this.__ghostDM;
                const bodyStr = bodyToString(body);
                if (shouldBlockUrlAndMethod(url, method, bodyStr)) {
                  this.__ghostDM.blocked = true;
                }
              }
              if (this.__ghostDM && this.__ghostDM.blocked) {
                // Simulate successful response
                dispatchBlocked({ type: 'xhr', url: this.__ghostDM.url });
                this.readyState = 4;
                this.status = 200;
                this.statusText = 'OK';
                this.responseType = '';
                this.responseText = '{"status":"ok","success":true}';
                this.response = this.responseText;
                const self = this;
                setTimeout(() => {
                  try { if (typeof self.onreadystatechange === 'function') self.onreadystatechange(); } catch (_) {}
                  try { if (typeof self.onload === 'function') self.onload(); } catch (_) {}
                }, 0);
                return;
              }
            } catch (_) {}
            return originalSend.apply(this, arguments);
          };
        } catch (_) {}
        
        // WebSocket
        try {
          const OriginalWebSocket = window.WebSocket;
          window.WebSocket = function(url, protocols) {
            const ws = new OriginalWebSocket(url, protocols);
            try {
              const originalSend = ws.send;
              ws.send = function(data) {
                try {
                  if (ghostModeEnabled) {
                    const text = toLowerSafe(typeof data === 'string' ? data : JSON.stringify(data));
                    if (text && (text.includes('seen') || text.includes('mark_read') || text.includes('mark_seen'))) {
                      dispatchBlocked({ type: 'websocket' });
                      return;
                    }
                  }
                } catch (_) {}
                return originalSend.apply(this, arguments);
              };
            } catch (_) {}
            return ws;
          };
        } catch (_) {}
        
        // sendBeacon
        try {
          const originalSendBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
          if (originalSendBeacon) {
            navigator.sendBeacon = function(url, data) {
              try {
                if (ghostModeEnabled) {
                  const bodyStr = bodyToString(data);
                  if (shouldBlockUrlAndMethod(url, 'POST', bodyStr)) {
                    dispatchBlocked({ type: 'beacon', url });
                    return true; // Pretend success
                  }
                }
              } catch (_) {}
              return originalSendBeacon(url, data);
            };
          }
        } catch (_) {}
        
        // Expose flag for debugging
        try { window.__ghostDM_injected = true; } catch (_) {}
      } catch (_) {}
    })();`;
    const script = document.createElement('script');
    script.textContent = code;
    (document.documentElement || document.head || document.body).appendChild(script);
    // Remove the script element to keep DOM clean
    script.parentNode && script.parentNode.removeChild(script);
  }
  
  // Inject immediately to hook as early as possible (enabled defaults to false)
  try { injectMainWorldScript(false); } catch (_) {}
  
  // Read state from storage and forward to page
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['ghostMode'], (result) => {
        try { dispatchSetEnabledToPage(!!(result && result.ghostMode)); } catch (_) {}
      });
    }
  } catch (e) {}
  
  // Listen for Ghost Mode changes and forward to page
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((request) => {
        if (request && request.action === 'ghostModeChanged') {
          dispatchSetEnabledToPage(!!request.enabled);
        }
      });
    }
  } catch (e) {}
  
  // Mark early injection as complete
  window.ghostDM_earlyInjection = true;
})(); 