<template>
  <div>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            class="mt-16"
            v-bind="attrs"
            v-on="on"
            v-show="
              !editEnable &&
              ((btnPosition == 'Top' && !isChatOpen) || btnPosition == 'Bottom')
            "
            color="primary"
            fixed
            right
            :top="btnPosition == 'Top'"
            :bottom="btnPosition == 'Bottom'"
            fab
            @click="switchChat()"
          >
            <v-icon>fas fa-comment</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("chat") }}</span>
      </v-tooltip>
    <beautiful-chat
      :participants="participants"
      :title="$t('chat')"
      :titleImageUrl="titleImageUrl"
      :onMessageWasSent="onMessageWasSent"
      :messageList="messageList"
      :isOpen="isChatOpen"
      :close="closeChat"
      :open="openChat"
      :showEmoji="false"
      :showFile="false"
      :showEdition="false"
      :showDeletion="false"
      :deletionConfirmation="true"
      :showTypingIndicator="showTypingIndicator"
      :showLauncher="false"
      :showCloseButton="false"
      :editEnable="false"
      :colors="colors"
      :alwaysScrollToBottom="alwaysScrollToBottom"
      :disableUserListToggle="false"
      :messageStyling="messageStyling"
      @onType="handleOnType"
      @edit="editMessage"
    >
      <template v-slot:header>
        <v-list-item>
          <v-list-item-avatar tile>
            <v-img :src="titleImageUrl" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="headline">{{ $t('chat') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="closeChat()">
              <v-icon>fa fa-times</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
      <template v-slot:user-avatar="{ message, user }">
        <v-avatar size="30" class="ma-0 mr-2" v-if="message.type === 'text'">
          <img
            v-if="message.author != 'me'"
            :src="'/cms/avatars/' +user.AVATAR"
            :alt="user.NAME"
          />
          <img v-else :src="'/cms/avatars/' + profile.AVATAR" alt="Me" />
        </v-avatar>
      </template>
      <template v-slot:text-message-body="{ message }">
        <v-icon v-if="!message.read" x-small color="red">fas fa-flag</v-icon>
        {{ message.VALUE.message }}
        <small style="color:gray">{{ new Date(message.dt).toLocaleTimeString([], {timeStyle: 'short'})}}</small>
      </template>
    </beautiful-chat>
  </div>
</template>

<script>
import Vuetify from "../../plugins/vuetify";
import axios from "axios";

export default {
  data: () => ({
    titleImageUrl: "./img/icon.png",
    title: "Chat",
    isChatOpen: false, // to determine whether the chat window should be open or closed
    showTypingIndicator: "", // when set to a value matching the participant.id it shows the typing indicator for the specific user
    colors: {
      header: {
        bg: "primary",
        text: "#ffffff",
      },
      launcher: {
        bg: "primary",
      },
      messageList: {
        bg: "#ffffff",
      },
      sentMessage: {
        bg: "#eaeaea",
        text: "#222222",
      },
      receivedMessage: {
        bg: "#eaeaea",
        text: "#222222",
      },
      userInput: {
        bg: "#f4f7f9",
        text: "#565867",
      },
    }, // specifies the color scheme for the component
    alwaysScrollToBottom: false, // when set to true always scrolls the chat to the bottom when new events are in (new message, user starts typing...)
    messageStyling: true, // enables *bold* /emph/ _underline_ and such (more info at github.com/mattezza/msgdown)
  }),
  computed: {
    profile() {
      return this.$store.getters.getProfile;
    },
    participants(){
      var users = this.$store.getters.getUsers
      users.push(
        {
          id: "support",
          NAME: "Alice",
          AVATAR: "Alice.jpg",
        }
      )
      return users
    },
    editEnable() {
      return this.$store.state.editEnable;
    },
    btnPosition() {
      return this.$store.state.addBtnPosition;
    },
    messageList() {
      return this.$store.getters.sortedEvents
    },
    newMessagesCount() {
      return this.$store.getters.getNewMessagesCount;
    },
    themeDark() {
      return this.$vuetify.theme.dark;
    },
    color() {
      return Vuetify.framework.theme.themes.light.primary;
    },
    theme() {
      return Vuetify.framework.theme;
    },
  },
  watch: {
    themeDark(value) {
      this.colors.messageList.bg = value ? "#1E1E1E" : "white";
      this.colors.userInput.bg = value ? "#1E1E1E" : "white";
    },
    color() {
      this.colors.header.bg = Vuetify.framework.theme.themes.light.primary;
    },
  },
  methods: {
    sendMessage(text) {
      console.log("sendmessage", text);
      if (text.length > 0) {
        this.newMessagesCount = this.isChatOpen
          ? this.newMessagesCount
          : this.newMessagesCount + 1;
        var url = "/command.php?qry=" + text;
        fetch(url)
          .then((res) => res.text())
          .then((res) => {
            if (this.$store.state.debug) console.log(res);
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            const nowDt = new Date();
            this.onMessageWasSent({
              author: "support",
              type: "text",
              data: { text: text, meta:"", dt: nowDt },
            });
          });
      }
    },
    onMessageWasSent(message) {
      // called when the user sends a message
      console.log("onmessage", message);
      var url =
          "/api/module/mboard_" +
          process.env.VUE_APP_TYPE +
          "/command"
        axios.post(url, {
            command: message.data.text,
            user_id: this.$store.getters.getProfile.ID
          }).then(response => {
            if (this.$store.state.debug) console.log(response);
            const nowDt = new Date();
            var data = {
                  dt: nowDt,
                  read: true,
                  NAME: "SAY",
                  VALUE: {
                    level: 0,
                    message: message.data.text,
                    member_id: parseInt(this.$store.getters.getProfile.ID)
                  }
                }
                //console.log(data)
                this.$store.commit("addEvent", data)
            })
    },
    switchChat(){
      if (this.isChatOpen)
        this.closeChat()
      else
        this.openChat()
    },
    openChat() {
      // called when the user clicks on the fab button to open the chat
      this.$store.dispatch("loadEvents")
      this.isChatOpen = true;
      this.newMessagesCount = 0;
      this.colors.header.bg = Vuetify.framework.theme.themes.light.primary;
    },
    closeChat() {
      // called when the user clicks on the botton to close the chat
      this.isChatOpen = false;
    },
    handleScrollToTop() {
      // called when the user scrolls message list to top
      // leverage pagination for loading another page of messages
    },
    handleOnType() {
      //console.log("Emit typing event");
    },
    editMessage(message) {
      const m = this.messageList.find((m) => m.id === message.id);
      m.isEdited = true;
      m.data.text = message.data.text;
    },
  },
  created() {
    this.colors.header.bg = Vuetify.framework.theme.themes.light.primary;
    this.colors.messageList.bg = this.themeDark ? "#1E1E1E" : "white";
    this.colors.userInput.bg = this.themeDark ? "#1E1E1E" : "white";
  },
}
</script>
<style>
.sc-message {
  width: 340px;
}
</style>