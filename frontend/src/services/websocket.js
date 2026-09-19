/**
 * Robust WebSocket client with auto-reconnect backoff
 */

class ScadaWebSocketClient {
  constructor(url = 'ws://localhost:8000/ws') {
    this.url = url;
    this.ws = null;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 5000;
    this.onMessageCallbacks = new Set();
    this.onStatusChangeCallbacks = new Set();
    this.status = 'DISCONNECTED'; // 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'
    this.manualClose = false;
  }

  connect() {
    this.manualClose = false;
    this._setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this._setStatus('CONNECTED');
        this.reconnectDelay = 1000; // reset backoff
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const data = JSON.parse(event.data);
          this.onMessageCallbacks.forEach(cb => cb(data));
        } catch (err) {
          console.error('[WebSocket JSON parse error]:', err);
        }
      };

      this.ws.onclose = () => {
        this._stopPing();
        this._setStatus('DISCONNECTED');
        if (!this.manualClose) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket error]:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn('[WebSocket connection creation failed]:', e);
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this.manualClose = true;
    this._stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setStatus('DISCONNECTED');
  }

  onMessage(callback) {
    this.onMessageCallbacks.add(callback);
    return () => this.onMessageCallbacks.delete(callback);
  }

  onStatusChange(callback) {
    this.onStatusChangeCallbacks.add(callback);
    callback(this.status);
    return () => this.onStatusChangeCallbacks.delete(callback);
  }

  _setStatus(newStatus) {
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach(cb => cb(newStatus));
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 15000);
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export const scadaWs = new ScadaWebSocketClient();
