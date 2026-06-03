<template>
  <v-app :style="cssProps">
    <!--particles-bg color="black" type="cobweb" :bg="true" /-->
    <Bar v-if="isAuthenticated" />
    <Navigator v-if="isAuthenticated" />
    <v-main class="mb-6">
        <v-container v-if="isAuthenticated" class="px-2 py-0 fill-height" fluid>
          <v-row class="fill-height">
            <v-col>
                <router-view></router-view>
            </v-col>
          </v-row>
        </v-container>
    </v-main>
    <Chat v-if="isAuthenticated"/>
    <v-snackbar v-model="snackbar" :timeout="timeout">
     <v-icon v-if="messageSnackbar.icon" :color="messageSnackbar.color">
        {{messageSnackbar.icon}}
      </v-icon>
      {{ messageSnackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn color="primary" text v-bind="attrs" @click="snackbar = false">{{$t('close')}}</v-btn>
      </template>
    </v-snackbar>
    <v-dialog v-model="dialog" persistent scrollable max-width="600px">
    <v-card :color="messageDialog.color ? messageDialog.color : dialog_color">
      <v-card-title>
        <v-icon class="mr-2" v-if="messageDialog.icon" :color="messageDialog.coloricon">
        {{messageDialog.icon}}
        </v-icon>
        <span class="headline">{{messageDialog.title}}</span>
      </v-card-title>
      <v-card-text>
        <div class="my-3" height="100%" v-if="messageDialog.text" v-html="formatedText" />
      </v-card-text>
      <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn v-for="(item, name, index) in messageDialog.buttons" :key="index"
            color="primary"
            text
            @click="pressButtonDialog(name)"
          >
            {{name}}
          </v-btn>
          <v-btn
            v-if="messageDialog.type == 'info'"
            color="primary"
            text
            @click="closeDialog()"
          >
            {{$t('close')}}
          </v-btn>
        </v-card-actions>
    </v-card>
  </v-dialog>
    <v-overlay :value="loading" z-index="10">
      <v-progress-circular indeterminate size="120">Loading...</v-progress-circular>
    </v-overlay>
    <v-overlay light :value="!isAuthenticated && !loading" z-index="10">
      <LoginInput />
    </v-overlay>
    <Console />
  </v-app>
</template>

<script>
//import { ParticlesBg } from "particles-bg-vue";
import axios from 'axios';
import Bar from "./components/core/Bar.vue";
import Navigator from "./components/core/Navigator.vue";
import LoginInput from "./views/Login";
import Chat from "./components/core/Chat.vue";
import Console from "./components/core/Console.vue"
import { AUTH_SUCCESS } from "./store/modules/auth";
import { AUTH_REQUEST } from "./store/modules/auth";
import { USER_REQUEST } from "./store/modules/user";
import system_color from "./components/mixins/system_color";
export default {
  name: "App",
  metaInfo: {
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1,user-scalable=no' }
    ],
  },
  mixins:[system_color],
  components: {
    Bar,
    Navigator,
    LoginInput,
    Chat,
    Console,
    //ParticlesBg,
  },
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    loading() {
      return this.$store.state.loading;
    },
    currentPanel() {
      if (this.$store.state.debug) console.log(this.$route.params.panel);
      var name = this.$route.params.panel;
      if (this.$route.name == "Page") name = this.$route.params.page;
      if (this.$route.name == "Group") name = this.$route.params.group;
      var panel = this.$store.getters.getPanelByName(name);
      return panel;
    },
    backgroungImage() {
      if (this.$store.state.useBackgroundPanel) {
        if (this.currentPanel) {
          if (this.currentPanel.image) return this.currentPanel.image;
        }
      }
      return this.$store.state.backgroundPanel;
    },
    snackbar: {
      get() {
        return this.$store.state.snackbar;
      },
      set(value) {
        this.$store.state.snackbar = value;
      },
    },
    messageSnackbar: {
      get() {
        return this.$store.state.messageSnackbar;
      },
      set(value) {
        this.$store.state.messageSnackbar = value;
      },
    },
    dialog: {
      get() {
        return this.$store.getters.getDialogsCount > 0
      },
      set()
      {
      }
    },
    messageDialog: {
      get() {
        return this.$store.getters.getDialogFirst
      }
    },
    formatedText() {
      if (this.messageDialog.text)
        return this.messageDialog.text.replace(/\n/g, "<br />");
      return ""
    },
    timeout() {
      return this.$store.state.timeoutSnackbar;
    },
    timeoutUpdate() {
      return this.$store.state.timeoutUpdate;
    },
    themeDark() {
      return this.$vuetify.theme.dark;
    },
    cssProps() {
      return {
        "--scroll-track-color": this.scrollTrackColor,
        "--scroll-background-color": this.scrollBackgroundColor,
        "--scroll-border-left-color": this.scrollBorderLeftColor,
        "--scroll-thumb-color": this.scrollThumbColor,
        "--backgroud-image": this.backgroungImageCss,
      };
    },
  },
  watch: {
    themeDark(value) {
      this.scrollTrackColor = value ? "#202020" : "#e6e6e6";
      this.scrollBackgroundColor = value ? "white" : "black";
      this.scrollBorderLeftColor = value ? "#2c2c2c" : "#dadada";
      this.scrollThumbColor = value ? "#3e3e3e" : "#b0b0b0";
      if (this.backgroungImage!="")
        this.backgroungImageCss = "url('"+this.backgroungImage+"')"
      else
        this.backgroungImageCss = this.$vuetify.theme.dark ? '#121212' : 'white'
    },
    timeoutUpdate(value) {
      if (this.$store.state.debug) console.log("Change timeout timer update")
      clearInterval(this.updateTimer)
      this.updateTimer = setInterval(() => this.updateCurrentTime(), value * 1000);
    },
    backgroungImage(value){
      if (value!="")
        this.backgroungImageCss = "url('"+value+"')"
      else
        this.backgroungImageCss = this.$vuetify.theme.dark ? '#121212' : 'white'
    }
  },
  data: () => ({
    updateTimer: null,
    scrollTrackColor: "#e6e6e6",
    scrollBackgroundColor: "black",
    scrollBorderLeftColor: "#dadada",
    scrollThumbColor: "#b0b0b0",
    backgroungImageCss: "",
  }),
  methods: {
    updateCurrentTime() {
      if (this.$store.state.socket.isConnected && !this.$store.state.forceUpdate) return;
      if (this.$store.state.debug) console.log("Update data");
      this.$store.dispatch("requestAllData");
    },
    closeDialog()
    {
      this.$store.commit("closeDialog")
    },
    pressButtonDialog(key)
    {
      console.log(this.messageDialog.buttons, key)
      var data = this.messageDialog.buttons[key]
      console.log(data)
      if (data.property)
      {
        var payload = { name: data.property, value: data.value };
        this.$store.dispatch("setGlobal", payload);
      }
      if (data.method)
      {
        this.$store.dispatch("runMethod", data.method);
      }
      if (data.script)
      {
        this.$store.dispatch("runScript", data.script);
      }
      this.closeDialog()
    },
  },
  async created() {
    console.log("breakpoint",this.$vuetify.breakpoint)
    // check default user
    this.$store.state.loading = true
    var url_config = process.env.BASE_URL + "config.json"
    try{
      var res = await axios.get(url_config)
      var config = res.data
      console.log(config)
      var user = ""
      if (!this.$store.getters.isAuthenticated)
        user = config.default_user
      if (config.allow_query_user && this.$route.query.user && this.$route.query.password)
      {
        user = this.$route.query.user
        this.$store
          .dispatch(AUTH_REQUEST, { user: user, password: this.$route.query.password })
          .then(() => {
            this.$store.dispatch("viewNotify", {text:this.$t("login.success")})
            this.loading = false
          })
          .catch(() => {
            //vm.error = true;
            if (this.$store.getters.authStatus != 'error')
            this.$store.dispatch("viewNotify", {text:this.$t("login.failed")})
            else
            this.$store.dispatch("viewNotify", {text:this.$store.getters.authError})
            this.loading = false
          })
      }
      else if (user!="")
      {
        console.log("Default user",user)
        this.$store.commit(AUTH_SUCCESS, {USERNAME:user});
        if (!this.$store.getters.isAuthenticated && config.default_user)
          this.$store.dispatch(USER_REQUEST, {user:user});
      }
    } catch (err) {
      console.log('File config.json not found. Rename file example.config.json to config.json');
    }
    //check last auth
    if (this.$store.getters.isAuthenticated) {
      this.$store.dispatch(USER_REQUEST, {
        user: this.$store.getters.authUser,
      });
    }
    else
      this.$store.state.loading = false
    this.updateTimer = setInterval(
      () => this.updateCurrentTime(),
      this.$store.state.timeoutUpdate * 1000
    );
  },
};
</script>
<style scope>
/* width */
::-webkit-scrollbar {
  width: 15px;
}
/* Track */
::-webkit-scrollbar-track {
  background: var(--scroll-track-color);
  border-radius: 5px;
  border-left: 1px solid var(--scroll-border-left-color);
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb-color);
  border: solid 3px var(--scroll-border-left-color);
  border-radius: 7px;
}
/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--scroll-background-color);
}
#app {
  background: var(--backgroud-image);
  background-size: cover;
  background-attachment: fixed;
}
body::-webkit-scrollbar {
    display: none;
}
.v-list-item {
    min-height: 30px;
    padding: 0 10px 0 10px;
}
.theme--dark.v-tabs-items,
.theme--light.v-tabs-items {
    background-color: transparent;
}
</style>