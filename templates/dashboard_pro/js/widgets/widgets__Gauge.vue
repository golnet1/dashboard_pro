<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="data.value ? false : 'primary'">
    <v-list-item v-if="widget.view_history" style="height: 100%;" class="pa-0 ma-0" @click="dialog_history=true">
    <k-gauge :key="componentKey"
      v-if="data.value"
      height="100%"
      width="100%"
      :title="widget.title"
      :value="data.value"
      :min="parseInt(widget.minValue)"
      :max="parseInt(widget.maxValue)"
      :doughnut="widget.doughnut"
      :colorSteps="colorSteps"
      :formatFunction="(x) => `${x.toFixed(widget.round)}`"
      titleStyle="fill: currentColor; font-size: 15px; font-weight: bold"
      valueFontStyle="fill: currentColor; font-size: 35px; font-weight: bold"
      :label-text="widget.unit"
    />
    </v-list-item>
    <v-list-item v-else style="height: 100%;" class="pa-0 ma-0">
    <k-gauge :key="componentKey"
      v-if="data.value"
      height="100%"
      width="100%"
      :title="widget.title"
      :value="data.value"
      :min="parseInt(widget.minValue)"
      :max="parseInt(widget.maxValue)"
      :doughnut="widget.doughnut"
      :colorSteps="colorSteps"
      :formatFunction="(x) => `${x.toFixed(widget.round)}`"
      titleStyle="fill: currentColor; font-size: 15px; font-weight: bold"
      valueFontStyle="fill: currentColor; font-size: 35px; font-weight: bold"
      :label-text="widget.unit"
    />
    </v-list-item>
    <v-overlay
      absolute="absolute"
      :value="alive"
      color="red"
      :z-index="0"
    >
    </v-overlay>
    <History v-model="dialog_history" :object_property="widget.object_value" :title="widget.title" :color="widget.history_color" />
    <v-dialog v-model="dialog" scrollable persistent width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 500px;">
          <v-container class="pa-0">
            <v-tabs v-model="tab" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('widget.gauge.colors')}}</v-tab>
              <v-tab :key="3">{{$t('option.advanced')}}</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
              <v-tab-item :key="1">
                <v-row>
                  <v-col cols="12" class="pb-0">
                    <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
                  </v-col>
                  <v-col cols="12" class="pb-0">
                    <v-text-field :label="$t('option.unit')" required v-model="widget.unit"></v-text-field>
                  </v-col>
                  <v-col cols="12" class="pb-0">
                    <select-objectproperty :label="$t('option.object_value')" v-model="widget.object_value" />
                  </v-col>
                  <v-row class="pl-3 pr-3">
                    <v-col class="pb-0">
                      <v-text-field
                        :label="$t('widget.gauge.min_value')"
                        type="number"
                        required
                        v-model="widget.minValue"
                      ></v-text-field>
                    </v-col>
                    <v-col class="pb-0">
                      <v-text-field
                        :label="$t('widget.gauge.max_value')"
                        type="number"
                        required
                        v-model="widget.maxValue"
                      ></v-text-field>
                    </v-col>
                    <v-col class="pb-0">
                      <v-text-field
                        :label="$t('widget.gauge.round')"
                        type="number"
                        required
                        v-model="widget.round"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-col cols="12" class="pb-0">
                    <v-switch v-model="widget.doughnut" :label="$t('widget.gauge.doughnut')"></v-switch>
                  </v-col>
                </v-row>
              </v-tab-item>
              <v-tab-item :key="2">
                <v-col class="pb-0">
                  {{$t('widget.gauge.gradient')}}
                </v-col>
                <v-col class="pb-0 my-3" :style="{background: gradient}">
                </v-col>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on" fab x-small @click="addColor()" class="mb-3">
                      <v-icon>fas fa-plus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{$t("add")}}</span>
                </v-tooltip>
                <draggable :options="options" v-model="widget.colors">
                <v-row
                  cols="12"
                  class="ma-0"
                  v-for="(item,index) in widget.colors"
                  :key="index"
                >
                  <v-col cols="1" class="ma-0">
                    <v-icon style="cursor:move;">fas fa-bars</v-icon>
                  </v-col>
                  <v-col cols="5" class="pa-0">
                    <color-input v-model="item.color" view-input/>
                  </v-col>
                  <v-col cols="1" class="pt-2">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn v-bind="attrs" v-on="on" fab x-small @click="delColor(index)">
                          <v-icon>fas fa-minus</v-icon>
                        </v-btn>
                      </template>
                      <span>{{$t("delete")}}</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
                </draggable>
              </v-tab-item>
              <v-tab-item :key="3">
                  <v-col cols="12" class="pb-0">
                    <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
                  </v-col>
                  <v-col cols="12" class="py-0">
                    <select-color v-model="widget.color"></select-color>
                  </v-col>
                  <v-row class="pl-3 pr-3 mt-3">
                    <v-col class="py-0">
                      <v-switch v-model="widget.view_history" :label="$t('option.view_history')"></v-switch>
                    </v-col>
                    <v-col v-if="widget.view_history" class="pa-0">
                      <color-input v-model="widget.history_color" view-input/>
                    </v-col>
                  </v-row>
              </v-tab-item>
            </v-tabs-items>
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
import KGauge from "@kagronick/kgauge-vue";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
import aliveWidget from '../components/mixins/alive';
import History from "../components/core/HistoryDialog";
import draggable from "vuedraggable";
export default {
  name: "Gauge",
  mixins: [mixinWidget,colorWidget,aliveWidget,system_color],
  components: {
    KGauge,
    History,
    draggable,
  },
  data: () => ({
    tab:0,
    componentKey: 1,
    dialog_history:false,
  }),
  methods: {
    openOption() {
      if (!this.widget.colors) this.widget.colors = [];
      this.dialog = true;
    },
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_value);
      this.$store.dispatch("requestData", this.widget.object_alive);
      this.componentKey += 1;
    },
    addColor() {
      this.widget.colors.push({
        color: "#ffffff",
      });
    },
    delColor(index) {
      this.widget.colors.splice(index, 1);
    },
  },
  computed: {
    data() {
      return this.$store.getters.getData(this.widget.object_value);
    },
    colorSteps() {
      if (this.widget.colors)
      {
        console.log(this.widget.colors)
        if(this.widget.colors.length != 0)
         return this.widget.colors.map(a => a.color);
      }
      return ["#a9d70b", "#f9c802", "#ff0000"];
    },
    gradient() {
      let colors = "linear-gradient(90deg";
      this.colorSteps.forEach(function (e) {
        colors += "," + e;
      });
      colors += ")";
      return colors;
    },
    options () {
      return {
        disabled: false
      }
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
    this.$store.dispatch("requestData", this.widget.object_alive);
  },
};
</script>

<style>
</style>