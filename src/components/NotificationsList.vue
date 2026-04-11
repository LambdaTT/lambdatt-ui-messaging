<template>
  <div class="notifications-list-component">
    <div ref="scrollTargetRef">
      <InfiniteScroll
        v-model="scrollState"
        :DataURL="dataUrl"
        :ExtraFilters="filters"
      >
        <template #default="{ data: notificationRaw }">
          <q-card
            v-if="notificationRaw"
            class="round-sm border-left-5-solid q-pa-md q-mb-md"
            clickable
            @click="openNotification(notificationRaw)"
            :style="`border-color: ${
              notificationRaw.do_important == 'Y' ? '#F2C037' : 'transparent'
            }`"
          >
            <!-- Header -->
            <div class="row flex-center">
              <div
                class="col-auto q-mr-sm"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <q-img
                  :src="getAuthorImg(notificationRaw)"
                  style="border-radius: 50%; height: 30px; width: 30px"
                />
              </div>
              <div class="col-auto text-bold q-pr-sm">
                {{ notificationRaw.author_name || "Desconhecido" }}
              </div>
              <q-badge
                class="col-auto"
                v-if="notificationRaw.do_read == 'N'"
                rounded
                color="red"
                >novo</q-badge
              >
              <div class="col text-caption text-right text-grey-6">
                {{ timeAgo(notificationRaw.dt_created) }}
              </div>
            </div>
            <!-- Conteúdo -->
            <div class="q-pt-sm">
              <div class="row items-center">
                <q-icon
                  v-if="notificationRaw.do_important === 'Y'"
                  size="12px"
                  class="text-warning q-mr-sm"
                  name="fas fa-star"
                  style="padding-bottom: 2px"
                >
                </q-icon>
                <div
                  class="text-bold"
                  style="font-size: 0.9rem; word-break: break-word"
                >
                  {{ notificationRaw.ds_headline }}
                </div>
              </div>
              <div>{{ notificationRaw.ds_brief }}</div>
            </div>
          </q-card>
        </template>
      </InfiniteScroll>
    </div>

    <!-- News Content Modal -->
    <q-dialog @hide="notificationContent = null" v-model="showModal" full-width>
      <q-card
        class="cursor-pointer q-pa-md"
        style="border-radius: 10px"
        v-if="notificationContent"
      >
        <!-- Header -->
        <div class="row flex-center">
          <div
            class="col-auto q-mr-sm"
            style="display: flex; align-items: center; justify-content: center"
          >
            <q-img
              :src="getAuthorImg(notificationContent)"
              style="border-radius: 50%; height: 40px; width: 40px"
            />
          </div>
          <div class="col text-bold">
            {{ notificationContent.author_name || "Desconhecido" }}
          </div>
          <div class="col text-caption text-right text-grey-6">
            {{ timeAgo(notificationContent.dt_created) }}
          </div>
          <!-- <q-btn class="col-auto q-ml-sm" rounded dense icon="close" v-close-popup style="font-size: 0.7rem;" /> -->
        </div>

        <!-- Conteúdo -->
        <div class="q-pt-md q-pb-sm">
          <div class="row items-center q-mb-sm">
            <div class="text-bold" style="font-size: 0.93rem">
              {{ notificationContent.ds_headline }}
            </div>
          </div>
          <!-- <q-separator /> -->
          <div>
            <div
              v-html="notificationContent.tx_content"
              class="text-left"
            ></div>
          </div>
        </div>
        <!-- Actions -->
        <div class="row justify-end">
          <!-- <q-btn flat color="negative" @click="this.remove(notificationContent.ds_key)">Excluir</q-btn> -->
          <q-btn flat color="primary" v-close-popup>Ok</q-btn>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
// Services:
import ENDPOINTS from "../ENDPOINTS";

export default {
  name: "lambdatt-ui-messaging-pages-notifications",

  data() {
    return {
      scrollState: { data: [], is_loading: true },
      dataUrl: ENDPOINTS.NOTIFICATIONS.NOTIFICATION,
      filters: {
        $sort_direction: "DESC",
        $sort_by: "2",
      },
      notificationContent: null,
      showModal: false,
      watching: false,
      watchAbortController: null,
    };
  },

  mounted() {
    this.watching = true;
    this.watchNotifications();
  },

  beforeUnmount() {
    this.watching = false;
    this.watchAbortController?.abort();
  },

  methods: {
    getAuthorImg(notificationRaw) {
      if (notificationRaw.author_avatar) {
        return notificationRaw.author_avatar == "system"
          ? "/resources/img/system-icon.jpg"
          : notificationRaw.author_avatar;
      }
      return "/resources/img/unknown-user.jpg";
    },

    timeAgo(date) {
      if (!date) return "";
      const now = new Date();
      const past = new Date(date.replace(" ", "T"));
      const diffInSeconds = Math.floor((now - past) / 1000);
      const units = [
        { name: "ano", plural: "anos", seconds: 60 * 60 * 24 * 365 },
        { name: "mês", plural: "meses", seconds: 60 * 60 * 24 * 30 },
        { name: "dia", plural: "dias", seconds: 60 * 60 * 24 },
        { name: "hora", plural: "horas", seconds: 60 * 60 },
        { name: "minuto", plural: "minutos", seconds: 60 },
        { name: "segundo", plural: "segundos", seconds: 1 },
      ];

      for (let unit of units) {
        const count = Math.floor(diffInSeconds / unit.seconds);
        if (count > 0) {
          return `${count} ${count > 1 ? unit.plural : unit.name} atrás`;
        }
      }

      return "agora mesmo";
    },

    async openNotification(item) {
      this.notificationContent = item;
      this.showModal = true;
      if (item.do_read == "N") {
        await this.markAsRead(item);
      }
    },

    async markAsRead(item) {
      try {
        await this.$getService("toolcase/http").put(
          `${ENDPOINTS.NOTIFICATIONS.MARK_AS_READ}/${item.ds_key}`,
        );
        item.do_read = "Y";
      } catch (error) {
        this.$getService("toolcase/utils").notifyError(error);
        console.error("Failed to mark as read", error);
      }
    },

    async remove(key) {
      if (!confirm("Deseja excluir as informações?")) {
        return false;
      }

      this.$emit("load", "item-remove");

      try {
        await this.$getService("toolcase/http").delete(
          ENDPOINTS.NOTIFICATIONS.NOTIFICATION + "/" + key,
        );
        this.$getService("toolcase/utils").notify({
          message: "Notificação excluída com sucesso",
          type: "positive",
          position: "top-right",
        });

        if (Array.isArray(this.scrollState.data)) {
          this.scrollState.data = this.scrollState.data.filter(
            (obj) => obj.ds_key !== key,
          );
        }

        this.showModal = false;
      } catch (error) {
        this.$getService("toolcase/utils").notifyError(error);
        console.error("Failed to delete the object.", error);
      } finally {
        this.$emit("loaded", "item-remove");
      }
    },

    async watchNotifications() {
      this.watchAbortController = new AbortController();
      try {
        await this.$getService("toolcase/http").get(
          ENDPOINTS.NOTIFICATIONS.WATCH_COUNT,
          null,
          this.watchAbortController.signal,
        );

        if (typeof this.scrollState.reload === "function") {
          this.scrollState.reload();
        }
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        if (e?.code === "ERR_CANCELED" || e?.name === "AbortError") return;
        console.warn("Notifications watch cycle:", e?.message);
        await new Promise((r) => setTimeout(r, 3000));
      } finally {
        if (this.watching) this.watchNotifications();
      }
    },
  },
};
</script>
