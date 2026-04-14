<template>
  <q-btn
    class="q-ma-sm"
    flat
    round
    icon="fas fa-bell"
    size="sm"
    @click="$router.push('/messaging/notifications')"
  >
    <q-tooltip v-if="notificationsCount == 0"
      >Não há novas notificações.</q-tooltip
    >
    <q-tooltip v-if="notificationsCount > 0"
      >{{ notificationsCount }} nova(s) notificação(ões)</q-tooltip
    >
    <q-badge
      :rounded="true"
      v-if="notificationsCount > 0"
      color="red"
      floating
      >{{ notificationsCount }}</q-badge
    >
  </q-btn>
</template>

<script>
import ENDPOINTS from "../ENDPOINTS";
import { getConfigs } from "src/configs";

export default {
  name: "lambdattui-messaging-components-notification-bell",

  data() {
    return {
      notificationsCount: 0,
    };
  },

  mounted() {
    // Load the initial count immediately.
    this.countNotifications(true);

    // Subscribe to the shared SSE stream (opens the connection if not yet open).
    this._onChanged = () => this.countNotifications(false);

    this.$getService("toolcase/eventbroadcaster").$on(
      "notifications:changed",
      this._onChanged,
    );

    this.$getService("messaging/notification-stream").subscribe();
  },

  beforeUnmount() {
    // Clean up the listener and release our share of the SSE connection.
    // When the last consumer unsubscribes, the connection is closed automatically.
    this.$getService("toolcase/eventbroadcaster").$off(
      "notifications:changed",
      this._onChanged,
    );
    this.$getService("messaging/notification-stream").unsubscribe();
  },

  methods: {
    async countNotifications(isInitialLoad = false) {
      try {
        const { data } = await this.$getService("toolcase/http").get(
          ENDPOINTS.NOTIFICATIONS.COUNT_UNREAD,
        );

        const count = parseInt(data, 10) || 0;

        if (!isInitialLoad && count > this.notificationsCount) {
          const soundPath = getConfigs("notifications")?.sound;
          if (soundPath) {
            const audio = new Audio(soundPath);
            audio
              .play()
              .catch((e) =>
                console.warn("Failed to play notification sound", e),
              );
          }
        }

        this.notificationsCount = count;
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
