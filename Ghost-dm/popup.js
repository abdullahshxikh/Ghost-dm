/**
 * Popup script for Ghost DM extension
 * Manages the extension popup interface and Ghost Mode toggle
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('ghostToggle');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  // Read Ghost Mode state from storage
  try {
    const result = await chrome.storage.sync.get(['ghostMode']);
    const isEnabled = result.ghostMode || false;
    
    // Set initial toggle state
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  } catch (error) {
    console.error('Error loading Ghost Mode state:', error);
    statusText.textContent = 'Error loading status';
    statusText.className = 'status-text error';
    statusIndicator.textContent = '⚪';
  }
  
  // Handle toggle changes
  toggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    
    try {
      statusText.textContent = enabled ? 'Enabling...' : 'Disabling...';
      statusText.className = 'status-text';
      
      // Save new state to storage
      await chrome.storage.sync.set({ ghostMode: enabled });
      
      // Notify background script
      await chrome.runtime.sendMessage({
        action: 'toggleGhostMode',
        enabled: enabled
      });
      
      updateStatus(enabled);
      showToast(enabled ? 'Ghost Mode enabled' : 'Ghost Mode disabled');
      
    } catch (error) {
      console.error('Error toggling Ghost Mode:', error);
      statusText.textContent = 'Error updating settings';
      statusText.className = 'status-text error';
      statusIndicator.textContent = '⚪';
      
      // Revert toggle and storage
      toggle.checked = !enabled;
      await chrome.storage.sync.set({ ghostMode: !enabled });
    }
  });
});

/**
 * Update status display based on Ghost Mode state
 */
function updateStatus(enabled) {
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  if (enabled) {
    statusText.textContent = 'Active - Read receipts blocked';
    statusText.className = 'status-text active';
    statusIndicator.textContent = '🟢';
  } else {
    statusText.textContent = 'Inactive - Read receipts visible';
    statusText.className = 'status-text inactive';
    statusIndicator.textContent = '⚪';
  }
}

/**
 * Display toast notification
 */
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
} 