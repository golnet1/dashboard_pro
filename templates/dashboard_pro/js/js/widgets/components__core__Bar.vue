<template>
  <v-app-bar
    app
    color="primary"
    dark
    elevation="0"
    :src="
      currentPanel && this.$store.state.useBackgroundBar
        ? currentPanel.image
        : ''
    "
  >
    <!--v-app-bar-nav-icon @click.stop="sidebarMenu = !sidebarMenu"></v-app-bar-nav-icon-->
    <template v-for="(item,index) in itemsBar">
    <v-tooltip v-if="item.type=='navigator'" bottom :key="'bar_'+index">
      <template v-slot:activator="{ on, attrs }">
        <v-app-bar-nav-icon  @click.stop="toggleMenu" v-bind="attrs" v-on="on"></v-app-bar-nav-icon>
      </template>
      {{$t("bar.toggle_mini")}}
    </v-tooltip>
    <v-toolbar-title v-else-if="item.type=='title' && currentPanel" :key="'bar_'+index">
      {{
      currentPanel.title
      }}
    </v-toolbar-title>
    <v-toolbar-title v-else-if="item.type=='time'" :key="'bar_'+index" class="mx-2" style="min-width: 50px;">
      {{
      time
      }}
    </v-toolbar-title>
    <div class="v-toolbar__title mx-2" v-else-if="item.type=='textvalue'" :key="'bar_'+index" :style="item.min_width ? 'min-width: '+item.min_width+'px;' : 'flex-grow: 1 !important;'">
      <v-card-title v-if="item.marquee && item.object_info.length > item.marquee_length" class="v-toolbar__title text-truncate pa-0 ma-0 pt-n3">
        <icon-view v-if="item.icon" :value="item.icon" :size="40" class="mr-0"/>
        <div :style="'height:30px;min-width: '+(item.min_width-50)+'px;'">
        <dynamic-marquee direction="row" reverse repeat :repeatMargin="300">
          <textValue :value="item.object_info" :preValue="item.pre_info" :posValue="item.pos_info" />
        </dynamic-marquee>
        </div>
      </v-card-title>
      <v-card-title v-else class="v-toolbar__title text-truncate pa-0 ma-0 pt-n3">
        <icon-view v-if="item.icon" :value="item.icon" :size="40" class="mr-1"/>
        <textValue :value="item.object_info" :preValue="item.pre_info" :posValue="item.pos_info"/>
      </v-card-title>
    </div>
    <v-spacer v-else-if="item.type=='spacer'" :key="'bar_'+index"></v-spacer>
    <v-divider v-else-if="item.type=='divider'" :key="'bar_'+index" vertical></v-divider>
    <v-menu  v-else-if="item.type=='events'" :key="'bar_'+index" bottom left offset-y origin="top right" transition="scale-transition">
      <template v-slot:activator="{ attrs, on }">
        <v-btn icon large v-bind="attrs" v-on="on">
          <v-badge :content="events.length" :value="events.length" color="red" overlap>
            <v-icon small :class="events.length>0?'bell':''">fas fa-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card min-width="200">
        <v-list-item v-if="events.length > 0" @click="readAll()">
          <v-list-item-content>
            <v-list-item-title class="d-flex justify-center">
              {{$t("events.read_all")}}
              <v-icon x-small class="ml-2">fas fa-flag</v-icon>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list dense v-if="events.length != 0" style="max-height: 400px" class="overflow-y-auto">
          <v-list-item v-for="(event, index) in events" :key="index" @click="onClick(event)">
            <v-list-item-avatar>
              <v-icon dark :color="getColor(event.VALUE.level)">{{getIcon(event.VALUE.level)}}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-text="event.VALUE.message" />
              <v-list-item-subtitle v-text="event.NAME" />
            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-action-text v-text="getTime(event.dt)"></v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <v-list-item v-if="events.length == 0">{{$t("events.empty")}}</v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="openEvents()">
          <v-list-item-content>
            <v-list-item-title class="d-flex justify-center">{{$t("events.show_all")}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-card>
    </v-menu>
    <v-tooltip v-else-if="item.type=='updater'" :key="'bar_'+index" bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn icon v-on:click="updateData" v-bind="attrs" v-on="on">
          <v-icon small v-show="ws_state.isConnected">fas fa-satellite-dish</v-icon>
          <v-icon small v-show="!ws_state.isConnected">fas fa-sync</v-icon>
        </v-btn>
      </template>
      <span v-show="ws_state.isConnected">
        {{$t("bar.ws_update")}}
        <br />
        <i class="fas fa-upload" style="color:orange"></i>
        {{$t("bar.send")}}: {{ ws_state.sendBytes | prettyBytes }}
        <br />
        <i class="fas fa-download" style="color:lime"></i>
        {{$t("bar.recv")}}: {{ ws_state.recvBytes | prettyBytes }}
        <br />
      </span>
      <span v-show="!ws_state.isConnected">{{$t("bar.time_update")}}</span>
    </v-tooltip>
    <v-tooltip bottom v-else-if="item.type=='theme'" :key="'bar_'+index">
      <template v-slot:activator="{ on, attrs }">
        <v-btn icon v-on:click="toggleTheme" v-bind="attrs" v-on="on">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
      </template>
      {{$t("bar.toggle_theme")}}
    </v-tooltip>
    <v-tooltip bottom v-else-if="item.type=='edit' && profile.IS_ADMIN == '1'" :key="'bar_'+index">
      <template v-slot:activator="{ on, attrs }">
        <v-btn icon @click.stop="saveSettings()" v-bind="attrs" v-on="on">
          <div v-if="currentPanel">
            <v-icon v-if="!editEnable && currentPanel.route!='settings'">fas fa-edit</v-icon>
            <v-icon v-if="editEnable || currentPanel.route=='settings'">fas fa-save</v-icon>
          </div>
          <v-icon v-else>fas fa-edit</v-icon>
        </v-btn>
      </template>
      <div v-if="currentPanel">
        <span v-show="editEnable || currentPanel.route=='settings'">{{$t("save")}}</span>
        <span v-show="!editEnable && currentPanel.route!='settings'">{{$t("edit")}}</span>
      </div>
      <span v-else>{{$t("edit")}}</span>
    </v-tooltip>
    <v-menu bottom v-else-if="item.type=='menu'" :key="'bar_'+index" left offset-y :nudge-bottom="10">
      <template v-slot:activator="{ on, attrs }">
        <v-btn icon large v-bind="attrs" v-on="on">
          <v-avatar size="42px">
            <img v-if="profile.AVATAR" :src="'/cms/avatars/' + profile.AVATAR" />
            <v-icon v-if="!profile.AVATAR">fas fa-user</v-icon>
          </v-avatar>
        </v-btn>
      </template>
      <v-list>
        <v-list-item two-line>
          <v-list-item-avatar>
            <img v-if="profile.AVATAR" :src="'/cms/avatars/' + profile.AVATAR" />
            <v-icon v-if="!profile.AVATAR">fas fa-user</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ profile.NAME }}</v-list-item-title>
            <v-list-item-subtitle v-if="profile.IS_ADMIN=='1'">{{$t('bar.admin')}}</v-list-item-subtitle>
            <v-list-item-subtitle v-if="profile.IS_ADMIN!='1'">{{$t('bar.user')}}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item to="/events">
          <v-list-item-icon>
            <v-icon>fas fa-bell</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.events')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="profile.IS_ADMIN == '1'" to="/settings">
          <v-list-item-icon>
            <v-icon>fas fa-wrench</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.settings')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="profile.IS_ADMIN == '1'" to="/settingsbar">
          <v-list-item-icon>
            <v-icon>fas fa-wrench</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.settingsbar')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="debug && profile.IS_ADMIN == '1'" to="/system">
          <v-list-item-icon>
            <v-icon>fa fa-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.system')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="openConsole()">
          <v-list-item-icon class="mr-6">
            <v-icon>fas fa-terminal</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('console')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="profile.IS_ADMIN == '1'" to="/wizard">
          <v-list-item-icon>
            <v-icon>fas fa-magic</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.wizard')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/about">
          <v-list-item-icon>
            <v-icon>fas fa-info-circle</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('views.about')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="logout()">
          <v-list-item-icon>
            <v-icon>fas fa-sign-out-alt</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$t('bar.logout')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-tooltip bottom v-else-if="item.type=='panel'" :key="'bar_'+index">
      <template v-slot:activator="{ on, attrs }">
        <v-btn icon :to="'/'+getPanel(item.panel).type+'/'+getPanel(item.panel).name" v-bind="attrs" v-on="on">
          <v-avatar size="40">
            <v-img v-show="getPanel(item.panel).image && !getPanel(item.panel).icon" :src="getPanel(item.panel).image"></v-img>
            <v-icon v-show="getPanel(item.panel).icon">{{ getPanel(item.panel).icon }}</v-icon>
          </v-avatar>
        </v-btn>
      </template>
      {{ getPanel(item.panel).title }}
    </v-tooltip>
    </template>
  </v-app-bar>
