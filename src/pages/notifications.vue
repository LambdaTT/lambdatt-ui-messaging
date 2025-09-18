<template>
  <Page PageTitle="Minhas Notificações" :Breadcrumb="breadcrumb">
    <div ref="scrollTargetRef">
      <q-infinite-scroll @load="fetchNotifications" :offset="250">
        <div v-if="notifications.length > 0" class="text-grey-8 text-justify q-gutter-y-md">
          <div v-for="(notification, index) in notifications" :key="index">
            <q-card class="round-sm border-left-5-solid q-pa-md" clickable @click="openNotification(notification)"
              :style="`border-color: ${notification.important == 'Y' ? '#F2C037' : 'transparent'}`">
              <!-- Header -->
              <div class="row flex-center">
                <div class="col-auto q-mr-sm" style="display: flex; align-items: center; justify-content: center;">
                  <q-img :src="notification.authorImg" style="border-radius: 50%; height: 30px; width: 30px;" />
                </div>
                <div class="col-auto text-bold q-pr-sm">{{ notification.author }}</div>
                <q-badge class="col-auto" v-if="notification.read == 'N'" rounded color="red">novo</q-badge>
                <div class="col text-caption text-right text-grey-6">{{ notification.date }}</div>
              </div>
              <!-- Conteúdo -->
              <div class="q-pt-sm">
                <div class="row items-center">
                  <q-icon v-if="notification.important === 'Y'" size="12px" class="text-warning q-mr-sm"
                    name="fas fa-star" style="padding-bottom: 2px;">
                  </q-icon>
                  <div class="text-bold" style="font-size: 0.9rem; word-break: break-word;">
                    {{ notification.title }}
                  </div>
                </div>
                <div>{{ notification.brief }}</div>
              </div>
            </q-card>
          </div>
        </div>
        <div v-else>
          <div class="column q-pa-md flex-center text-center">
            <div class="q-mb-sm">
              <q-icon name="fas fa-bell" size="60px" color="grey-6"><q-badge floating
                  color="grey-8">0</q-badge></q-icon>
            </div>
            <div class="text-bold q-mb-sm" style="font-size: 18px;">Nenhuma notificação encontrada!</div>
            <div>Assim que receber sua primeira notificação,<br>ela aparecerá aqui nesta página</div>
          </div>
        </div>
        <template v-if="!stopRequests && notifications.length > 0" v-slot:loading>
          <div class="row text center justify-center">
            <q-spinner-dots color="grey-8" size="4em" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>

    <!-- News Content Modal -->
    <q-dialog @hide="notificationContent = null" v-model="showModal" full-width>
      <q-card class="cursor-pointer q-pa-md" style="border-radius: 10px;">
        <!-- Header -->
        <div class="row flex-center">
          <div class="col-auto q-mr-sm" style="display: flex; align-items: center; justify-content: center;">
            <q-img :src="notificationContent.authorImg" style="border-radius: 50%; height: 40px; width: 40px;" />
          </div>
          <div class="col text-bold">{{ notificationContent.author }}</div>
          <div class="col text-caption text-right text-grey-6">{{ notificationContent.date }}</div>
          <!-- <q-btn class="col-auto q-ml-sm" rounded dense icon="close" v-close-popup style="font-size: 0.7rem;" /> -->
        </div>

        <!-- Conteúdo -->
        <div class="q-pt-md q-pb-sm">
          <div class="row items-center q-mb-sm">
            <div class="text-bold" style="font-size: 0.93rem;"> {{ notificationContent.title }} </div>
          </div>
          <!-- <q-separator /> -->
          <div>
            <div v-html="notificationContent.content" class="text-left"></div>
          </div>
        </div>
        <!-- Actions -->
        <div class="row justify-end">
          <!-- <q-btn flat color="negative" @click="this.remove(notificationContent.ds_key)">Excluir</q-btn> -->
          <q-btn flat color="primary" v-close-popup>Ok</q-btn>
        </div>
      </q-card>
    </q-dialog>
  </Page>
</template>
<script>
// Services:
import ENDPOINTS from '../ENDPOINTS'

