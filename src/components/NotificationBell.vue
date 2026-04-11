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

export default {
  name: "lambdattui-messaging-components-notification-bell",

  data() {
    return {
      notificationsCount: 0,
      unmounted: false,
    };
  },

  async mounted() {
    this.countNotifications();
    this.watchCountNotifications();
  },

  beforeUnmount() {
    this.unmounted = true;
    if (this.watchAbortController) {
      this.watchAbortController.abort();
    }
  },

  methods: {
    async countNotifications() {
      try {
        const { data } = await this.$getService("toolcase/http").get(
          ENDPOINTS.NOTIFICATIONS.COUNT_UNREAD,
        );
        this.notificationsCount = data || 0;
      } catch (e) {
        console.error(e);
      }
    },

    async watchCountNotifications() {
      if (this.unmounted) return;
      this.watchAbortController = new AbortController();
      try {
        await this.$getService("toolcase/http").get(
          ENDPOINTS.NOTIFICATIONS.WATCH_COUNT,
          null,
          this.watchAbortController.signal,
        );

        this.countNotifications();
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        if (
          e?.code === "ERR_CANCELED" ||
          e?.name === "AbortError" ||
          this.unmounted
        ) {
          return;
        }
        console.warn("Notifications watch cycle:", e?.message);
        // Pequena espera na falha antes de relogar para evitar infinite blind fast-loop
        await new Promise((r) => setTimeout(r, 3000));
      } finally {
        if (!this.unmounted) {
          this.watchCountNotifications();
        }
      }
    },
  },
};
</script>
