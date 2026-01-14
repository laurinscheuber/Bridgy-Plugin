// ===== SEARCH MODULE =====

// Initialize Search Features (Clear buttons etc.)
window.initSearchFeatures = function() {
  const searches = [
    { inputId: 'variable-search', clearBtnId: 'clear-variable-search' },
    { inputId: 'quality-search', clearBtnId: 'clear-quality-search' },
    { inputId: 'stats-search', clearBtnId: 'clear-stats-search' }
  ];

  searches.forEach(({ inputId, clearBtnId }) => {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);

    if (input && clearBtn) {
      // Input event listener to toggle button visibility
      input.addEventListener('input', function() {
        if (this.value && this.value.length > 0) {
          clearBtn.style.display = 'flex';
        } else {
          clearBtn.style.display = 'none';
        }
      });
      
      // Initialize state
      if (input.value && input.value.length > 0) {
        clearBtn.style.display = 'flex';
      } else {
        clearBtn.style.display = 'none';
      }
    }
  });
};

window.clearSearch = function (inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true })); // Ensure bubbles for delegation
    input.focus();
  }
};
