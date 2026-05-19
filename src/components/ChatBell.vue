<template>
  <q-btn class="q-ma-sm" flat round :icon="Icon" size="sm" @click="$router.push(route)">
    <q-tooltip v-if="count === 0">Nenhuma conversa pendente</q-tooltip>
    <q-tooltip v-else>{{ count }} mensagen(s) aguardando atendimento</q-tooltip>
    <q-badge rounded v-if="count > 0" color="red-8" floating>{{ count }}</q-badge>
  </q-btn>
</template>

<script>
import ENDPOINTS from '../ENDPOINTS'
import chatStream, { CHAT_EVENT } from '../services/chat-stream.js'
import { getConfigs } from 'src/configs'

/** Event key used to communicate the currently active conversation ID. */
const ACTIVE_CONV_EVENT = 'chat:activeConversation'

/**
 * ChatBell — project-agnostic chat notification bell.
 *
 * Shows a badge count of conversations that need operator attention.
 * The definition of "needs attention" is project-specific and is
 * determined entirely by the count endpoint (passed via prop).
 *
 * Sound alert: plays when the count increases (count-diff approach).
 * Sound is suppressed for messages belonging to the conversation the
 * operator is currently viewing (communicated via the
 * 'chat:activeConversation' event on the eventbroadcaster).
 *
 * Props:
 *   - countEndpoint: API endpoint that returns the unattended count (text/plain integer)
 *   - route: route to navigate to on click (defaults to /messaging/chat)
 */
export default {
  name: 'lambdattui-messaging-components-chat-bell',

  props: {
    Participant: {
      type: String,
      required: true,
    },
    Icon: {
      type: String,
      default: () => 'fas fa-comments',
    },
    route: {
      type: String,
      default: '/messaging/chat',
    },
  },

  data() {
    return {
      count: 0,
      activeConversationId: null,
    }
  },

  mounted() {
    this.fetchCount(false)

    this._onChatEvent = (msg) => this.onChatEvent(msg)
    this._onActiveConv = (id) => {
      this.activeConversationId = id
    }

    this.$getService('toolcase/eventbroadcaster').$on(CHAT_EVENT, this._onChatEvent)
    this.$getService('toolcase/eventbroadcaster').$on(ACTIVE_CONV_EVENT, this._onActiveConv)
    chatStream.subscribe()
  },

  beforeUnmount() {
    this.$getService('toolcase/eventbroadcaster').$off(CHAT_EVENT, this._onChatEvent)
    this.$getService('toolcase/eventbroadcaster').$off(ACTIVE_CONV_EVENT, this._onActiveConv)
    chatStream.unsubscribe()
  },

  methods: {
    /**
     * Handles incoming chat events from SSE.
     * Suppresses sound when the message belongs to the conversation
     * currently being viewed by the operator.
     */
    onChatEvent(msg) {
      const belongsToActive =
        this.activeConversationId != null &&
        String(msg?.id_msg_chat) === String(this.activeConversationId)

      if (!belongsToActive || msg.action == 'read') this.fetchCount()
    },

    async fetchCount(playSound = true) {
      try {
        const url = `${ENDPOINTS.CHAT.COUNT_UNREAD}/${this.Participant}`
        const { data } = await this.$getService('toolcase/http').get(url)
        const newCount = parseInt(data, 10) || 0

        if (playSound && newCount > this.count) {
          this.playSound()
        }

        this.count = newCount
      } catch (e) {
        console.error('[ChatBell] fetchCount failed:', e)
      }
    },

    playSound() {
      const soundPath = getConfigs('chat')?.sound
      if (!soundPath) return

      const audio = new Audio(soundPath)
      audio.play().catch((e) => console.warn('[ChatBell] Failed to play sound:', e))
    },
  },
}
</script>
