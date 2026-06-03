import Vue from 'vue'
import Vuex from 'vuex'
import panels from './modules/panels';
import widgets from './modules/widgets';
import data from "./modules/data"
import auth from "./modules/auth";
import user from "./modules/user";
import events from "./modules/events";
import dialogs from "./modules/dialogs";
import Vuetify from '../plugins/vuetify'
import router from '@/router'
Vue.use(Vuex)

// eslint-disable-next-line no-unused-vars
const debug = process.env.NODE_ENV !== "production";

import axios from 'axios';
import VueNativeSock from 'vue-native-websocket'

export default new Vuex.Store({
  state: {
    loading: true,
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
      error: '',
      sendBytes: 0,
      recvBytes: 0,
    },
    language: "en_EN",
    editEnable: false,
    debug: false,
    mini: false,
    hideMenu: false,
    sidebarMenu: false,
    responsive: true,
    prevent_collision: true,
    vertical_compact: false,
    addBtnPosition: "Bottom",
    useBackgroundPanel: false,
    useBackgroundBar: false,
    backgroundMenu: "",
    backgroundPanel: "",
    colorDark:"#303030",
    colorLight:"#FFFFFF",
    fontSizeTitle: 0,
    fontSizeSubtitle:0,
    iconSizeWidget: 0,
    sizeWidget: 0,
    timeoutUpdate: 5,
    forceUpdate: false,
    transparent_card: 100,
    transparent_control: 100,
    transparent_dialog: 100,
    snackbar: false,
    messageSnackbar: [],
    timeoutSnackbar: 5000,
    historyDialog: false,
    historyDialogSettings: {},
    default_panel:"",
    itemsBar:null,
    console:false,
    sortWidgets:0,
  },
  getters: {
    socketState: state => state.socket,
    editEnable: state => state.editEnable,
    sidebarMenu: state => state.sidebarMenu,
  },
  mutations: {
    SOCKET_ONOPEN(state, event) {
      if (state.debug) console.error(state, event)
      state.socket.isConnected = true
      Vue.prototype.$socket = event.currentTarget
      var mess = {NAME:"MBOARD",read:true,VALUE:{level:0,message:"Websocket connected"}}
      events.mutations.addEvent(events.state, mess)
      this.dispatch('subscribeEvents', 'SAY,MBOARD')
      this.dispatch("subscribeAllData")
    },
    SOCKET_ONCLOSE(state, event) {
      if (state.debug) console.error(state, event)
      if (state.socket.isConnected != false)
      {
        var mess = {NAME:"MBOARD",read:true,VALUE:{level:5,message:"Websocket close"}}
        events.mutations.addEvent(events.state, mess)
      }
      state.socket.isConnected = false
    },
    SOCKET_ONERROR(state, event) {
      if (state.debug) console.error(state, event)
      state.socket.error = event.error
      state.socket.isConnected = false
      //var mess = {NAME:"MBOARD",VALUE:{level:5,message:"Websocket error"}}
      //if (state.debug) events.mutations.addEvent(events.state, mess)
    },
    // default handler called for all methods
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message.data
      state.socket.recvBytes += message.data.length
      //if (state.debug) console.log("WS message",message.data)
      var msg = JSON.parse(message.data)
      if (msg.action == 'properties') {
        var items = JSON.parse(msg.data)
        items.forEach(function (item) {
          var property = item.PROPERTY
          var value = item.VALUE
          if (state.debug) console.log('Properties', property, value)
          data.mutations.updateData(data.state, { name: property, value: value });
        });
      } else if (msg.action == 'events') {
        var eventsData = JSON.parse(msg.data)
        if (state.debug) console.log('Events', eventsData)
        if (eventsData.EVENT_DATA.NAME === 'SAY') {
          events.mutations.addEvent(events.state, eventsData.EVENT_DATA)
          if (eventsData.EVENT_DATA.VALUE.level>=events.state.notifyLevel)
          {
            let level = eventsData.EVENT_DATA.VALUE.level
            let color = this.getters.getLevel(level).color
            let icon = this.getters.getLevel(level).icon
            this.dispatch("viewNotify", {text:eventsData.EVENT_DATA.VALUE.message, icon:icon, color: color});
          }
        }
        if (eventsData.EVENT_DATA.NAME === 'MBOARD') {
          if (state.debug) console.log('Command', eventsData.EVENT_DATA.VALUE)
          let cmd = eventsData.EVENT_DATA.VALUE
          if (cmd.SESSION)
            if (cmd.SESSION != this.getters.sessionId)
              {
                if (state.debug) console.log('Skip command for current session')
                return
              }
          if (cmd.COMMAND == "OpenPanel")
          {
            //find  panel
            let panel = this.getters.getPanelByName(cmd.PANEL)
            if (panel)
              router.push({path: "/"+ panel.type+ "/"+cmd.PANEL})
          } else if (cmd.COMMAND == "UpdateWidget")
          {
            this.commit("setReloadWidget", cmd.WIDGET);
          } else if (cmd.COMMAND == "ViewNotify")
          {
            this.dispatch("viewNotify", cmd.NOTIFY);
          } else if (cmd.COMMAND == "ViewInfo")
          {
            this.commit("addDialogInfo", cmd.INFO);
          } else if (cmd.COMMAND == "ViewQuery")
          {
            this.commit("addDialogQuery", cmd.QUERY);
          } else if (cmd.COMMAND == "CloseInfo")
          {
            this.commit("delDialog", cmd.INFO.id);
          } else if (cmd.COMMAND == "CloseQuery")
          {
            this.commit("delDialog", cmd.QUERY.id);
          } else if (cmd.COMMAND == "Theme")
          {
            Vuetify.framework.theme.dark = cmd.THEME == "dark"
          }else if (cmd.COMMAND == "ViewHistory")
          {
            this.dispatch("viewHistory", cmd.HISTORY);
          }else if (cmd.COMMAND == "HideHistory")
          {
            this.dispatch("hideHistory");
          }
        }
      }
    },
    // mutations for reconnect methods
    SOCKET_RECONNECT(state, count) {
      if (state.debug) console.log(state, count)
    },
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true;
      var mess = {NAME:"MBOARD",VALUE:{level:5,message:"Websocket reconnect error"}}
      if (state.debug) events.mutations.addEvent(events.state, mess)
    },

    updateEditEnable(state, value) {
      state.editEnable = value
    },
    updateSidebarMenu(state, value) {
      console.log("sm",value)
      state.sidebarMenu = value
    },
  },
  actions: {
    sendMessage: function (context, message) {
      if (context.state.socket.isConnected == true) {
        //if (context.state.debug) console.log(message)
        context.state.socket.sendBytes += message.length
        Vue.prototype.$socket.send(message)
      }
    },
    subscribeEvents: function (context, event) {
      if (context.state.socket.isConnected == false) return;
      if (context.state.debug) console.log("Subscribe events - " + event);
      var payload;
      payload = {}
      payload.action = 'Subscribe';
      payload.data = {}
      payload.data.TYPE = 'events';
      payload.data.EVENTS = event;
      context.dispatch("sendMessage",JSON.stringify(payload))
    },
    subscribeProperty: function (context, property) {
      if (context.state.socket.isConnected == false) return;
      if (context.state.debug) console.log("Subscribe property - " + property);
      var payload;
      payload = {}
      payload.action = 'Subscribe';
      payload.data = {}
      payload.data.TYPE = 'properties';
      payload.data.PROPERTIES = property;
      context.dispatch("sendMessage",JSON.stringify(payload))
    },
    runMethod: function (context, method) {
      if (context.state.debug) console.log("runMethod - ", method)
      let urlMethod = "/api.php/method/" + method;
      axios.get(urlMethod).then(response => {
        if (context.state.debug) console.log(response);
      });
    },
    runMethodParams: function (context, payload) {
      if (context.state.debug) console.log("runMethod with params - ", payload)
      let urlMethod = "/api.php/method/" + payload.method;
      var params = {};
      let str = payload.value
      try {
          let str = payload.value
          if (JSON.parse(str) && !!str)
            params.value = JSON.stringify(payload.value)
        } catch (e) {
            params.value = str
        }
        
      axios.get(urlMethod, { params }).then(response => {
        if (context.state.debug) console.log(response);
      });
    },
    runScript: function (context, method) {
      if (context.state.debug) console.log("runScript - ", method)
      let urlMethod = "/api.php/script/" + method;
      axios.get(urlMethod).then(response => {
        if (context.state.debug) console.log(response);
      });
    },
    runScriptParams: function (context, payload) {
      if (context.state.debug) console.log("runScript with params - ", payload)
      let urlMethod = "/api.php/script/" + payload.script;
      var params = {};
      let str = payload.value
      try {
        let str = payload.value
        if (JSON.parse(str) && !!str)
          params.value = JSON.stringify(payload.value)
      } catch (e) {
          params.value = str
      }
      axios.get(urlMethod, { params }).then(response => {
        if (context.state.debug) console.log(response);
      });
    },
    setGlobal: function (context, property) {
      if (context.state.debug) console.log("setGlobal - ", property)
      let urlMethod = "/api.php/data/" + property.name;
      axios.post(urlMethod, { data: property.value }).then(response => {
        if (context.state.debug) console.log(response);
      });
    },
    viewNotify: function (context, message) {
      context.state.messageSnackbar = message
      context.state.snackbar = true
    },
    viewHistory: function (context, history) {
      console.log(history)
      context.state.historyDialogSettings = history
      context.state.historyDialog = true
    },
    hideHistory: function (context) {
      context.state.historyDialog = false
    },
    resetSettings: function (context) {
      console.log("resetAll")
      context.commit("resetData")
      context.commit("resetPanels")
      context.commit("resetWidgets")
      context.commit("clearEvents")
      this.state.loading = false
    },
    loadSettings: function (context) {
      this.state.loading = true
      var user = this.getters.authUser
      fetch('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/config/' + user.replace(/\s/g, '')+"?ts="+ Math.round(new Date()/1000)).then((response) => {
        return response.json().then((json) => {
          //save debug option
          if (context.state.debug) console.log(json);
          json = json.apiHandleResult
          if (this.state.debug) console.log(json)
          if (json.panels && json.panels != "false") {
            if (this.state.debug) console.log(json.panels)
            var panels = JSON.parse(json.panels)
            panels = panels.slice(0, process.env.VUE_APP_LIMIT_PANELS)
            this.commit("setPanels", panels);
          }
          if (json.widgets && json.panels != "false") {
            if (this.state.debug) console.log(json.widgets)
            var widgets = JSON.parse(json.widgets)
            widgets = widgets.slice(0, process.env.VUE_APP_LIMIT_WIDGETS)
            widgets.forEach(element => {
              if (!element.y) element.y = 0
              if (!element.h) element.h = element.minh
              element.reload = false
            });
            context.commit("setWidgets", widgets);
          }
          if (json.levels && json.levels != "false") {
            if (this.state.debug) console.log(json.levels)
            var levels = JSON.parse(json.levels)
            context.commit("setLevels", levels);
          }
          if (json.itemsBar && json.itemsBar != "false") {
            if (this.state.debug) console.log(json.itemsBar)
            var itemsBar = JSON.parse(json.itemsBar)
            this.state.itemsBar = itemsBar
          }
          else
            this.state.itemsBar = []

          console.log(json);
          this.state.language = json.lang
          this.state.mini = json.mini ? json.mini == "true" : false;
          this.state.hideMenu = json.hideMenu ? json.hideMenu == "true" : false;
          Vuetify.framework.theme.dark = json.theme == "dark";
          this.state.default_panel = json.default_panel ? json.default_panel : "";
          this.state.timeoutUpdate = json.timeoutUpdate ? json.timeoutUpdate : 5;
          this.state.forceUpdate = json.forceUpdate ? json.forceUpdate == "true" : false;
          this.state.debug = json.debug ? json.debug == "true" : false;
          this.state.responsive = json.responsive ? json.responsive == "true" : false;
          this.state.prevent_collision = json.prevent_collision ? json.prevent_collision == "true" : false;
          this.state.vertical_compact = json.vertical_compact ? json.vertical_compact == "true" : false;
          this.state.addBtnPosition = json.addBtnPosition ? json.addBtnPosition : "Bottom"
          this.state.transparent_card = json.transparent_card ? json.transparent_card : 100
          this.state.transparent_control = json.transparent_control ? json.transparent_control : 100
          this.state.transparent_dialog = json.transparent_dialog ? json.transparent_dialog : 100
          this.state.iconSizeWidget = json.iconSizeWidget ? parseInt(json.iconSizeWidget) : 0
          this.state.fontSizeTitle = json.fontSizeTitle ? parseInt(json.fontSizeTitle) : 0
          this.state.fontSizeSubtitle = json.fontSizeSubtitle ? parseInt(json.fontSizeSubtitle) : 0
          this.state.sizeWidget = json.sizeWidget ? parseInt(json.sizeWidget) : 0
          if (process.env.VUE_APP_TYPE == "pro") {
            this.state.backgroundMenu = json.backgroundMenu ? json.backgroundMenu : "";
            this.state.backgroundPanel = json.backgroundPanel ? json.backgroundPanel : "";
            this.state.useBackgroundPanel = json.useBackgroundPanel ? json.useBackgroundPanel == "true" : false;
            this.state.useBackgroundBar = json.useBackgroundBar ? json.useBackgroundBar == "true" : false;
            if (json.colorPrimary) {
              Vuetify.framework.theme.themes.light.primary = json.colorPrimary;
              Vuetify.framework.theme.themes.dark.primary = json.colorPrimary;
            }
            this.state.colorLight = json.color_light ? json.color_light : "#FFFFFF";
            this.state.colorDark = json.color_dark ? json.color_dark : "#303030";
          }
          context.commit("setNotifyLevel", json.notifyLevel ? json.notifyLevel : 0)
          var loc = window.location;
          var serverUrl = '';
          if (loc.protocol === "https:") {
            serverUrl = "wss:";
          } else {
            serverUrl = "ws:";
          }
          let host = loc.hostname;
          if (host == "localhost")
            host = json.ip
          serverUrl += '//' + host + ':' + json.ws_port + '/majordomo';
          Vue.use(VueNativeSock, serverUrl, {
            store: this,
            reconnection: true, // (Boolean) whether to reconnect automatically (false)
            //reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
            reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
            passToStoreHandler: function (eventName, event, next) {
              next(eventName, event)
              if (eventName == 'SOCKET_onopen') {
                //this.$store.dispatch("getAllRooms");
                //this.$store.dispatch("getAllModes");
                //this.$store.dispatch("getAllDevices");
                //this.$store.dispatch("getAllStatuses");
                //this.$store.dispatch('subscribeEvents', 'SAY')
                //this.$store.dispatch('subscribeRooms')
                //this.$store.dispatch('subscribeModes')
                //this.$store.dispatch('subscribeStatuses')
                //this.$store.dispatch('subscribeDevices')
              }
              //console.log("Socket", eventName)
            }
          });
          this.state.$socket = Vue.prototype.$socket;
          this.state.loading = false
        })
      })
      .catch((exception) => {
        console.log(exception)
        this.state.loading = false
        this.dispatch("viewNotify", {text:exception, icon:"fas fa-exclamation-triangle", color: "red"});
      })
    },
    saveSettings: function () {
      var user = this.getters.authUser
      let urlMethod = "/api/module/mboard_" + process.env.VUE_APP_TYPE + "/config/" + user.replace(/\s/g, '')
      var widgets = this.getters.allWidgets;
      var panels = this.getters.allPanels;
      var levels = this.getters.allLevels;
      var data = {
        panels: JSON.stringify(panels),
        widgets: JSON.stringify(widgets),
        levels: JSON.stringify(levels),
        itemsBar: JSON.stringify(this.state.itemsBar),
        debug: this.state.debug ? "true" : "false",
        responsive: this.state.responsive ? "true" : "false",
        prevent_collision: this.state.prevent_collision ? "true" : "false",
        vertical_compact: this.state.vertical_compact ? "true" : "false",
        default_panel: this.state.default_panel ,
        addBtnPosition: this.state.addBtnPosition,
        transparent_card: this.state.transparent_card,
        transparent_control: this.state.transparent_control,
        transparent_dialog: this.state.transparent_dialog,
        iconSizeWidget: this.state.iconSizeWidget,
        fontSizeTitle: this.state.fontSizeTitle,
        fontSizeSubtitle: this.state.fontSizeSubtitle,
        sizeWidget: this.state.sizeWidget,
        notifyLevel: this.getters.notifyLevel,
        backgroundMenu: this.state.backgroundMenu,
        backgroundPanel: this.state.backgroundPanel,
        useBackgroundPanel: this.state.useBackgroundPanel ? "true" : "false",
        useBackgroundBar: this.state.useBackgroundBar ? "true" : "false",
        colorPrimary: Vuetify.framework.theme.themes.light.primary,
        color_light: this.state.colorLight,
        color_dark: this.state.colorDark,
        timeoutUpdate: this.state.timeoutUpdate,
        forceUpdate: this.state.forceUpdate ? "true" : "false",
        theme: Vuetify.framework.theme.dark ? "dark" : "light",
        mini: this.state.mini ? "true" : "false",
        hideMenu: this.state.hideMenu ? "true" : "false",
      }
      axios.put(urlMethod, data)
        .then((response) => {
          if (this.state.debug) console.log(response);
        });
    },
  },

  modules: {
    data,
    panels,
    widgets,
    auth,
    user,
    events,
    dialogs,
  },
  //strict: debug
})
