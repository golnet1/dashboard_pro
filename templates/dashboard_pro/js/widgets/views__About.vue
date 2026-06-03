<template>
  <div class="about mx-5">
    <h1 class="text-center">
      MBoard
      <v-chip class="ma-2" small color="primary">{{mode}}</v-chip>
    </h1>
    <div class="text-center">
      <v-chip
        v-for="item in itemsLinks"
        :key="item.name"
        class="ma-2"
        color="primary"
        :href="item.href"
        target="_blank"
      >
        <v-avatar left>
          <v-img v-show="item.img" :src="item.img"></v-img>
          <v-icon small v-show="item.icon">{{item.icon}}</v-icon>
        </v-avatar>
        {{item.title}}
      </v-chip>
    </div>
    <v-simple-table dense fixed-header :style="'background:'+nav_color">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left" style="background:rgba(0,0,0,0)"></th>
            <th class="text-center" style="background:rgba(0,0,0,0)">
              <v-chip
                class="ma-2"
                color="primary"
                href="https://connect.smartliving.ru/addons/category6/241.html"
                target="_blank"
              >Free</v-chip>
            </th>
            <th class="text-center" style="background:rgba(0,0,0,0)">
              <v-chip
                class="ma-2"
                color="primary"
                href="https://connect.smartliving.ru/addons/category6/242.html"
                target="_blank"
              >Lite</v-chip>
            </th>
            <th class="text-center" style="background:rgba(0,0,0,0)">
              <v-chip
                class="ma-2"
                color="primary"
                href="https://connect.smartliving.ru/addons/category6/243.html"
                target="_blank"
              >
                <v-avatar left>
                  <v-icon x-small>fas fa-crown</v-icon>
                </v-avatar>Pro
              </v-chip>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itemsLimit" :key="item.name">
            <td>
              <v-avatar tile size="28px" class="mr-2">
                <img v-if="item.img" :src="item.img" />
                <v-icon v-else color="primary">{{item.icon}}</v-icon>
              </v-avatar>
              {{ item.name }}
            </td>
            <td class="text-center">{{ item.free }}</td>
            <td class="text-center">{{ item.lite }}</td>
            <td class="text-center">{{ item.pro }}</td>
          </tr>
          <tr v-for="item in itemsWidgets" :key="item.name">
            <td>
              <v-avatar tile size="28px" class="mr-2">
                <img v-if="item.img" :src="item.img" />
                <v-icon v-else color="primary">{{item.icon}}</v-icon>
              </v-avatar>
              {{ item.name }}
            </td>
            <td class="text-center">
              <v-icon v-if="!item.free" color="red">fas fa-times-circle</v-icon>
              <v-icon v-if="item.free" color="green">fas fa-check-circle</v-icon>
            </td>
            <td class="text-center">
              <v-icon v-if="!item.lite" color="red">fas fa-times-circle</v-icon>
              <v-icon v-if="item.lite" color="green">fas fa-check-circle</v-icon>
            </td>
            <td class="text-center">
              <v-icon v-if="!item.pro" color="red">fas fa-times-circle</v-icon>
              <v-icon v-if="item.pro" color="green">fas fa-check-circle</v-icon>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <div class="text-center">{{$t("about.version")}}: {{version}}</div>
  </div>
</template>
<script>
import Panels from "./panels.js";
import Widgets from "../widgets/widgets.js";
import systemColor from '../components/mixins/system_color';
export default {
  mixins: [systemColor],
  data: () => ({
    mode: process.env.VUE_APP_TYPE,
    itemsLimit: [],
    itemsWidgets: [],
    itemsLinks: [
      {
        icon: "",
        title: "Eraser",
        href: "https://connect.smartliving.ru/profile/186",
        img:
          "https://connect.smartliving.ru/cms/members/186_avatar_1499259863.jpg",
      },
      {
        icon: "fab fa-telegram-plane",
        title: "News",
        href: "https://t.me/joinchat/AAAAAEiKCq9Ib56qVILjsw",
        img: "",
      },
      {
        icon: "fas fa-project-diagram",
        title: "Connect",
        href: "https://connect.smartliving.ru/tasks/700.html",
        img: "",
      },
      {
        icon: "fas fa-comments",
        title: "Forum",
        href: "https://mjdm.ru/forum/viewtopic.php?f=5&t=7217",
        img: "",
      },
    ],
  }),
  created() {
    this.itemsLinks[1].title = this.$t("about.news")
    this.itemsLinks[3].title = this.$t("about.forum")
    this.itemsLimit.push({
      name: this.$t("about.limit_panels"),
      icon: "fas fa-list-ol",
      free: process.env.VUE_APP_LIMIT_PANELS_FREE,
      lite: process.env.VUE_APP_LIMIT_PANELS_LITE,
      pro: process.env.VUE_APP_LIMIT_PANELS_PRO,
    });
    this.itemsLimit.push({
      name: this.$t("about.limit_widgets"),
      icon: "far fa-window-maximize",
      free: process.env.VUE_APP_LIMIT_WIDGETS_FREE,
      lite: process.env.VUE_APP_LIMIT_WIDGETS_LITE,
      pro: process.env.VUE_APP_LIMIT_WIDGETS_PRO,
    });
    this.itemsWidgets.push({
      name: this.$t("about.customization"),
      icon: "fas fa-pen-fancy",
      free: false,
      lite: false,
      pro: true,
    });
    this.itemsWidgets.push({
      name: "API",
      icon: "fas fa-bolt",
      free: false,
      lite: false,
      pro: true,
    });
    var typePanels = Panels.panelsType;
    typePanels.forEach((element) => {
      this.itemsWidgets.push({
        name: this.$t("about.type_panel")+' "' + this.$t("panel_type."+element.name) + '"',
        icon: element.icon,
        free: element.limit.includes("free"),
        lite: element.limit.includes("lite"),
        pro: element.limit.includes("pro"),
      });
    });
    var typeWidgets = Widgets.all_widgets;
    typeWidgets.forEach((element) => {
      if (element.limit!="")
        this.itemsWidgets.push({
          name:
            this.$t("about.widget")+' "' +
            this.$t("widget."+element.type+".name") +
            '" - ' +
            this.$t("widget."+element.type+".info") +
            (element.debug ? " (debug)" : ""),
          img: element.icon,
          free: element.limit.includes("free"),
          lite: element.limit.includes("lite"),
          pro: element.limit.includes("pro"),
        });
    });
  },
  computed: {
    version() {
      const date = new Date(process.env.VUE_APP_GIT_DATE * 1000);
      return (
        process.env.VUE_APP_VERSION +
        " <" +
        process.env.VUE_APP_GIT_HASH +
        "> (" +
        date.toUTCString() +
        ") " +
        process.env.VUE_APP_TYPE
      );
    },
  },
};
</script>