</template>

<script>
import { AUTH_LOGOUT } from "../../store/modules/auth";
import TextValue from "../TextValue.vue"
import DynamicMarquee from 'vue-dynamic-marquee';
require("../vue.pretty-bytes.filter");

export default {
  name: "Bar",
  components:{
    TextValue,
    DynamicMarquee,
  },
  data: () => ({
    time:"",
  }),
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    profile() {
      return this.$store.getters.getProfile;
    },
    debug() {
      return this.$store.state.debug;
    },
    editEnable: {
      get() {
        return this.$store.state.editEnable; // || this.$vuetify.breakpoint.mdAndDown;
      },
      set(value) {
        this.$store.commit("updateEditEnable", value);
        if (!value) {
          this.$store.dispatch("saveSettings");
        }
      },
    },
    itemsBar(){
      var items = this.$store.state.itemsBar
      if (items == undefined || items.length == 0)
      {
        // default bar
        items = []
        items.push({type:"navigator"})
        items.push({type:"title"})
        items.push({type:"spacer"})
        items.push({type:"events"})
        items.push({type:"updater"})
        items.push({type:"theme"})
        items.push({type:"edit"})
        items.push({type:"menu"})
      }
      return items
    },
    currentPanel() {
      console.log("current page",this.$route)
      if (!this.$route) return  {title:"",route:""}
      if (this.$store.state.debug) console.log("current page",this.$route);
      var name = this.$route.params.panel;
      if (this.$route.name == "Panel") name = this.$route.params.panel;
      else if (this.$route.name == "Flex") name = this.$route.params.panel;
      else if (this.$route.name == "Waterfall") name = this.$route.params.panel;
      else if (this.$route.name == "Dnd") name = this.$route.params.panel;
      else if (this.$route.name == "Page") name = this.$route.params.page;
      else if (this.$route.name == "Group") name = this.$route.params.group;
      else return { title: this.$t("views." + this.$route.name.toLowerCase()), route: this.$route.name.toLowerCase() };
      var panel = this.$store.getters.getPanelByName(name);
     // panel["route"] = this.$route.path
      return panel;
    },
    ws_state() {
      return this.$store.getters.socketState;
    },
    events() {
      return this.$store.getters.getNewEvents;
    },
    hideMenu() {
      return this.$store.state.hideMenu
    },
    textValue()
    {
      return salut => `${salut} value`
    }
  },
  methods: {
    openConsole: function(){
      this.$store.state.console = true
    },
    logout: function () {
      this.$store.dispatch(AUTH_LOGOUT); //.then(() => this.$router.push("/"));
    },
    saveSettings: function () {
      if (this.currentPanel.route=='settings')
        this.$store.dispatch("saveSettings");
      else
        this.editEnable = !this.editEnable
    },
    toggleTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    toggleMenu() {
      if (this.$vuetify.breakpoint.mdAndUp && !this.hideMenu)
        this.$store.state.mini = !this.$store.state.mini;
      else
        this.$store.commit("updateSidebarMenu", true)
    },
    updateData() {
      this.$store.dispatch("viewNotify", {text:this.$t("bar.data_refresh"), icon:"fas fa-sync" , color:"primary"});
      this.$store.dispatch("requestAllData");
    },
    onClick(event) {
      this.$store.commit("readEvent", event);
    },
    getTime(dt) {
      return (
        (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) +
        ":" +
        (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes())
      );
    },
    openEvents() {
      this.$router.push({ path: "/events" }).catch(() => {});
    },
    readAll() {
      this.$store.commit("readAllEvent");
    },
    getColor(level) {
      return this.$store.getters.getLevel(level).color;
    },
    getIcon(level) {
      return this.$store.getters.getLevel(level).icon;
    },
    updateCurrentTime() {
      const today = new Date();
      this.time =
        (today.getHours() < 10 ? "0" : "") +
        today.getHours() +
        ":" +
        (today.getMinutes() < 10 ? "0" : "") +
        today.getMinutes()
    },
    getPanel(name)
    {
      return this.$store.getters.getPanelByName(name)
    },
    getText(object_value)
    {
      if (object_value == undefined) return "..."
      if (!object_value) return "..."
      if (!object_value.includes(".")) return "..."
      var data = this.$store.getters.getData(object_value)
      console.log(data)
      if (data.value == undefined)
        this.$store.dispatch("requestData", object_value);
      return this.$store.getters.getData(object_value).value
    },
  },
  mounted() {
    setInterval(() => this.updateCurrentTime(), 1 * 1000);
    this.updateCurrentTime();
  },
};
</script>

