# Bridgy Component Styles Reference

## CSS Variables
```css
:root {
        /* Primary Colors - Purple Gradient Theme (Base Values) */
        --primary-50: #f0f9ff;
        --primary-100: #e0e7ff;
        --primary-200: #c7d2fe;
        --primary-300: #c4b5fd;
        --primary-400: #8b5cf6;
        --primary-500: #7c3aed;
        --primary-600: #6366f1;
        --primary-700: #4c1d95;
        
        /* Neutral Colors */
        --neutral-0: #ffffff;
        --neutral-50: #fafafa;
        --neutral-100: #f5f5f5;
        --neutral-200: #e5e5e5;
        --neutral-300: #d4d4d4;
        --neutral-400: #a3a3a3;
        --neutral-500: #737373;
        --neutral-600: #525252;
        --neutral-700: #404040;
        --neutral-800: #262626;
        --neutral-900: #171717;
        
        /* Semantic Colors */
        --success-50: #f0fdf4;
        --success-500: #22c55e;
        --success-600: #16a34a;
        --success-700: #15803d;
        --warning-50: #fefce8;
        --warning-500: #eab308;
        --warning-600: #ca8a04;
        --warning-700: #a16207;
        --error-50: #fef2f2;
        --error-500: #ef4444;
        --error-600: #dc2626;
        --error-700: #b91c1c;
        
        /* Orange/Amber Base Colors */
        --orange-400: #fbbf24;
        --orange-500: #f59e0b;
        --orange-600: #d97706;
        
        /* Extended Purple Colors (Base Values) */
        --purple-bright: #a855f7;
        --purple-deeper: #9333ea;
        --purple-deepest: #6d28d9;
        
        /* Action Colors (All References) */
        --generate-color: var(--primary-400);
        --generate-hover: var(--primary-500);
        --commit-color: var(--orange-500);
        --commit-hover: var(--orange-600);
        
        /* Purple Aliases (All References) */
        --purple-light: var(--primary-300);
        --purple-medium: var(--primary-400);
        --purple-dark: var(--primary-500);
        
        /* Additional Semantic Colors (All References) */
        --info-500: var(--primary-600);     /* Blue info color */
        --warning-400: var(--warning-500);     /* Light warning */
        
        /* Opacity Levels for Glass Effects */
        --opacity-overlay-light: 0.05;
        --opacity-overlay-medium: 0.1;
        --opacity-overlay-heavy: 0.2;
        --opacity-glass-light: 0.1;
        --opacity-glass-medium: 0.2;
        --opacity-glass-heavy: 0.3;
        --opacity-accent-light: 0.2;
        --opacity-accent-medium: 0.3;
        --opacity-accent-heavy: 0.4;
        --opacity-accent-intense: 0.6;
        --opacity-accent-max: 0.7;
        
        /* Glass Background Colors (RGBA combinations) */
        --glass-white-light: rgba(255, 255, 255, var(--opacity-overlay-light));
        --glass-white-medium: rgba(255, 255, 255, var(--opacity-overlay-medium));
        --glass-white-heavy: rgba(255, 255, 255, var(--opacity-overlay-heavy));
        --glass-purple-light: rgba(139, 92, 246, var(--opacity-accent-light));
        --glass-purple-medium: rgba(139, 92, 246, var(--opacity-accent-medium));
        --glass-purple-heavy: rgba(139, 92, 246, var(--opacity-accent-heavy));
        --glass-dark-light: rgba(0, 0, 0, var(--opacity-overlay-medium));
        --glass-dark-medium: rgba(0, 0, 0, var(--opacity-overlay-heavy));
        --glass-dark-heavy: rgba(0, 0, 0, var(--opacity-accent-medium));
        
        /* Backdrop Blur Effects */
        --blur-light: blur(5px);
        --blur-medium: blur(10px);
        --blur-heavy: blur(15px);
        --blur-intense: blur(20px);
        
        /* Background Gradients */
        --gradient-main: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b69 50%, #4c1d95 75%, #7c3aed 100%);
        --gradient-button: linear-gradient(135deg, var(--purple-medium) 0%, var(--purple-bright) 100%);
        --gradient-button-hover: linear-gradient(135deg, var(--purple-dark) 0%, var(--purple-deeper) 100%);
        --gradient-scrollbar: linear-gradient(135deg, var(--purple-medium) 0%, var(--purple-bright) 100%);
        --gradient-text: linear-gradient(135deg, #ffffff, #e0e7ff, #c7d2fe);
        
        /* Spacing */
        --space-1: 0.25rem;
        --space-2: 0.5rem;
        --space-3: 0.75rem;
        --space-4: 1rem;
        --space-6: 1.5rem;
        --space-8: 2rem;
        --space-12: 3rem;
        
        /* Extended Spacing for Components */
        --space-px: 1px;
        --space-0\.5: 0.125rem;  /* 2px */
        --space-1\.5: 0.375rem;  /* 6px */
        --space-2\.5: 0.625rem;  /* 10px */
        --space-5: 1.25rem;      /* 20px */
        --space-7: 1.75rem;      /* 28px */
        --space-9: 2.25rem;      /* 36px */
        --space-10: 2.5rem;      /* 40px */
        
        /* Common Padding Combinations */
        --padding-button: var(--space-4) var(--space-6);
        --padding-button-sm: var(--space-2) var(--space-4);
        --padding-card: var(--space-4);
        --padding-modal: var(--space-8);
        --padding-container: var(--space-6) var(--space-5);
        
        /* Typography */
        --text-xs: 0.75rem;
        --text-sm: 0.875rem;
        --text-base: 1rem;
        --text-lg: 1.125rem;
        --text-xl: 1.25rem;
        --text-2xl: 1.5rem;
        
        /* Font Weights */
        --font-normal: 400;
        --font-medium: 500;
        --font-semibold: 600;
        --font-bold: 700;
        --font-extrabold: 800;
        --font-black: 900;
        
        /* Line Heights */
        --leading-none: 1;
        --leading-tight: 1.2;
        --leading-snug: 1.4;
        --leading-normal: 1.5;
        --leading-relaxed: 1.6;
        
        /* Border Radius */
        --radius-sm: 0.375rem;
        --radius-md: 0.5rem;
        --radius-lg: 0.75rem;
        --radius-xl: 1rem;
        
        /* Extended Border Radius */
        --radius-2xs: 0.25rem;    /* 4px */
        --radius-xs: 0.375rem;    /* 6px */
        --radius-button: 0.625rem; /* 10px */
        --radius-card: 0.75rem;   /* 12px */
        --radius-modal: 0.9375rem; /* 15px */
        --radius-container: 1.25rem; /* 20px */
        --radius-large: 1.5625rem; /* 25px */
        --radius-pill: 50px;
        --radius-full: 50%;
        
        /* Icon Dimensions */
        --icon-xs: 0.75rem;       /* 12px */
        --icon-sm: 1rem;          /* 16px */
        --icon-md: 1.25rem;       /* 20px */
        --icon-lg: 1.5rem;        /* 24px */
        --icon-xl: 1.75rem;       /* 28px */
        --icon-2xl: 2rem;         /* 32px */
        
        /* Shadows */
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        
        /* Custom Purple-themed Shadows */
        --shadow-purple-light: 0 0 20px var(--glass-purple-medium);
        --shadow-purple-medium: 0 4px 15px var(--glass-purple-medium);
        --shadow-purple-heavy: 0 4px 20px var(--glass-purple-heavy);
        --shadow-purple-intense: 0 8px 25px var(--glass-purple-medium);
        --shadow-purple-glow: 0 8px 30px rgba(139, 92, 246, var(--opacity-accent-max));
        
        /* Dark Shadows */
        --shadow-dark: 0 8px 32px var(--glass-dark-medium);
        --shadow-dark-heavy: 0 8px 32px var(--glass-dark-heavy);
        --shadow-dark-inset: inset 0 1px 3px var(--glass-dark-heavy);
        --shadow-dark-inset-heavy: inset 0 1px 5px rgba(0, 0, 0, 0.4);
        
        /* Transitions */
        --transition-fast: all 0.2s ease;
        --transition-normal: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-smooth: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        --transition-color: color 0.2s ease;
        --transition-opacity: opacity 0.5s ease-out;
        
        /* Z-Index Scale */
        --z-hide: -1;
        --z-base: 0;
        --z-docked: 10;
        --z-dropdown: 100;
        --z-sticky: 1000;
        --z-modal: 9999;
      }
```

