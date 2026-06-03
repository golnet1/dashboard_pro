<template>
    <v-responsive
                class="overflow-y-hidden fill-height  justify-center"
                v-resize.initial:debounce="onResize"
                ref="eventsBox"
              >
    <v-container :height="cardHeight">
         <v-layout align-center justify-center>
    <v-card :color="nav_color" :height="cardHeight-30" class="d-flex flex-column fill-width">
      <v-card-title class="mt-n2">
      <v-text-field class="pt-0" v-model="search" append-icon="fas fa-search" :label="$t('search')" single-line hide-details></v-text-field>
      <v-spacer></v-spacer>
      <div class="mt-1">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"
          v-on="on" @click="readAll()"><v-icon small>fas fa-flag</v-icon></v-btn>
        </template>
        <span>{{$t("events.read_all")}}</span>
      </v-tooltip>
      <v-tooltip top><template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"
          v-on="on" @click="refreshEvents()"><v-icon small>fas fa-sync-alt</v-icon></v-btn></template>
       <span>{{$t("events.update")}}</span>
      </v-tooltip>
      <v-tooltip top><template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"
          v-on="on" @click="openOption()"><v-icon small>fas fa-cog</v-icon></v-btn></template>
       <span>{{$t("events.settings")}}</span>
      </v-tooltip>
      <v-tooltip top><template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"
          v-on="on" @click="deleteAll()"><v-icon small>fas fa-trash</v-icon></v-btn></template>
        <span>{{$t("events.delete")}}</span>
      </v-tooltip>
      </div>
      </v-card-title>
      <v-card-text v-if="data.length>0" class="flex-grow-1 overflow-y-auto">
        <template v-for="(item, index) in data">
          <v-list-item dense :key="index" @click="readEvent(item)" :class="item.read==false? 'unread':''">
              <v-list-item-avatar tile class="mr-2">
                <v-img v-if="item.NAME == 'SAY'"
                  :alt="`${item.member} avatar`"
                  :src="'/cms/avatars/' + getUser(item.VALUE.member_id).AVATAR"
                ></v-img>
                <v-img v-if="item.NAME == 'MBOARD'"
                  alt="MBOARD"
                  :src="mainIcon"
                ></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="item.VALUE.message"></v-list-item-title>
                <v-list-item-subtitle v-text="getDateString(item.dt)"></v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action class="my-0">
                <v-icon :color="getColor(item.VALUE.level)">
                  {{getIcon(item.VALUE.level)}}
                </v-icon>
              </v-list-item-action>
          </v-list-item>
          <v-divider
            v-if="index != data.length - 1"
            :key="'div_'+index"
          ></v-divider>
        </template>
        <v-layout justify-center>
          <v-btn class="mt-1" v-if="data.length > 0" @click="loadMoreEvents()" >
            <v-icon class="mr-3">fas fa-angle-down</v-icon>
            {{$t('events.load_more')}}
            <v-icon class="ml-3">fas fa-angle-down</v-icon>
          </v-btn>
        </v-layout>
      </v-card-text>
      <v-card-text v-else class="flex-grow-1 overflow-y-auto">
        <v-container fluid fill-height>
            <v-layout class="align-center justify-center">
              <v-btn @click="refreshEvents()" >
                <v-icon class="mr-3">fas fa-sync-alt</v-icon>
              {{$t("events.update")}}
              </v-btn>
            </v-layout>
        </v-container>
      </v-card-text>
      <v-card-actions>
                      <v-text-field
                      v-model="command"
                      :label="$t('events.command')"
                      type="text"
                      no-details
                      outlined
                      @keyup.enter="sendMessage"
                      hide-details
                    />
                    <v-btn
                      class="mx-2"
                      fab
                      dark
                      small
                      color="primary"
                      @click="sendMessage"
                    >
          <v-icon dark>
           fab fa-telegram-plane
          </v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
         </v-layout>
    </v-container>
      <v-dialog persistent scrollable v-model="dialog" width="700">
      <v-card>
        <v-card-title>
          <span class="headline">{{$t("events.settings")}}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pa-0 mt-3">
                <v-text-field :label="$t('events.notify_level')" type="number" required v-model="notifyLevel"></v-text-field>
            </v-col>
            {{$t("events.levels")}}
            <v-row cols="12" class="pa-0 px-3" v-for="(item,index) in levels" :key="index">
              <v-col cols="2" class="pa-0 pt-3">
                <v-text-field x-small :label="$t('events.level')" type="number" required v-model="item.level"></v-text-field>
              </v-col>
              <v-col cols="1" class="pa-0 ml-2 pt-6">
                <color-input v-model="item.color" />
              </v-col>
              <v-col cols="7" class="pa-0">
                <icon-input :label="$t('option.icon')" required v-model="item.icon"></icon-input>
              </v-col>
              <v-col cols="1" class="ml-6 pt-6">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on" fab x-small @click="delLevel(index)">
                      <v-icon>fas fa-minus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{$t("delete")}}</span>
                </v-tooltip>
              </v-col>
            </v-row>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" fab x-small @click="addLevel()">
                  <v-icon>fas fa-plus</v-icon>
                </v-btn>
              </template>
              <span>{{$t("add")}}</span>
            </v-tooltip>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog()">{{$t("close")}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</v-responsive>
