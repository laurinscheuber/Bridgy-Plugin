// MessageBus.ts - Type-safe communication wrapper

export class MessageBus {
  static send(type: string, payload: any = {}) {
    parent.postMessage({
      pluginMessage: {
        type,
        ...payload
      }
    }, '*');
  }

  static on(type: string, callback: (message: any) => void) {
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message && message.type === type) {
        callback(message);
      }
    });
  }

  static onAny(callback: (message: any) => void) {
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message) {
        callback(message);
      }
    });
  }
}