## Buttons
```css
.btn-large {
        padding: var(--space-3) var(--space-6);
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

.btn svg,
      .btn-primary svg,
      .btn-large svg {
        display: inline-block;
        vertical-align: middle;
        margin-right: var(--space-2);
        stroke: currentColor;
        fill: none;
        flex-shrink: 0;
      }

.btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
      }
```

## Modals
```css
.modal-content::-webkit-scrollbar {
        width: 8px;
      }

.modal-content::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, var(--purple-medium) 0%, #a855f7 100%);
        border-radius: 6px;
        border: 1px solid var(--glass-white-medium);
      }

.modal-content::-webkit-scrollbar-thumb:hover {
        background: var(--gradient-button-hover);
      }

.modal-notification-message a {
        color: var(--purple-light);
        font-weight: var(--font-semibold);
        text-decoration: none;
        display: inline-block;
        margin-top: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--glass-purple-light);
        border: 1px solid var(--glass-purple-heavy);
        border-radius: var(--radius-md);
        transition: var(--transition-fast);
        white-space: nowrap;
      }

.modal-notification-message a:hover {
        background: var(--glass-purple-medium);
        border-color: rgba(139, 92, 246, 0.6);
        color: #ddd6fe;
        transform: translateX(2px);
      }

.modal-notification-message a::after {
        content: " →";
        margin-left: var(--space-1);
        transition: transform 0.2s ease;
        display: inline-block;
      }

.modal-notification-message a:hover::after {
        transform: translateX(3px);
      }

.modal-notification {
        margin: var(--space-4) 0;
        padding: var(--space-4);
        border-radius: var(--radius-modal);
        border: 1px solid var(--glass-white-heavy);
        border-left: 3px solid;
        background: var(--glass-white-medium);
        backdrop-filter: var(--blur-intense);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        animation: slideInModal 0.3s ease-out;
        color: var(--neutral-0);
      }

.modal-notification.success {
        border-left-color: var(--success-500);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--glass-white-light) 100%);
      }

.modal-notification.error {
        border-left-color: #ef4444;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--glass-white-light) 100%);
      }

.modal-notification.info {
        border-left-color: var(--purple-light);
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--glass-white-light) 100%);
      }

.modal-notification-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: var(--text-base);
        margin-top: var(--space-1);
        backdrop-filter: var(--blur-medium);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

.modal-notification.success .modal-notification-icon {
        background: rgba(34, 197, 94, 0.8);
        color: var(--neutral-0);
      }

.modal-notification.error .modal-notification-icon {
        background: rgba(239, 68, 68, 0.8);
        color: var(--neutral-0);
      }

.modal-notification.info .modal-notification-icon {
        background: rgba(139, 92, 246, 0.8);
        color: var(--neutral-0);
      }

.modal-notification-content {
        flex: 1;
        min-width: 0;
      }

.modal-notification-title {
        font-weight: var(--font-semibold);
        margin-bottom: var(--space-2);
        font-size: var(--text-base);
        color: var(--neutral-0);
      }

.modal-notification-message {
        font-size: var(--text-sm);
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.4;
        word-break: break-word;
      }

.modal-notification-message a {
        color: var(--purple-light);
        text-decoration: underline;
        font-weight: var(--font-medium);
      }

.modal-notification-message a:hover {
        color: #a78bfa;
        text-decoration: none;
      }

.modal-notification-close {
        background: var(--glass-white-medium);
        backdrop-filter: var(--blur-medium);
        border: 1px solid var(--glass-white-heavy);
        font-size: var(--text-xl);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-modal);
        flex-shrink: 0;
        transition: var(--transition-fast);
      }

.modal-notification-close:hover {
        background: var(--glass-white-heavy);
        color: var(--neutral-0);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

.modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: var(--blur-intense);
        -webkit-backdrop-filter: var(--blur-intense);
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
      }

.modal-content {
        position: relative;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: var(--blur-intense);
        -webkit-backdrop-filter: var(--blur-intense);
        margin: 5% auto;
        padding: var(--space-8);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        border-radius: var(--radius-container);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--glass-white-medium);
        color: var(--neutral-0);
        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

.modal-header {
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-4);
        border-bottom: 1px solid var(--glass-white-medium);
        background: rgba(139, 92, 246, 0.1);
        margin: calc(-1 * var(--space-8)) calc(-1 * var(--space-8)) var(--space-4);
        padding: var(--space-6) var(--space-8);
        border-radius: var(--radius-container) 20px 0 0;
      }

.modal-header h3 {
        margin: 0;
        color: var(--neutral-0);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
      }

.modal-body {
        margin-bottom: var(--space-4);
        overflow-y: auto;
        flex: 1;
        min-height: 0;
      }

.modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        padding-top: var(--space-4);
        border-top: 1px solid var(--neutral-200);
      }

.modal-content {
          margin: 2% auto;
          max-height: 96vh;
          padding: var(--space-6);
        }

.modal-content {
          margin: 1% auto;
          max-height: 98vh;
          padding: var(--space-4);
        }

.modal-header {
          margin-bottom: var(--space-2);
        }

.modal-body {
          margin-bottom: var(--space-2);
        }
```

