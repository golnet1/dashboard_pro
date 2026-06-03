<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-list-item>
      <v-text-field
        :label="widget.title"
        required
        v-model="text_cmd"
        v-on:keyup.enter="sendCommand()"
      ></v-text-field>
      <SpeechInput :text.sync="text" lang="ru_RU" @speechend="speechEnd" />
      <v-btn dark @click.stop="sendCommand()">{{$t("widget.send_text.send")}}</v-btn>
    </v-list-item>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-text-field
                label="Url"
                required
                v-model="widget.url"
                hint="Example: /command.php?qry=<text>"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-switch v-model="widget.autosend" :label="$t('widget.send_text.autosend')"></v-switch>
            </v-col>
            <v-col class="pa-0">
              <select-color v-model="widget.color"></select-color>
            </v-col>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog = false">{{$t("close")}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import SpeechInput from "@/components/SpeechInput";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "SendText",
  mixins: [mixinWidget,colorWidget,system_color],
  components: {
    SpeechInput,
  },
  data: () => ({
    text_cmd: "",
    text: "",
    sentences: null,
  }),

  methods: {
    speechEnd({ sentences, text }) {
      if (this.$store.state.debug) console.log("text", text);
      if (this.$store.state.debug) console.log("sentences", sentences);
      this.sentences = sentences;
      this.text_cmd = text;
      if (this.widget.autosend) this.sendCommand();
    },
    sendCommand() {
      if (this.text_cmd == "") return;
      this.$store.dispatch("viewNotify", {text:"Send text - "+this.text_cmd})
      var url = this.widget.url.replace("<text>", this.text_cmd);
      fetch(url)
        .then((res) => res.text())
        .then((res) => {
          if (this.$store.state.debug) console.log(res);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.text_cmd = "";
        });
    },
  },
  computed: {
  },
  created() {},
};
</script>

<style>
</style>