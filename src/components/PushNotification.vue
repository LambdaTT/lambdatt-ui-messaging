<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card>
      <q-card-section>
        <slot></slot>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Fechar" color="grey-8" v-close-popup />
        <q-btn
          flat
          label="Habilitar"
          color="primary"
          @click="enable()"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import ENDPOINTS from "../ENDPOINTS";

export default {
  name: "component-PushNotification",

  data() {
    return {
      showDialog: false,
    };
  },

  methods: {
    async enable() {
      console.log("enable() clicked");
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("push permission granted");
        if (!localStorage.getItem("FCMPushToken")) {
          await this.createToken();
        } else {
          await this.tokenRecycle();
        }
      }

      return;
    },

    async createToken() {
      console.log("createToken() triggered");
      // Handle device key
      const deviceKey = await this.$getService("iam/device").getDeviceKey();

      console.log("Device Key:", deviceKey);

      try {
        const token = await this.$getService("messaging/firebase").getToken();
        console.log("FCM Token", token);
        await this.$getService("toolcase/http")
          .setHeader("Iam-Device-Key", deviceKey)
          .post(ENDPOINTS.PUSH.SUBSCRIPTION, { tx_token: token });
        console.log("Subscription endpoint must be requested at this point");

        localStorage.setItem("FCMPushToken", token);
      } catch (error) {
        console.error("Error creating push subscription.", error);
      }

      return;
    },

    async tokenRecycle() {
      const currentToken = localStorage.getItem("FCMPushToken");
      const validToken = await this.$getService(
        "messaging/firebase",
      ).getToken();
      if (!!currentToken && currentToken !== validToken) {
        try {
          await this.$getService("toolcase/http").put(
            `${ENDPOINTS.PUSH.SUBSCRIPTION}/${currentToken}/${validToken}`,
          );
          localStorage.setItem("FCMPushToken", validToken);
        } catch (error) {
          console.error("Error recycling push subscription.", error);
        }
      }

      return;
    },

    init() {
      // Check if the browser supports notifications and service workers
      if (!("Notification" in window) || !("serviceWorker" in navigator))
        return;

      // Check if the user already denied exlplicitly the notification permission:
      if (Notification.permission === "denied") return;

      this.showDialog = Notification.permission !== "granted";
    },
  },

  mounted() {
    this.init();
  },
};
</script>