## Inputs
```css
.search-input {
        width: 100%;
        padding: 1rem 1.5rem;
        border: 2px solid rgba(139, 92, 246, 0.6);
        border-radius: 16px;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: var(--blur-intense);
        color: var(--neutral-0);
        position: relative;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

.search-input::placeholder {
        color: rgba(255, 255, 255, 0.8);
        font-weight: 400;
      }

.search-input:focus {
        border-color: rgba(139, 92, 246, 1);
        outline: none;
        box-shadow: 0 8px 32px var(--glass-purple-heavy), 0 0 0 2px rgba(139, 92, 246, 0.5);
        background: rgba(0, 0, 0, 0.8);
        transform: translateY(-1px);
      }

.search-input-wrapper {
        position: relative;
      }

.form-group {
        margin-bottom: var(--space-4);
      }

.form-group label {
        display: block;
        margin-bottom: var(--space-2);
        color: rgba(255, 255, 255, 0.9);
        font-weight: var(--font-semibold);
        font-size: var(--text-sm);
      }

.form-group input {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--neutral-300);
        border-radius: var(--radius-lg);
        font-size: var(--text-sm);
        transition: var(--transition-fast);
        box-shadow: var(--shadow-sm);
      }

.form-group input:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

.input-tabs {
        display: flex;
        gap: var(--space-1);
        margin-bottom: var(--space-4);
        background: var(--glass-white-light);
        border-radius: var(--radius-card);
        padding: var(--space-1);
      }

.input-tab {
        flex: 1;
        padding: var(--space-2) var(--space-4);
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        border-radius: var(--radius-button);
        cursor: pointer;
        transition: var(--transition-fast);
      }

.input-tab.active {
        background: var(--gradient-button);
        color: var(--neutral-0);
        box-shadow: var(--shadow-purple-light);
      }

.input-tab:hover:not(.active) {
        background: var(--glass-white-medium);
      }

.input-content {
        display: none;
      }

.input-content.active {
        display: block;
      }

.input-format-selector {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

.input-format-selector label {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--text-sm);
        cursor: pointer;
      }

.input-format-selector input[type="radio"] {
        accent-color: var(--purple-medium);
      }

.input-actions {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

.input-group {
        margin-top: var(--space-3);
      }

.input-group label {
        display: block;
        margin-bottom: var(--space-1);
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
      }

.input-group input[type="text"] {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-white-medium);
        border-radius: var(--radius-button);
        padding: var(--space-2) var(--space-3);
        color: var(--neutral-0);
        font-size: var(--text-sm);
        transition: var(--transition-fast);
      }

.input-group input[type="text"]:focus {
        outline: none;
        border-color: var(--purple-medium);
        box-shadow: 0 0 0 2px var(--glass-purple-light);
      }
```

