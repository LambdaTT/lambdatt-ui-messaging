<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card>
      <q-card-section>
        <slot></slot>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Fechar" color="grey-8" v-close-popup />
        <q-btn flat label="Habilitar" color="primary" @click="enable()" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'component-PushNotification',

  data() {
    return {
      showDialog: false
    };
  },

  methods: {
    async enable() {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        if (!localStorage.getItem('FCMPushToken')) {
          await this.createToken();
        } else {
          await this.tokenRecycle();
        }
      }

      return;
    },

    async createToken() {
      // Handle device key
      const deviceKey = await this.$getService('iam/device').getDeviceKey();

      try {
        const token = await this.$getService('messaging/firebase').getToken();
        await this.$http
          .setHeader('Iam-Device-Key', deviceKey)
          .post('/api/messaging/v1/push/subscription', { token: token });

        localStorage.setItem('FCMPushToken', token);
      } catch (error) {
        console.error('Error creating push subscription.', error);
      }

      return;
    },

    async tokenRecycle() {
      const currentToken = localStorage.getItem('FCMPushToken');
      const validToken = await this.$getService('messaging/firebase').getToken();
      if (!!currentToken && currentToken !== validToken) {
        try {
          await this.$http.put(`/api/messaging/v1/push/subscription/${currentToken}`, { newToken: validToken });
          localStorage.setItem('FCMPushToken', validToken);
        } catch (error) {
          console.error('Error recycling push subscription.', error);
        }
      }

      return;
    },

    init() {
      // Check if the browser supports notifications and service workers
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

      // Check if the user already denied exlplicitly the notification permission:
      if (Notification.permission === "denied") return;

      this.showDialog = (Notification.permission !== "granted");
    },
  },

  mounted() {
    this.init();
  }
}
</script>