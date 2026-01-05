// NotificationSystem.ts - Handling UI notifications

export class NotificationSystem {
  static show(type: 'success' | 'error' | 'info', title: string, message: string, duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Basic icon map
    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    notification.innerHTML = `
      <div class="notification-icon">${icons[type]}</div>
      <div class="notification-content">
        <div class="notification-title">${this.escapeHtml(title)}</div>
        <div class="notification-message">${this.sanitizeHtml(message)}</div>
      </div>
      <button class="notification-close">×</button>
    `;

    container.appendChild(notification);

    // Close handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      notification.remove();
    });

    if (duration > 0) {
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
  }

  static success(title: string, message: string, duration?: number) {
    this.show('success', title, message, duration);
  }

  static error(title: string, message: string, duration?: number) {
    this.show('error', title, message, duration);
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private static sanitizeHtml(html: string): string {
    // Basic sanitization for links, similar to original security utils
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+="[^"]*"/g, '');
  }
}