</template>
<script>
import systemColor from '../components/mixins/system_color';
import axios from "axios";
import resize from "vue-resize-directive";
export default {
  mixins: [systemColor],
  name: "Events",
  directives: {
    resize,
  },
  data: () => ({
    mainIcon: "./img/icon.png",
    search: "",
    command:"",
    cardHeight:500,
    headersData: [
      { text: "",align: 'start',value: "read",width: '10px', sort:false },
      {
        text: "Message",
        align: "start",
        value: "VALUE.message",
      },
      { text: "Type", value: "NAME" },
      { text: "Level", value: "VALUE.level" },
      { text: "Datetime", value: "dt" },
    ],
    dialog: false,
  }),
  watch:{
    search(value){
      this.$store.commit("setSearchQuery", value);
    }
  },
  created(){
    this.headersData[1].text = this.$t("events.message")
    this.headersData[2].text = this.$t("events.type")
    this.headersData[3].text = this.$t("events.level")
    this.headersData[4].text = this.$t("events.datetime")
  },
  mounted(){
    //this.loadUsers()
  },
  computed: {
    loading() {
      return this.$store.state.loading;
    },
    levels: {
      get(){
        return this.$store.getters.allLevels
      },
      set(value){
        this.$store.commit("setLevels", value)
      }
    },
    notifyLevel:{
      get(){
        return this.$store.getters.notifyLevel
      },
      set(value){
        this.$store.commit("setNotifyLevel",value)
      }
    },
    editEnable: {
      get() {
        return this.$store.state.editEnable; // || this.$vuetify.breakpoint.mdAndDown;
      },
      set(value) {
        this.$store.commit("updateEditEnable", value);
        if (!value) {
          this.saveConfig();
        }
      },
    },
    data() {
      return this.$store.getters.sortedAndSearchedPosts;
    },
  },
  methods: {
    onResize() {
      var h = this.$refs.eventsBox.$el.clientHeight;
      //var w = this.$refs.clockBox.$el.clientWidth;

      this.cardHeight = h
    },
    getUser(id){
      var user = this.$store.getters.getUser(id)
      if (user) return user
      return {AVATAR:""}
    },
    getDateString(updated){
        var dt = new Date(updated)
        return dt.toLocaleString()
    },
    openOption() {
      this.dialog = true;
    },
    closeDialog(){
      this.dialog = false
    },
    addLevel() {
      this.levels.push({
        level: "0",
        icon: "fas fa-bell",
        color: "#ff0000",
      });
    },
    delLevel(index) {
      this.levels.splice(index, 1);
    },
    getColor(level){
      return this.$store.getters.getLevel(level).color
    },
    getIcon(level){
      return this.$store.getters.getLevel(level).icon
    },
    readEvent(event) {
      this.$store.commit("readEvent", event);
    },
    readAll(){
      this.$store.commit("readAllEvent");
    },
    deleteAll(){
      this.$store.commit("resetEvents");
    },
    loadMoreEvents(){
      this.$store.dispatch("loadMoreEvents")
    },
    refreshEvents(){
      this.$store.dispatch("loadEvents");
    },
    sendMessage() {
      var text = this.command
      console.log("sendmessage", text);
      if (text.length > 0) {
        //var username = this.$store.getters.getProfile.USERNAME
        this.newMessagesCount = this.isChatOpen
          ? this.newMessagesCount
          : this.newMessagesCount + 1;
        var url =
          "/api/module/mboard_" +
          process.env.VUE_APP_TYPE +
          "/command"
        axios.post(url, {
            command: text,
            user_id: this.$store.getters.getProfile.ID
          }).then(response => {
            console.log(response)
            const nowDt = new Date();
            var data = {
                  dt: nowDt,
                  read: true,
                  NAME: "SAY",
                  VALUE: {
                    level: 0,
                    message: text,
                    member_id: parseInt(this.$store.getters.getProfile.ID)
                  }
                }
                //console.log(data)
                this.$store.commit("addEvent", data)
                this.command = ""
            })
      }
    },
  },
};
</script>

<style scoped>
.scroll {
   overflow-y: scroll
}
.unread {
   border-left: 3px solid red
}
</style>