export default {
  name: 'lambdatt-ui-messaging-pages-notifications',

  data() {
    return {
      firstLoad: true,
      notifications: [],          // Notificações na Tela
      notificationContent: null,  // Conteúdo do Modal
      showModal: false,
      stopRequests: false,

      // Services:
      $http: this.$getService('toolcase/http'),
      $utils: this.$getService('toolcase/utils'),
    }
  },

  computed: {
    breadcrumb() {
      return [
        { label: 'Home', icon: "fas fa-home", to: "/" },
        { label: 'Notificações', icon: "fas fa-bell" },
      ]
    },
  },

  methods: {
    timeAgo(date) {
      const now = new Date();
      const past = new Date(date.replace(" ", "T"));
      const diffInSeconds = Math.floor((now - past) / 1000);
      const units = [
        { name: "ano", plural: "anos", seconds: 60 * 60 * 24 * 365 },
        { name: "mês", plural: "meses", seconds: 60 * 60 * 24 * 30 },
        { name: "dia", plural: "dias", seconds: 60 * 60 * 24 },
        { name: "hora", plural: "horas", seconds: 60 * 60 },
        { name: "minuto", plural: "minutos", seconds: 60 },
        { name: "segundo", plural: "segundos", seconds: 1 }
      ];

      for (let unit of units) {
        const count = Math.floor(diffInSeconds / unit.seconds);
        if (count > 0) {
          return `${count} ${count > 1 ? unit.plural : unit.name} atrás`;
        }
      }

      return "agora mesmo";
    },

    async getNotifications(params) {
      // API request
      try {
        const response = await this.$http.get(ENDPOINTS.NOTIFICATIONS.NOTIFICATION, params);
        if (response && response.data) {
          return response.data.map((notify) => ({
            date: this.timeAgo(notify.dt_created),
            author: notify.author_name || "Desconhecido",
            authorImg: notify.author_avatar ? (notify.author_avatar == 'system' ? '/resources/img/system-icon.jpg' : notify.author_avatar) : '/resources/img/unknown-user.jpg',
            title: notify.ds_headline,
            brief: notify.ds_brief,
            content: notify.tx_content,
            read: notify.do_read,
            important: notify.do_important,
            ds_key: notify.ds_key
          }));
        }
      } catch (error) {
        if (error.response?.status == 401) {
          this.$router.push('/login?goTo=/notifications');
        } else {
          this.$utils.notifyError(error);
        }
        console.error("An error occurred while attempting to retrieve the object's data.", error);
      }
    },

    async openNotification(item) {
      this.notificationContent = item;
      this.showModal = true;
      if (item.read == 'N') { await this.markAsRead(item); }
    },

    async markAsRead(item) {
      try {
        // API request
        await this.$http.put(`${ENDPOINTS.NOTIFICATIONS.NOTIFICATION}/mark-as-read/${item.ds_key}`);
        item.read = 'Y';
      } catch (error) {
        this.$utils.notifyError(error);
        console.error("An error occurred while attempting to update the object's data.", error);
      }
    },

    async fetchNotifications(index, done) {
      if (this.stopRequests) { return }

      this.firstLoad = false;

      const payload = {
        $limit: 15,
        $page: index,
        $sort_direction: 'DESC',
        $sort_by: '2',
        $limit_multiplier: 1,
      }

      const notificationBatch = await this.getNotifications(payload);

      if (notificationBatch.length === 0) { this.stopRequests = true; return }
      this.notifications = [...this.notifications, ...notificationBatch];
      done();
    },

    async remove(key) {
      // Confimation
      if (!confirm('Deseja excluir as informações?')) { return false; }

      // Emitting the loading event
      this.$emit('load', 'item-remove');

      // API request
      try {
        await this.$http.delete(ENDPOINTS.NOTIFICATIONS.NOTIFICATION + '/' + key);
        this.$utils.notify({
          message: 'Notificação excluída com sucesso',
          type: 'positive',
          position: 'top-right'
        });
        this.notifications = this.notifications.filter(obj => obj.ds_key !== key);
        this.showModal = false;
      } catch (error) {
        this.$utils.notifyError(error);
        console.error("An error occurred while attempting to delete the object.", error);
      } finally {
        // Finalizing the loading event
        this.$emit('loaded', 'item-remove');
      };
    },
  },
}
</script>