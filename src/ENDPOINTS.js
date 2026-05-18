export default {
  NOTIFICATIONS: {
    COUNT_UNREAD: '/messaging/v1/notification/count-unread', // GET
    WATCH: '/messaging/v1/notification/watch', // GET — SSE stream
    MARK_AS_READ: '/messaging/v1/notification/mark-as-read', // PUT /:key
    NOTIFICATION: '/messaging/v1/notification', // GET/PUT
    HEADLINES: '/messaging/v1/notification/headlines', // GET
  },

  PUSH: {
    SUBSCRIPTION: '/messaging/v1/push/subscription', // POST/PUT /:oldTOken/:newTOken
  },

  CHAT: {
    CHAT: '/messaging/v1/chat', // GET/PUT/DELETE / :chatKey
    SUMMARY: '/messaging/v1/chat-summary', // GET / :participant
    MESSAGE: '/messaging/v1/chat-message', // GET/POST/DELETE / :chatKey/:msgKey
  },
}
