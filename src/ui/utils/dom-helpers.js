/**
 * DOM manipulation utilities
 */

/**
 * Copy text to clipboard
 */
function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text).then(
    function() {
      // Show feedback
      const originalText = element.textContent;
      element.textContent = "Copied!";

      // Reset after 1.5 seconds
      setTimeout(() => {
        element.textContent = originalText;
      }, 1500);
    }
  );
}

/**
 * Toggle display of multiple values
 */
function toggleValues(element) {
  const valuesList = element.nextElementSibling;
  const toggleIcon = element.querySelector('.toggle-icon');

  if (valuesList.style.display === 'none' || !valuesList.style.display) {
    valuesList.style.display = 'block';
    toggleIcon.textContent = '▲';
  } else {
    valuesList.style.display = 'none';
    toggleIcon.textContent = '▼';
  }
}

/**
 * Toggle component set expansion
 */
function toggleComponentSet(index) {
  const headerEl = document.querySelector(
    `.component-set-header[data-index="${index}"]`
  );
  const childrenEl = document.getElementById(`children-${index}`);

  if (childrenEl.classList.contains("expanded")) {
    childrenEl.classList.remove("expanded");
    headerEl.classList.remove("expanded");
    headerEl.querySelector(".component-set-toggle").textContent = "+";
  } else {
    childrenEl.classList.add("expanded");
    headerEl.classList.add("expanded");
    headerEl.querySelector(".component-set-toggle").textContent = "›";
  }
}

/**
 * Toggle styles display
 */
function toggleStyles(element) {
  element.classList.toggle("expanded");
  
  // If we're expanding, scroll the element into view
  if (element.classList.contains("expanded")) {
    setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}

/**
 * Show/hide elements with smooth transitions
 */
function fadeIn(element, duration = 300) {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    element.style.opacity = progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
  const startTime = performance.now();
  const startOpacity = parseFloat(window.getComputedStyle(element).opacity);
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    element.style.opacity = startOpacity * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
    }
  }
  
  requestAnimationFrame(animate);
}

/**
 * Create and show a toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  // Remove any existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add toast styles if not already defined
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .toast-info { background-color: #2196f3; }
      .toast-success { background-color: #4caf50; }
      .toast-warning { background-color: #ff9800; }
      .toast-error { background-color: #f44336; }
    `;
    document.head.appendChild(style);
  }

  // Add to DOM and show
  document.body.appendChild(toast);
  
  // Trigger fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Debounce function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get element by ID with error handling
 */
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID '${id}' not found`);
  }
  return element;
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('loading');
  }
}

// Make functions globally available
window.domHelpers = {
  copyToClipboard,
  toggleValues,
  toggleComponentSet,
  toggleStyles,
  fadeIn,
  fadeOut,
  showToast,
  debounce,
  safeGetElement,
  setButtonLoading
};

// Also make individual functions global for backward compatibility
window.copyToClipboard = copyToClipboard;
window.toggleValues = toggleValues;
window.toggleComponentSet = toggleComponentSet;
window.toggleStyles = toggleStyles;