<style scoped>
.bell {
  display: block;
  -webkit-animation: ring 4s 0.7s ease-in-out infinite;
  -webkit-transform-origin: 50% 4px;
  -moz-animation: ring 4s 0.7s ease-in-out infinite;
  -moz-transform-origin: 50% 4px;
  animation: ring 4s 0.7s ease-in-out infinite;
  margin-top: 10px;
}

@-webkit-keyframes ring {
  0% {
    -webkit-transform: rotateZ(0);
  }
  1% {
    -webkit-transform: rotateZ(30deg);
  }
  3% {
    -webkit-transform: rotateZ(-28deg);
  }
  5% {
    -webkit-transform: rotateZ(34deg);
  }
  7% {
    -webkit-transform: rotateZ(-32deg);
  }
  9% {
    -webkit-transform: rotateZ(30deg);
  }
  11% {
    -webkit-transform: rotateZ(-28deg);
  }
  13% {
    -webkit-transform: rotateZ(26deg);
  }
  15% {
    -webkit-transform: rotateZ(-24deg);
  }
  17% {
    -webkit-transform: rotateZ(22deg);
  }
  19% {
    -webkit-transform: rotateZ(-20deg);
  }
  21% {
    -webkit-transform: rotateZ(18deg);
  }
  23% {
    -webkit-transform: rotateZ(-16deg);
  }
  25% {
    -webkit-transform: rotateZ(14deg);
  }
  27% {
    -webkit-transform: rotateZ(-12deg);
  }
  29% {
    -webkit-transform: rotateZ(10deg);
  }
  31% {
    -webkit-transform: rotateZ(-8deg);
  }
  33% {
    -webkit-transform: rotateZ(6deg);
  }
  35% {
    -webkit-transform: rotateZ(-4deg);
  }
  37% {
    -webkit-transform: rotateZ(2deg);
  }
  39% {
    -webkit-transform: rotateZ(-1deg);
  }
  41% {
    -webkit-transform: rotateZ(1deg);
  }

  43% {
    -webkit-transform: rotateZ(0);
  }
  100% {
    -webkit-transform: rotateZ(0);
  }
}

