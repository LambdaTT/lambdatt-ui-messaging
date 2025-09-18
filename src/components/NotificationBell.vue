<template>
  <!-- Notification Bell -->
  <q-btn class="menu" flat round icon="fas fa-bell" size="md" @click="$router.push('/messaging/notifications')">
    <q-badge v-if="notificationCount > 0" color="red" floating>{{ notificationCount }}</q-badge>
  </q-btn>
</template>

<script>
export default {
  name: 'lambdattui-messaging-components-notification-bell',

  data() {
    return {
      notificationCount: 0,
    }
  },

  methods: {
    async countNotifications() {
      const response = await this.$getService('http').get('/messaging/v1/notification/count-unread');
      this.notificationCount = response.data;

      this.notificationCount();
    }
  },

  mounted() {
    this.countNotifications();
  }
}
</script>