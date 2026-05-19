/**
 * chat-stream.js
 *
 * Singleton SSE manager for the Chat screen.
 * Connects to the Node.js SSE Server at GET /events?tenant=<key>.
 *
 * Listens for the named event 'chatMessages' and re-broadcasts
 * each incoming message through the shared eventbroadcaster under
 * the key 'chat:newMessage'.
 *
 * Follows the same reference-counted lifecycle as manager-watch.js:
 *   - subscribe()   → called on component mount
 *   - unsubscribe() → called on component unmount
 *   - Connection opens lazily on first consumer, closes on last.
 */

import eventbroadcaster from 'src/modules/lambdatt-ui-toolcase/src/services/eventbroadcaster.js'

export const CHAT_EVENT = 'chat:newMessage'

function getTenantKey() {
  const sub = window.location.hostname.split('.')[0] || ''
  const isLocal = ['localhost', '127'].some((h) => sub.startsWith(h))
  return isLocal ? 'default' : sub || 'default'
}

const chatStream = {
  _sse: null,
  _consumers: 0,

  subscribe() {
    this._consumers++
    if (this._consumers === 1) this._connect()
  },

  unsubscribe() {
    this._consumers = Math.max(0, this._consumers - 1)
    if (this._consumers === 0) this._disconnect()
  },

  // ── Internal ────────────────────────────────────────────────

  _connect() {
    if (this._sse) return
    const tenant = getTenantKey()
    const base = process.env.SSE_URL || `http://${window.location.hostname}:3500`
    const url = `${base}/events?tenant=${encodeURIComponent(tenant)}`
    this._sse = new EventSource(url)

    this._sse.addEventListener('chatMessages', (e) => {
      this._handleEvent(e)
    })

    this._sse.onerror = () => {
      if (this._sse && this._sse.readyState === EventSource.CLOSED) {
        this._sse.close()
        this._sse = null
        if (this._consumers > 0) {
          setTimeout(() => this._connect(), 3000)
        }
      }
    }
  },

  _disconnect() {
    if (this._sse) {
      this._sse.close()
      this._sse = null
    }
  },

  _handleEvent(e) {
    try {
      const msg = JSON.parse(e.data)
      eventbroadcaster.$broadcast(CHAT_EVENT, msg)
    } catch (err) {
      console.warn('[chat-stream] parse error:', err)
    }
  },
}

export default chatStream