## Cards
```css
.feedback-section {
        background: var(--glass-purple-light);
        backdrop-filter: var(--blur-intense);
        border: 1px solid var(--glass-purple-medium);
        border-radius: var(--radius-container);
        padding: var(--space-4);
        margin-bottom: var(--space-6);
        box-shadow: 0 8px 32px var(--glass-purple-light);
      }
```

## Tabs
```css
.tabs {
        display: flex;
        background: var(--glass-white-light);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid var(--glass-white-medium);
        border-radius: var(--radius-modal);
        padding: 8px;
        margin-bottom: var(--space-6);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        gap: 4px;
      }

.tab {
        flex: 1;
        padding: 1rem 1.5rem;
        cursor: pointer;
        font-weight: var(--font-medium);
        font-size: var(--text-sm);
        text-align: center;
        color: rgba(255, 255, 255, 0.7);
        background: transparent;
        border: none;
        border-radius: var(--radius-button);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

.tab::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(168, 85, 247, 0.05) 100%);
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: -1;
      }

.tab:hover {
        color: var(--purple-light);
        transform: translateY(-1px);
      }

.tab:hover::before {
        opacity: 0.3;
      }

.tab.active {
        color: var(--neutral-0);
        background: linear-gradient(135deg, var(--purple-medium), #a855f7);
        box-shadow: 0 4px 15px var(--glass-purple-heavy);
        font-weight: var(--font-semibold);
      }

.tab.active::before {
        opacity: 1;
      }

.tab:not(.active):hover {
        background: rgba(139, 92, 246, 0.05);
        border-color: var(--glass-purple-light);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
        color: var(--purple-light);
      }

.tab-content {
        display: none;
        background: var(--glass-white-light);
        backdrop-filter: var(--blur-heavy);
        -webkit-backdrop-filter: var(--blur-heavy);
        border-radius: var(--radius-container);
        padding: var(--space-6);
        box-shadow: var(--shadow-dark);
        border: 1px solid var(--glass-white-medium);
        animation: fadeIn 0.3s ease-in-out;
      }

.tab-content.active {
        display: block;
      }

.sub-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        padding: 6px;
        margin-bottom: var(--space-5);
        gap: 4px;
      }

.sub-tab {
        flex: 1;
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-weight: var(--font-medium);
        font-size: var(--text-sm);
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        transition: all 0.2s ease;
        position: relative;
      }

.sub-tab:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-1px);
      }

.sub-tab.active {
        color: var(--neutral-0);
        background: var(--primary-500);
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        font-weight: var(--font-semibold);
      }

.sub-tab-content {
        display: none;
        animation: fadeIn 0.3s ease-in-out;
      }

.sub-tab-content.active {
        display: block;
      }

.tabs {
          flex-direction: column;
        }

.tab {
          text-align: left;
        }
```

