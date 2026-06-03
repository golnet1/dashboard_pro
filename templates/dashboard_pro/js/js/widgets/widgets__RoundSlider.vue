<template>
  <v-card v-resize.initial:debounce="onResize" height="100%" ref="RoundSliderBox" :color="card_color" :flat="transparent">
    <div :style="padding">
    <round-slider
          v-if="level"
          v-model="level.value"
          :min="widget.level_min"
          :max="widget.level_max"
          start-angle="315"
          end-angle="+270"
          line-cap="round"
          :radius="size"
          :rangeColor="widget.color"
          tooltipColor="primary"
        ></round-slider>
    </div>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="py-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <select-objectproperty :label="$t('option.object_level')" v-model="widget.object_level" />
            </v-col>
            <v-col cols="12" class="py-0">
              <color-input v-model="widget.color" />
            </v-col>
            <v-row class="pl-3 pr-3">
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_min')" type="number" required v-model="widget.level_min"></v-text-field>
              </v-col>
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_max')" type="number" required v-model="widget.level_max"></v-text-field>
              </v-col>
            </v-row>
            <v-col class="py-0">
              <select-color v-model="widget.color"></select-color>
            </v-col>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog()">{{$t("close")}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import RoundSlider from 'vue-round-slider'
import resize from "vue-resize-directive";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "RoundSliderWidget",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    size: 100,
    padding: "padding-top:1px;padding-left:1px;",
  }),
  components:{
    RoundSlider
  },
  directives: {
    resize,
  },
  methods: {
    change_level: function () {
      var level = Number(this.level.value);
      var payload = { name: this.widget.object_level, value: level };
      this.$store.dispatch("setGlobal", payload);
    },
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_level);
    },
    upLevel()
    {
      var step = this.widget.level_step
      if (!step) step = 1
      var level = Number(this.level.value)+Number(step);
      var payload = { name: this.widget.object_level, value: level };
      this.$store.dispatch("setGlobal", payload);
      this.level.value = level
    },
    downLevel()
    {
      var step = this.widget.level_step
      if (!step) step = 1
      var level = Number(this.level.value)-Number(step);
      var payload = { name: this.widget.object_level, value: level };
      this.$store.dispatch("setGlobal", payload);
      this.level.value = level
    },
    onResize() {
      //console.log("clockbox height", this.$refs.clockBox.$el.clientHeight)
      var h = this.$refs.RoundSliderBox.$el.clientHeight;
      var w = this.$refs.RoundSliderBox.$el.clientWidth;
      var pt = 0;
      var pl = 0;
      if (h < w) {
        this.size = h/2;
        pl = (w - h) / 2;
      } else {
        this.size = w/2;
        pt = (h - w) / 2;
      }
      this.padding = "padding-top:" + pt + "px;padding-left:" + pl + "px;";
      this.borderWidth = Math.round(this.sizeClock/20)
    },
  },
  computed: {
    level() {
      return this.$store.getters.getData(this.widget.object_level);
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_level);
  },
};
</script>

<style>
</style>