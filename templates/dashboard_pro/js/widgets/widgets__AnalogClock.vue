<template>
  <v-card v-resize.initial:debounce="onResize" height="100%" ref="clockBox" id="info-box" :color="card_color" :flat="transparent">
    <div :style="padding">
      <AnalogClock
      :backgroundImage="widget.backgroundImage"
      :borderImage="widget.borderImage"
      :backgroundAlpha = 1
      :handType="widget.handType"
      :scaleType="widget.scaleType"
      :size="sizeClock"
      :borderWidth="borderWidth" />
    </div>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col class="pb-0">
              <v-select
                    v-model="widget.handType"
                    :items="handTypes"
                    item-text="title"
                    item-value="name"
                    :label="$t('widget.analogclock.handtype')"
                  ></v-select>
            </v-col>
            <v-col class="pb-0">
              <v-select
                    v-model="widget.scaleType"
                    :items="scaleTypes"
                    item-text="title"
                    item-value="name"
                    :label="$t('widget.analogclock.scaletype')"
                  ></v-select>
            </v-col>
            <v-col class="pb-0">
              <v-text-field :label="$t('widget.analogclock.backgroundimage')" v-model="widget.backgroundImage"></v-text-field>
            </v-col>
            <v-col class="pb-0">
              <v-text-field :label="$t('widget.analogclock.borderimage')" v-model="widget.borderImage"></v-text-field>
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
import { AnalogClock } from "vue-analog-clock";
import resize from "vue-resize-directive";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "AnalogClockWidget",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    sizeClock: 200,
    padding: "padding-top:1px;padding-left:1px;",
    borderWidth: 5,
    handTypes:[
      { title: "Triangle", name: "triangle" },
      { title: "Line", name: "line" },
    ],
    scaleTypes:[
      { title: "Roman", name: "roman" },
      { title: "Arabic", name: "arabic" },
      { title: "None", name: "none" },
    ],
  }),
  directives: {
    resize,
  },
  components: {
    AnalogClock,
  },
  methods: {
    onResize() {
      var h = this.$refs.clockBox.$el.clientHeight;
      var w = this.$refs.clockBox.$el.clientWidth;
      var pt = 0;
      var pl = 0;
      if (h < w) {
        this.sizeClock = h;
        pl = (w - h) / 2;
      } else {
        this.sizeClock = w;
        pt = (h - w) / 2;
      }
      this.padding = "padding-top:" + pt + "px;padding-left:" + pl + "px;";
      this.borderWidth = Math.round(this.sizeClock/20)
    },
  },
  computed: {},
  created() {},
  mounted() {},
};
</script>

<style scoped>
.transparent {
   background-color: white!important;
   opacity: 0.65;
   border-color: transparent!important;
 }
</style>