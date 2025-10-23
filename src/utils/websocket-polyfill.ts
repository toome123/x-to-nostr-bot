import WebSocket from 'ws'

// Polyfill WebSocket for Node.js
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket as any
}

// Also ensure it's available globally
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket
}