<template>
  <div class="chat-container">
    <!-- SIDEBAR -->
    <div class="chat-sidebar">
      <!-- Search field -->
      <div class="sidebar-search q-pa-sm">
        <InputField
          type="text"
          v-model="search"
          Label="Buscar conversa..."
          Icon="fas fa-search"
          dense
        />
      </div>

      <!-- Active Conversations -->
      <div class="sidebar-section">
        <q-item-label header class="section-header text-teal-8">
          <q-icon name="fas fa-headset" size="14px" class="q-mr-xs" />
          Ativas ({{ filteredActive.length }})
        </q-item-label>
        <q-list class="conversation-list" separator>
          <q-item
            v-for="conv in filteredActive"
            :key="conv.ds_key"
            clickable
            :active="selectedConversation?.ds_key === conv.ds_key"
            active-class="bg-teal-1"
            @click="selectConversation(conv)"
          >
            <q-item-section avatar>
              <q-avatar :color="avatarColor(conv)" text-color="white" size="40px">
                {{ convInitials(conv)
                }}<span v-if="convCounterparts(conv)" class="avatar-counter">{{
                  convCounterparts(conv)
                }}</span>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-grey-9" :class="{ 'text-bold': conv.unreadMsgsCount > 0 }">
                {{ convTitle(conv) }}
                <q-badge v-if="conv.unreadMsgsCount > 0" rounded color="red-8">
                  {{ conv.unreadMsgsCount }}
                  <q-tooltip>{{ conv.unreadMsgsCount }} mensagens não lidas</q-tooltip>
                </q-badge>
              </q-item-label>
              <q-item-label caption lines="1">{{ conv.lastMessageContent || '...' }}</q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-item-label caption>{{ conv.lastMessageTime }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="!filteredActive.length" class="empty-list text-grey-5">
          <q-icon name="fas fa-inbox" size="28px" />
          <span>Nenhuma conversa ativa</span>
        </div>
      </div>

      <q-separator />

      <!-- Closed Conversations -->
      <div class="sidebar-section">
        <q-item-label header class="section-header text-grey-7">
          <q-icon name="fas fa-check-circle" size="14px" class="q-mr-xs" />
          Encerradas ({{ filteredClosed.length }})
        </q-item-label>
        <q-list class="conversation-list" separator>
          <q-item
            v-for="conv in filteredClosed"
            :key="conv.ds_key"
            clickable
            :active="selectedConversation?.ds_key === conv.ds_key"
            active-class="bg-grey-3"
            @click="selectConversation(conv)"
          >
            <q-item-section avatar>
              <q-avatar color="grey-4" text-color="grey-7" size="40px">
                {{ convInitials(conv)
                }}<span v-if="convCounterparts(conv)" class="avatar-counter">{{
                  convCounterparts(conv)
                }}</span>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-grey-7">
                {{ convTitle(conv) }}
              </q-item-label>
              <q-item-label caption lines="1">{{ conv.lastMessageContent || '...' }}</q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-item-label caption>{{ conv.lastMessageTime }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="!filteredClosed.length" class="empty-list text-grey-5">
          <q-icon name="fas fa-inbox" size="28px" />
          <span>Nenhuma conversa encerrada</span>
        </div>
      </div>
    </div>

    <!-- CHAT PANEL -->
    <div class="chat-panel">
      <template v-if="selectedConversation">
        <!-- Chat Header -->
        <q-toolbar class="chat-header bg-white">
          <q-avatar :color="avatarColor(selectedConversation)" text-color="white" size="38px">
            {{ convInitials(selectedConversation)
            }}<span v-if="convCounterparts(selectedConversation)" class="avatar-counter">{{
              convCounterparts(selectedConversation)
            }}</span>
          </q-avatar>
          <div class="q-ml-sm">
            <div class="text-weight-bold text-grey-9" style="font-size: 15px">
              {{ convTitle(selectedConversation) }}
            </div>
            <!-- <div class="text-caption text-grey-6">
              {{ selectedConversation.customer_phone }}
            </div> -->
          </div>
          <q-space />
          <q-badge
            :color="selectedConversation.dt_ended ? 'grey-5' : 'teal'"
            :label="selectedConversation.dt_ended ? 'Encerrada' : 'Ativa'"
          />
          <q-btn
            v-if="!selectedConversation.dt_ended"
            flat
            round
            dense
            icon="fas fa-times-circle"
            color="red-7"
            size="sm"
            class="q-ml-sm"
            @click="confirmCloseConversation"
          >
            <q-tooltip>Encerrar conversa</q-tooltip>
          </q-btn>
        </q-toolbar>

        <!-- Messages Area -->
        <div ref="messagesArea" class="messages-area">
          <div class="text-center q-py-md" v-if="messagesLoading">
            <q-spinner-dots color="teal" size="32px" />
          </div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.ds_key"
              class="message-row"
              :class="msg.ds_sender"
            >
              <div class="message-bubble" :class="participantClass(msg.ds_sender)">
                <div class="message-sender">{{ senderLabel(msg.ds_sender) }}</div>
                <div class="message-text">{{ msg.tx_content }}</div>
                <div class="message-time text-grey-6">{{ msg.time_fmt }}</div>
              </div>
            </div>
            <div v-if="!messages.length" class="text-center text-grey-5 q-py-lg">
              Nenhuma mensagem nesta conversa
            </div>
          </template>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area bg-grey-2">
          <q-input
            v-model="newMessage"
            outlined
            dense
            rounded
            placeholder="Digite uma mensagem..."
            bg-color="white"
            @keyup.enter="sendMessage"
          >
            <template #append>
              <q-btn flat round dense icon="fas fa-paper-plane" color="teal" @click="sendMessage" />
            </template>
          </q-input>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="chat-empty">
        <q-icon name="fas fa-comments" size="56px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Selecione uma conversa</div>
        <div class="text-caption text-grey-5">
          Escolha uma conversa ao lado para visualizar as mensagens
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ENDPOINTS from '../ENDPOINTS.js'
import chatStream, { CHAT_EVENT } from '../services/chat-stream.js'

const ACTIVE_CONV_EVENT = 'chat:activeConversation'

const AVATAR_COLORS = [
  'teal-7',
  'indigo-7',
  'deep-orange-7',
  'purple-7',
  'cyan-7',
  'amber-9',
  'blue-grey-7',
]

const SENDER_LABELS = {
  ai_bot: '🤖 BOT',
  operator: '🎧 Você',
}

export default {
  name: 'chat-screen',

  props: {
    Participant: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      breadcrumb: [
        { label: 'Home', icon: 'fas fa-home', to: '/' },
        { label: 'Conversas', icon: 'fas fa-comments' },
      ],
      search: '',
      conversations: [],
      selectedConversation: null,
      messages: [],
      messagesLoading: false,
      newMessage: '',
      loading: false,
    }
  },

  computed: {
    filteredActive() {
      return this.conversations
        .filter((c) => !c.dt_ended && this.isVisibleConversation(c) && this.matchesSearch(c))
        .sort((a, b) => new Date(b.dt_created) - new Date(a.dt_created))
    },

    filteredClosed() {
      return this.conversations
        .filter((c) => !!c.dt_ended && this.isVisibleConversation(c) && this.matchesSearch(c))
        .sort((a, b) => new Date(b.dt_ended) - new Date(a.dt_ended))
    },
  },

  mounted() {
    this.fetchConversations()

    // Subscribe to real-time chat events:
    this._onNewMessage = (msg) => this.onNewMessage(msg)
    this.$getService('toolcase/eventbroadcaster').$on(CHAT_EVENT, this._onNewMessage)
    chatStream.subscribe()
  },

  beforeUnmount() {
    this.$getService('toolcase/eventbroadcaster').$off(CHAT_EVENT, this._onNewMessage)
    this.$getService('toolcase/eventbroadcaster').$broadcast(ACTIVE_CONV_EVENT, null)
    chatStream.unsubscribe()
  },

  methods: {
    // ─── Data Fetching ───────────────────────────────

    async fetchConversations() {
      this.loading = true
      try {
        const http = this.$getService('toolcase/http')
        const result = await http.get(`${ENDPOINTS.CHAT.SUMMARY}/${this.Participant}`)
        this.conversations = result?.data ?? []
      } catch (e) {
        console.error('[Chat] fetchConversations failed:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchMessages(conversationKey) {
      this.messagesLoading = true
      try {
        const http = this.$getService('toolcase/http')
        const url = `${ENDPOINTS.CHAT.MESSAGE}/${conversationKey}/${this.Participant}`
        const result = await http.get(url)
        this.messages = result?.data ?? []
      } catch (e) {
        console.error('[Chat] fetchMessages failed:', e)
        this.messages = []
      } finally {
        this.messagesLoading = false
        this.$nextTick(() => this.scrollToBottom())
      }
    },

    // ─── Actions ─────────────────────────────────────

    selectConversation(conv) {
      this.selectedConversation = conv
      this.messages = []
      this.fetchMessages(conv.ds_key)

      // Notify ChatBell which conversation is currently being viewed:
      this.$getService('toolcase/eventbroadcaster').$broadcast(ACTIVE_CONV_EVENT, conv.id_msg_chat)
    },

    async sendMessage() {
      const text = this.newMessage.trim()
      if (!text || !this.selectedConversation) return

      this.newMessage = ''
      this.$nextTick(() => this.scrollToBottom())

      try {
        const http = this.$getService('toolcase/http')
        await http.post(
          `${ENDPOINTS.CHAT.MESSAGE}/${this.selectedConversation.ds_key}/${this.Participant}`,
          {
            tx_content: text,
            ds_sender: 'operator',
          },
        )
      } catch (e) {
        console.error('[Chat] sendMessage failed:', e)
      }
    },

    /**
     * Prompts confirmation and closes the selected conversation.
     */
    confirmCloseConversation() {
      let confirmClose = confirm(
        `Deseja realmente encerrar a conversa com ${this.selectedConversation.customer_name || this.selectedConversation.customer_phone}?`,
      )

      if (confirmClose) {
        this.closeConversation()
      }
    },

    async closeConversation() {
      if (!this.selectedConversation) return

      try {
        const http = this.$getService('toolcase/http')
        const url = `${ENDPOINTS.CHAT.CHAT}/${this.selectedConversation.ds_key}/close`
        await http.put(url)

        // Update local state — mark as ended:
        this.selectedConversation.dt_ended = new Date().toISOString()

        this.$q.notify({
          type: 'positive',
          message: 'Conversa encerrada com sucesso.',
          icon: 'fas fa-check-circle',
        })

        // Reset the chat panel to its clean empty state:
        this.selectedConversation = null
        this.messages = []
        this.newMessage = ''
        this.$getService('toolcase/eventbroadcaster').$broadcast(ACTIVE_CONV_EVENT, null)
      } catch (e) {
        console.error('[Chat] closeConversation failed:', e)
        this.$q.notify({
          type: 'negative',
          message: 'Falha ao encerrar a conversa.',
          icon: 'fas fa-exclamation-circle',
        })
      }
    },

    // ─── Real-time SSE Handler ───────────────────────

    onNewMessage(msg) {
      // Update sidebar for the matching conversation:
      this.updateSidebarPreview(msg)

      // If the message belongs to the currently selected conversation, append it:
      if (
        this.selectedConversation &&
        parseInt(msg.id_msg_chat) === parseInt(this.selectedConversation.id_msg_chat) &&
        msg.action == 'new'
      ) {
        // Deduplicate — skip if already present (from optimistic send or duplicate SSE):
        if (this.messages.some((m) => m.ds_key === msg.ds_key)) return

        // Use spread assignment to guarantee Vue reactivity triggers:
        this.messages.push({
          ...msg,
          time_fmt: this.formatTime(msg.dt_created),
        })

        this.$nextTick(() => this.scrollToBottom())
      }
    },

    updateSidebarPreview(msg) {
      const chatId = parseInt(msg.id_msg_chat)
      const conversation = this.conversations.find((c) => c.id_msg_chat == chatId)
      if (!conversation) {
        this.fetchConversations()
        return
      }

      if (msg.action == 'read') {
        if (conversation.unreadMsgsCount > 0) {
          conversation.unreadMsgsCount--
        }
      } else if (msg.ds_sender != 'operator') {
        conversation.lastMessageContent = msg.tx_content
        conversation.lastMessageTime = this.formatTime(msg.dt_created)
        if (chatId != this.selectedConversation.id_msg_chat) conversation.unreadMsgsCount++
      }
    },

    // ─── Helpers ─────────────────────────────────────

    /**
     * Returns a human-readable label for the message sender.
     */
    senderLabel(sender) {
      return SENDER_LABELS[sender] || `👤 ${sender}`
    },

    participantClass(participant) {
      if (participant == 'operator') return 'operator'
      if (participant == 'ai_bot') return 'ai_bot'
      return 'customer'
    },

    matchesSearch(conv) {
      if (!this.search) return true
      const q = this.search.toLowerCase()
      const name = (conv.customer_name || '').toLowerCase()
      const phone = conv.customer_phone || ''
      const lastMsg = (conv.last_message || '').toLowerCase()
      return name.includes(q) || phone.includes(q) || lastMsg.includes(q)
    },

    /**
     * Returns false for conversations still handled by the bot (bot_active).
     * Only handed_off or closed conversations should appear in the panel.
     */
    isVisibleConversation(conv) {
      return conv.ds_status !== 'bot_active'
    },

    /**
     * Returns counterpart participants (excluding the reader/self).
     */
    getCounterparts(conv) {
      const self = (this.Participant || '').toLowerCase()
      return (conv.participants || []).filter((p) => p.toLowerCase() !== self)
    },

    /**
     * Conversation display title based on counterparts.
     * Single: full name. Multiple: first name + " +N".
     */
    convTitle(conv) {
      const others = this.getCounterparts(conv)
      if (!others.length) return conv.ds_key
      if (others.length === 1) return others[0]
      return `${others[0]} +${others.length - 1}`
    },

    /**
     * Initials of the first counterpart (first letter + last-word first letter).
     */
    convInitials(conv) {
      const others = this.getCounterparts(conv)
      if (!others.length) return '?'
      const name = others[0].trim()
      const parts = name.split(/\s+/)
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase()
    },

    /**
     * Returns the "+N" suffix if there are multiple counterparts, or empty string.
     */
    convCounterparts(conv) {
      const others = this.getCounterparts(conv)
      return others.length > 1 ? `+${others.length - 1}` : ''
    },

    avatarColor(conv) {
      const id = conv.id_msg_chat || 0
      return AVATAR_COLORS[id % AVATAR_COLORS.length]
    },

    formatTime(dt) {
      if (!dt) return ''
      try {
        const d = new Date(dt)
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      } catch {
        return ''
      }
    },

    scrollToBottom() {
      const el = this.$refs.messagesArea
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    },
  },
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 140px);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #fff;
}

/* ── SIDEBAR ─────────────────────────── */
.chat-sidebar {
  width: 340px;
  min-width: 280px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.avatar-counter {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.75;
  vertical-align: super;
  margin-left: 1px;
}

.section-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 4px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  font-size: 13px;
}

/* ── CHAT PANEL ──────────────────────── */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #e5ddd5;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfb6' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.chat-header {
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 16px;
  gap: 4px;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-row {
  display: flex;
  animation: msgSlideIn 0.25s ease-out;
}
@keyframes msgSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.message-row.customer {
  justify-content: flex-start;
}
.message-row.ai_bot {
  justify-content: flex-start;
}
.message-row.operator {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 65%;
  padding: 8px 14px 4px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
}
.message-bubble.customer {
  background: #fff;
  border-top-left-radius: 2px;
}
.message-bubble.ai_bot {
  background: #f0f4f8;
  border-top-left-radius: 2px;
  color: #37474f;
}
.message-bubble.operator {
  background: #dcf8c6;
  border-top-right-radius: 2px;
}

.message-sender {
  font-size: 11.5px;
  font-weight: 700;
  margin-bottom: 2px;
}
.message-bubble.customer .message-sender {
  color: #00796b;
}
.message-bubble.ai_bot .message-sender {
  color: #5c6bc0;
}
.message-bubble.operator .message-sender {
  color: #2e7d32;
}

.message-time {
  font-size: 10.5px;
  text-align: right;
  margin-top: 4px;
}

/* ── INPUT ───────────────────────────── */
.chat-input-area {
  padding: 10px 16px;
}

/* ── EMPTY STATE ─────────────────────── */
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

/* ── RESPONSIVE ──────────────────────── */
@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
  }
  .messages-area {
    padding: 16px;
  }
}
</style>