## Headers
```css
.header {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: var(--blur-intense);
        -webkit-backdrop-filter: var(--blur-intense);
        border: 1px solid var(--glass-white-medium);
        border-radius: var(--radius-container);
        padding: var(--space-8);
        margin-bottom: var(--space-8);
        position: relative;
        overflow: visible;
      }

.header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

.header-title {
        display: flex;
        align-items: center;
      }

.header-title h1 {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 0;
        background: linear-gradient(135deg, #ffffff, #e0e7ff, #c7d2fe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

.header-subtitle {
        font-size: var(--text-sm);
        color: rgba(255, 255, 255, 0.8);
        font-weight: var(--font-medium);
        margin-top: var(--space-1);
        display: block;
      }

.header-actions {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }
```

## Notifications
```css
.notification-container {
        position: fixed;
        top: var(--space-4);
        right: var(--space-4);
        z-index: 1000;
        max-width: 400px;
      }

.notification {
        background: var(--glass-white-medium);
        backdrop-filter: var(--blur-intense);
        border: 1px solid var(--glass-white-heavy);
        border-radius: var(--radius-modal);
        padding: var(--space-4);
        margin-bottom: var(--space-3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border-left: 3px solid;
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        animation: slideIn 0.3s ease-out;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        color: var(--neutral-0);
      }

.notification.success {
        border-left-color: var(--success-500);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--glass-white-light) 100%);
      }

.notification.error {
        border-left-color: #ef4444;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--glass-white-light) 100%);
      }

.notification.info {
        border-left-color: var(--purple-light);
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--glass-white-light) 100%);
      }

.notification-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: var(--text-sm);
        margin-top: var(--space-1);
        backdrop-filter: var(--blur-medium);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

.notification.success .notification-icon {
        background: rgba(34, 197, 94, 0.8);
        color: var(--neutral-0);
      }

.notification.error .notification-icon {
        background: rgba(239, 68, 68, 0.8);
        color: var(--neutral-0);
      }

.notification.info .notification-icon {
        background: rgba(139, 92, 246, 0.8);
        color: var(--neutral-0);
      }

.notification-content {
        flex: 1;
        min-width: 0;
      }

.notification-title {
        font-weight: var(--font-semibold);
        margin-bottom: var(--space-1);
        font-size: var(--text-sm);
        color: var(--neutral-0);
      }

.notification-message {
        font-size: var(--text-sm);
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.4;
        word-break: break-word;
      }

.notification-close {
        background: var(--glass-white-medium);
        backdrop-filter: var(--blur-medium);
        border: 1px solid var(--glass-white-heavy);
        font-size: var(--text-lg);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-modal);
        flex-shrink: 0;
        transition: var(--transition-fast);
      }

.notification-close:hover {
        background: var(--glass-white-heavy);
        color: var(--neutral-0);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

.notification.fade-out {
        animation: fadeOut 0.3s ease-in forwards;
      }

.notification-message a,
      .modal-notification-message a {
        color: var(--purple-light);
        font-weight: var(--font-semibold);
        text-decoration: none;
        display: inline-block;
        margin-top: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--glass-purple-light);
        border: 1px solid var(--glass-purple-heavy);
        border-radius: var(--radius-md);
        transition: var(--transition-fast);
        white-space: nowrap;
      }

.notification-message a:hover,
      .modal-notification-message a:hover {
        background: var(--glass-purple-medium);
        border-color: rgba(139, 92, 246, 0.6);
        color: #ddd6fe;
        transform: translateX(2px);
      }

.notification-message a::after,
      .modal-notification-message a::after {
        content: " →";
        margin-left: var(--space-1);
        transition: transform 0.2s ease;
        display: inline-block;
      }

.notification-message a:hover::after,
      .modal-notification-message a:hover::after {
        transform: translateX(3px);
      }

.success-message, .test-success-message {
        background: linear-gradient(135deg, var(--success-50) 0%, var(--success-100) 100%);
        color: var(--success-700);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        margin-top: var(--space-4);
        font-size: var(--text-sm);
        display: none;
        border: 1px solid var(--success-200);
        box-shadow: var(--shadow-sm);
        font-weight: var(--font-medium);
      }

.error-message {
        background: linear-gradient(135deg, var(--error-50) 0%, var(--error-100) 100%);
        color: var(--error-700);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        margin-top: var(--space-4);
        font-size: var(--text-sm);
        border: 1px solid var(--error-200);
        box-shadow: var(--shadow-sm);
      }

.error-message p {
        margin: 0 0 var(--space-2) 0;
      }

.error-message p:last-child {
        margin-bottom: 0;
      }
```

