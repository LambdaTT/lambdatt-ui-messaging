/**
 * notification-stream.js
 *
 * Singleton SSE manager for the messaging module.
 *
 * Problem it solves
 * -----------------
 * Both `NotificationBell` and `NotificationsList` need to react to incoming
 * notifications in real time.  If each component opened its own EventSource
 * connection, that would consume TWO PHP-FPM workers per logged-in user — the
 * same problem that existed with the old long-polling approach.
 *
 * Solution
 * --------
 * This singleton owns exactly ONE EventSource connection to
 * GET /messaging/v1/notification/stream (our SSE endpoint).
 *
 * It keeps a simple reference count (`_consumers`).  Any component that wants
 * to observe notification changes calls `subscribe()` on mount and
 * `unsubscribe()` on unmount.  The SSE connection is opened lazily when the
 * first consumer subscribes, and closed automatically when the last consumer
 * unsubscribes — ensuring zero idle connections and zero leaks.
 *
 * When the server emits a `{ type: "changed" }` event, this service re-broadcasts
 * it through the shared `eventbroadcaster` under the key "notifications:changed".
 * Components listen via `eventbroadcaster.$on("notifications:changed", cb)`.
 *
 * Usage
 * -----
 *   // In mounted():
 *   this._onNotif = () => this.refresh();
 *   this.$getService("toolcase/eventbroadcaster").$on("notifications:changed", this._onNotif);
 *   this.$getService("messaging/notification-stream").subscribe();
 *
 *   // In beforeUnmount():
 *   this.$getService("toolcase/eventbroadcaster").$off("notifications:changed", this._onNotif);
 *   this.$getService("messaging/notification-stream").unsubscribe();
 */

import ENDPOINTS from "../ENDPOINTS.js";
import eventbroadcaster from "../../lambdatt-ui-toolcase/src/services/eventbroadcaster.js";

const EVENT_NAME = "notifications:changed";

const notificationStream = {
  /** Active EventSource instance, or null when no consumers are connected. */
  _sse: null,

  /** Number of active consumers (components currently mounted). */
  _consumers: 0,

  /**
   * Register a new consumer.
   * Opens the SSE connection if this is the first consumer.
   */
  subscribe() {
    this._consumers++;
    if (this._consumers === 1) {
      this._connect();
    }
  },

  /**
   * Deregister a consumer.
   * Closes the SSE connection when the last consumer unsubscribes.
   */
  unsubscribe() {
    this._consumers = Math.max(0, this._consumers - 1);
    if (this._consumers === 0) {
      this._disconnect();
    }
  },

  // ── Internal ─────────────────────────────────────────────────────────────

  _connect() {
    if (this._sse) return; // already connected

    const url = `${process.env.API}${ENDPOINTS.NOTIFICATIONS.WATCH}`;
    this._sse = new EventSource(url, { withCredentials: true });

    this._sse.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "changed") {
          eventbroadcaster.$broadcast(EVENT_NAME);
        }
        // "reconnect" is handled natively by EventSource — no action needed.
      } catch (err) {
        console.warn("[notification-stream] parse error:", err);
      }
    };

    this._sse.onerror = () => {
      // EventSource reconnects automatically after errors — no manual action needed.
    };
  },

  _disconnect() {
    if (this._sse) {
      this._sse.close();
      this._sse = null;
    }
  },
};

export default notificationStream;
export { EVENT_NAME };
