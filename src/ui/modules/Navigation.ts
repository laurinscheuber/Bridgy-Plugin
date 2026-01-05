// Navigation.ts

export class Navigation {
  static init() {
    // Tab switching logic
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab;
        this.switchTab(target || 'variables');
      });
    });
  }

  static switchTab(tabId: string) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(`${tabId}-content`)?.classList.add('active');
  }
}