## Loading
```css
.loading {
        text-align: center;
        padding: var(--space-8);
        color: rgba(255, 255, 255, 0.8);
        background: var(--glass-white-light);
        backdrop-filter: var(--blur-medium);
        border-radius: var(--radius-lg);
        position: relative;
      }

.loading::before {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid var(--glass-white-heavy);
        border-top: 2px solid var(--purple-medium);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: var(--space-2);
      }

.loading-spinner {
        animation: pulse 1.5s ease-in-out infinite;
      }

.progress-bar-container {
        width: 100%;
        height: 8px;
        background: var(--neutral-200);
        border-radius: var(--radius-sm);
        margin: var(--space-4) 0 var(--space-2) 0;
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
      }

.progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
        border-radius: var(--radius-sm);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

.progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 1s infinite;
      }

.progress-status {
        font-size: var(--text-sm);
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: var(--space-4);
        font-style: italic;
        font-weight: var(--font-medium);
      }

.progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-pill);
        overflow: hidden;
        margin-bottom: var(--space-2);
      }

.progress-fill {
        height: 100%;
        background: var(--gradient-button);
        width: 0%;
        transition: width 2s ease;
        border-radius: var(--radius-pill);
      }

.progress-text {
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--text-sm);
      }
```


# Figma Component Specifications

