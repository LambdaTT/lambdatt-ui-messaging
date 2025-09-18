<template>
  <q-dialog v-model="showNotificationsBanner">
    <q-card flat class="floating-card q-pa-sm">
      <div class="row q-pa-sm">
        <div class="col-auto">
          <q-icon name="far fa-bell" color="primary" size="sm"></q-icon>
        </div>
        <span class="col q-ml-md text-left">Você gostaria de ativar as notificações?</span>
      </div>
      <div class="row justify-end">
        <q-btn flat label="Sim" color="primary" @click="() => enableNotifications()"></q-btn>
        <q-btn flat label="Depois" color="primary" @click="showNotificationsBanner = false"></q-btn>
        <q-btn flat label="Nunca" color="primary" @click="neverShowNotificationsBanner()"></q-btn>
      </div>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  name: 'ui-layoutapp2-pushnotifications',

  data() {
    return {
      showNotificationsBanner: null,
    }
  },

  computed: {
    showBanner() {
      // Check if the browser supports notifications and service workers
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;

      // and if the user has not previously dismissed the banner
      if (!!localStorage.getItem('neverShowNotificationsBanner')) return false

      // and if the user has not already granted or denied permission
      if (Notification.permission === "granted" || Notification.permission === "denied") return false

      return true
    },
  },

  methods: {
    neverShowNotificationsBanner() {
      localStorage.setItem('neverShowNotificationsBanner', true);
      this.showNotificationsBanner = false;
    },

    async enableNotifications() {
      try {
        this.showNotificationsBanner = false;
        const token = await this.$getService('firebase').getToken();

        // Cada navegador gera um token, então um usuário pode ter vários tokens!
        await this.$http.post('/api/messaging/v1/push/subscription', { token: token });

        localStorage.setItem('FCMPushToken', token);
      } catch (error) {
        console.error('Error requesting notification permission.', error);
      }
    },

    async tokenRecycle() {
      const currentToken = localStorage.getItem('FCMPushToken');
      const validToken = await this.$getService('firebase').getToken();
      if (!!currentToken && currentToken !== validToken) {
        await this.$http.put(`/api/messaging/v1/push/subscription/${currentToken}`, { newToken: validToken });
        localStorage.setItem('FCMPushToken', validToken);
      }
    }
  },

  async mounted() {
    this.showNotificationsBanner = this.showBanner && await this.$getService('iam/auth').authenticate();
    this.tokenRecycle();
  },
}
</script>