@-moz-keyframes ring {
  0% {
    -moz-transform: rotate(0);
  }
  1% {
    -moz-transform: rotate(30deg);
  }
  3% {
    -moz-transform: rotate(-28deg);
  }
  5% {
    -moz-transform: rotate(34deg);
  }
  7% {
    -moz-transform: rotate(-32deg);
  }
  9% {
    -moz-transform: rotate(30deg);
  }
  11% {
    -moz-transform: rotate(-28deg);
  }
  13% {
    -moz-transform: rotate(26deg);
  }
  15% {
    -moz-transform: rotate(-24deg);
  }
  17% {
    -moz-transform: rotate(22deg);
  }
  19% {
    -moz-transform: rotate(-20deg);
  }
  21% {
    -moz-transform: rotate(18deg);
  }
  23% {
    -moz-transform: rotate(-16deg);
  }
  25% {
    -moz-transform: rotate(14deg);
  }
  27% {
    -moz-transform: rotate(-12deg);
  }
  29% {
    -moz-transform: rotate(10deg);
  }
  31% {
    -moz-transform: rotate(-8deg);
  }
  33% {
    -moz-transform: rotate(6deg);
  }
  35% {
    -moz-transform: rotate(-4deg);
  }
  37% {
    -moz-transform: rotate(2deg);
  }
  39% {
    -moz-transform: rotate(-1deg);
  }
  41% {
    -moz-transform: rotate(1deg);
  }

  43% {
    -moz-transform: rotate(0);
  }
  100% {
    -moz-transform: rotate(0);
  }
}

@keyframes ring {
  0% {
    transform: rotate(0);
  }
  1% {
    transform: rotate(30deg);
  }
  3% {
    transform: rotate(-28deg);
  }
  5% {
    transform: rotate(34deg);
  }
  7% {
    transform: rotate(-32deg);
  }
  9% {
    transform: rotate(30deg);
  }
  11% {
    transform: rotate(-28deg);
  }
  13% {
    transform: rotate(26deg);
  }
  15% {
    transform: rotate(-24deg);
  }
  17% {
    transform: rotate(22deg);
  }
  19% {
    transform: rotate(-20deg);
  }
  21% {
    transform: rotate(18deg);
  }
  23% {
    transform: rotate(-16deg);
  }
  25% {
    transform: rotate(14deg);
  }
  27% {
    transform: rotate(-12deg);
  }
  29% {
    transform: rotate(10deg);
  }
  31% {
    transform: rotate(-8deg);
  }
  33% {
    transform: rotate(6deg);
  }
  35% {
    transform: rotate(-4deg);
  }
  37% {
    transform: rotate(2deg);
  }
  39% {
    transform: rotate(-1deg);
  }
  41% {
    transform: rotate(1deg);
  }

  43% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(0);
  }
}
</style>