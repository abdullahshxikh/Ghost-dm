/**
 * Content script for Ghost DM extension
 * Bridges Ghost Mode state and displays toasts
 */

if (window.__ghostDM_contentInitialized) {
  // Prevent duplicate initialization
} else {
  window.__ghostDM_contentInitialized = true;

  let ghostModeEnabled = false;

  (function() {
    // Initialize Ghost Mode state
    chrome.runtime.sendMessage({ action: 'getGhostMode' }, (response) => {
      if (response) {
        ghostModeEnabled = !!response.enabled;
        // Inform page (main world injection) about current state
        try { window.dispatchEvent(new CustomEvent('GhostDMSetEnabled', { detail: ghostModeEnabled })); } catch (_) {}
        if (ghostModeEnabled) {
          showToast('Ghost Mode is active', 'info');
        }
      }
    });
    
    // Listen for Ghost Mode changes
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'ghostModeChanged') {
        ghostModeEnabled = !!request.enabled;
        try { window.dispatchEvent(new CustomEvent('GhostDMSetEnabled', { detail: ghostModeEnabled })); } catch (_) {}
        showToast(ghostModeEnabled ? 'Ghost Mode enabled' : 'Ghost Mode disabled', ghostModeEnabled ? 'success' : 'info');
      }
    });
    
    // Listen for block events from main world
    window.addEventListener('GhostDMBlocked', (e) => {
      showToast('Read receipt blocked', 'success');
    });
  })();

  /**
   * Display toast notification
   */
  function showToast(message, type = 'info') {
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
      const mountTarget = document.body || document.documentElement || document.head;
      if (mountTarget) {
        mountTarget.appendChild(toastContainer);
      }
    }
    
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
    
    if (toastContainer && toastContainer.appendChild) {
      toastContainer.appendChild(toast);
    }
    
    setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => { toast.parentNode && toast.parentNode.removeChild(toast); }, 300);
    }, 3000);
  }
} 