## Button Component

### Primary Button
- **Frame Size**: Auto width × 40px
- **Auto Layout**: Horizontal, center aligned
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 10px
- **Fill**: Gradient (135°, #8b5cf6 → #a855f7)
- **Text**: Inter Semibold, 14px, #FFFFFF
- **Effects**: Drop shadow (0px 4px 15px, 30% opacity, #8b5cf6)

### Secondary Button
- **Frame Size**: Auto width × 40px  
- **Auto Layout**: Horizontal, center aligned
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 10px
- **Fill**: rgba(0, 0, 0, 0.1)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Text**: Inter Medium, 14px, #f5f5f5

## Input Component

### Default State
- **Frame Size**: 100% width × 40px
- **Padding**: 12px horizontal
- **Border Radius**: 8px
- **Fill**: rgba(0, 0, 0, 0.2)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Text**: Inter Regular, 14px, #e5e5e5

### Focused State
- **Stroke**: 1px, #8b5cf6
- **Effects**: Drop shadow (0px 0px 0px 3px, 20% opacity, #8b5cf6)

## Card Component

- **Auto Layout**: Vertical, 16px spacing
- **Padding**: 16px all sides
- **Border Radius**: 12px
- **Fill**: rgba(0, 0, 0, 0.1) with backdrop blur
- **Stroke**: 1px, rgba(255, 255, 255, 0.05)
- **Effects**: Background blur 15px

## Modal Component

### Modal Container
- **Frame Size**: 500px width × Auto height
- **Auto Layout**: Vertical
- **Border Radius**: 15px
- **Fill**: rgba(26, 26, 58, 0.98)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Effects**: 
  - Drop shadow (0px 8px 32px, 30% opacity, #000000)
  - Background blur 20px

### Modal Header
- **Height**: 60px
- **Padding**: 24px
- **Border Bottom**: 1px, rgba(255, 255, 255, 0.05)
