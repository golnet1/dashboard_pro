<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title
          v-if="widget.viewTime || widget.viewTime == undefined"
          class="layout justify-center"
          :style="'font-size:'+widget.sizeTime +'px'"
        >{{time}}</v-list-item-title>
        <v-list-item-subtitle
          v-if="widget.viewDate || widget.viewDate == undefined"
          class="layout justify-center"
          :style="'font-size:'+widget.sizeDate +'px'"
        >{{date}}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-dialog persistent scrollable v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-switch v-model="widget.viewTime" :label="$t('widget.clock.viewtime')"></v-switch>
            </v-col>
            <v-col class="pb-0 ml-n2">
              <v-text-field :label="$t('widget.clock.sizetime')" type="number" required v-model="widget.sizeTime"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-switch v-model="widget.viewDate" :label="$t('widget.clock.viewdate')"></v-switch>
            </v-col>
            <v-col class="pb-0 ml-n2">
              <v-text-field :label="$t('widget.clock.sizedate')" type="number" required v-model="widget.sizeDate"></v-text-field>
            </v-col>
            <v-col class="py-0">
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
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "ClockWidget",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    date: "date",
    time: "time",
  }),
  methods: {
    updateCurrentTime() {
      const today = new Date();
      this.date =
        (today.getDate() < 10 ? "0" : "") +
        today.getDate() +
        "-" +
        (today.getMonth() + 1 < 10 ? "0" : "") +
        (today.getMonth() + 1) +
        "-" +
        today.getFullYear();
      this.time =
        (today.getHours() < 10 ? "0" : "") +
        today.getHours() +
        ":" +
        (today.getMinutes() < 10 ? "0" : "") +
        today.getMinutes() +
        ":" +
        (today.getSeconds() < 10 ? "0" : "") +
        today.getSeconds();
    },
  },
  computed: {
  },
  mounted() {
    setInterval(() => this.updateCurrentTime(), 1 * 1000); // TODO clear timeout ALL
    this.updateCurrentTime();
  },
};
</script>

<style>
</style>