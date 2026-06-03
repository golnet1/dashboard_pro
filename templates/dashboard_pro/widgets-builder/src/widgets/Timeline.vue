<template>
  <v-card v-resize.initial:debounce.1000="onResize" height="100%" :color="card_color" :ref="this.widget.id" :flat="transparent">
    <v-row v-if="!datacollection" class="fill-height ma-0" align="center" justify="center">
      <v-progress-circular indeterminate color="primary">{{ valueLoad }}</v-progress-circular>
    </v-row>
    <v-card-title v-if="datacollection" class="pb-0 pt-1">
      <span class="ml-5">{{widget.title}}</span>
      <v-spacer />
      <span v-if="selItem" class="caption">{{selItemText}}</span>
    </v-card-title>
    <div class="mx-3" :id="'timeline_'+widget.id"></div>
    <v-btn-toggle id="buttonsLeft" class="pa-n5" dense>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" min-width="24px" x-small @click="fillData()">
            <v-icon x-small color="primary">fas fa-sync</v-icon>
          </v-btn>
        </template>
        <span>{{$t("widget.graph.update_data")}}</span>
      </v-tooltip>
    </v-btn-toggle>
    <v-dialog persistent scrollable v-model="dialog" width="800">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 600px;">
          <v-container class="pa-0" :key="componentKey">
            <v-tabs v-model="tab" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('widget.graph.series')}}</v-tab>
              <v-tab :key="3">{{$t('option.statuses')}}</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
              <v-tab-item :key="1">
                <v-col class="pb-0 ml-n2">
                  <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
                </v-col>
                <v-col class="pb-0 ml-n2">
                  <v-text-field :label="$t('widget.graph.period')" type="number" required v-model="widget.period"></v-text-field>
                </v-col>
                <v-col class="pb-0 ml-n2">
                  <select-color v-model="widget.color"></select-color>
                </v-col>
              </v-tab-item>
              <v-tab-item :key="2">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on" fab x-small @click="addSeries()">
                      <v-icon>fas fa-plus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{$t("add")}}</span>
                </v-tooltip>
                <v-row
                  cols="12"
                  class="pa-0 px-3"
                  v-for="(item, index) in widget.series"
                  :key="index"
                >
                  <v-col cols="3" class="py-0">
                    <v-text-field x-small :label="$t('option.name')" required v-model="item.title"></v-text-field>
                  </v-col>
                  <v-col cols="8" class="py-0">
                    <select-objectproperty :label="$t('option.object_value')" v-model="item.object_value" />
                  </v-col>
                  <v-col cols="1" class="py-0">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          v-bind="attrs"
                          v-on="on"
                          fclass="ml-4 mb-1"
                          fab
                          x-small
                          @click="delSeries(index)"
                        >
                          <v-icon>fas fa-minus</v-icon>
                        </v-btn>
                      </template>
                      <span>{{$t("delete")}}</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </v-tab-item>
              <v-tab-item :key="3">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on" fab x-small @click="addValues()">
                      <v-icon>fas fa-plus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{$t("add")}}</span>
                </v-tooltip>
                <v-row
                  cols="12"
                  class="pa-0 px-3"
                  v-for="(item,index) in widget.values"
                  :key="index"
                >
                  <v-col cols="1" class="pa-0">
                    <v-text-field x-small :label="$t('option.status')" required v-model="item.value" hint=">="></v-text-field>
                  </v-col>
                  <v-col cols="1" class="pa-0 px-1">
                    <v-text-field x-small required v-model="item.value2" hint="<"></v-text-field>
                  </v-col>
                  <v-col cols="4" class="pa-0">
                    <v-text-field x-small :label="$t('option.info')" required v-model="item.title"></v-text-field>
                  </v-col>
                  <v-col cols="1" class="pa-0 pt-3">
                    <color-input v-model="item.color" />
                  </v-col>
                  <v-col cols="1" class="pa-0 pt-3">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn v-bind="attrs" v-on="on" fab x-small @click="delValues(index)">
                          <v-icon>fas fa-minus</v-icon>
                        </v-btn>
                      </template>
                      <span>{{$t("delete")}}</span>
                    </v-tooltip>
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
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
import axios from "axios";

import * as d3Base from "d3";
import { timelines } from "../components/timelines/index.js";
import { timeFormat } from 'd3-time-format';
import { timeHour } from 'd3-time';
//import { timelines } from "d3-timelines";
// attach all d3 plugins to the d3 library
// eslint-disable-next-line no-import-assign
const d3 = Object.assign(d3Base, { timelines });

import resize from "vue-resize-directive";

export default {
  name: "Timeline",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    tab: null,
    datacollection: null,
    componentKey: 1,
    selItem: null,
    valueLoad: 0,
  }),
  components: {},
  directives: {
    resize,
  },
  methods: {
    openOption() {
      if (!this.widget.series) this.widget.series = [];
      if (!this.widget.values) this.widget.values = [];
      this.dialog = true;
    },
    closeDialog() {
      this.dialog = false;
      this.fillData();
    },
    addSeries() {
      this.widget.series.push({
        title: "",
        object_value: "",
      });
      this.componentKey += 1;
    },
    delSeries(index) {
      this.widget.series.splice(index, 1);
      this.componentKey += 1;
    },
    addValues() {
      this.widget.values.push({
        title: "",
        value: 0,
        color: "#ffffff",
      });
      this.componentKey += 1;
    },
    delValues(index) {
      this.widget.values.splice(index, 1);
      this.componentKey += 1;
    },
    async fillData() {
      this.valueLoad = 0;
      d3.select("#timeline_" + this.widget.id)
        .select("svg")
        .remove();
      this.datacollection = null;
      if (this.widget.series == null) return;
      var period = this.widget.period;
      if (period == undefined) period = 1;
      var datasets = [];

      for (let index = 0; index < this.widget.series.length; index++) {
        const element = this.widget.series[index];
        let urlMethod =
          "/api/module/mboard_" +
          process.env.VUE_APP_TYPE +
          "/history/" +
          element.object_value +
          "/" +
          period;
        var response = await axios.get(urlMethod);
        if (this.$store.state.debug) console.log(response);
        var dataRes = response.data.apiHandleResult;
        //console.log(dataRes);
        var data = [];
        const today = new Date();
        today.setHours(today.getHours() - this.widget.period);
        if (dataRes.length == 0) {
          let urlMethod ="/api/data/" + element.object_value
          var res_value = await axios.get(urlMethod);
          var def = {
            ADDED: today,
            value: res_value.data,
          };
          dataRes.push(def)
        }
        for (let i = 0; i < dataRes.length; i++) {
          var begin = new Date(dataRes[i].ADDED).getTime();
          if (begin < today.getTime()) begin = today.getTime();
          var end =
            i < dataRes.length - 1
              ? new Date(dataRes[i + 1].ADDED).getTime()
              : new Date().getTime();
          var d = {
            color: dataRes[i].VALUE == 1 ? "green" : "red",
            //label: "",
            starting_time: begin,
            ending_time: end,
            value: dataRes[i].VALUE,
          };
          if (this.widget.values) {
            var val = this.widget.values.find(
              (t) => (t.value == dataRes[i].VALUE && !t.value2) ||
                  (parseFloat(dataRes[i].VALUE)>=parseFloat(t.value) && parseFloat(dataRes[i].VALUE)<parseFloat(t.value2) && t.value2)
            );
            if (val) {
              //var delta = end - begin;
              //if ((this.widget.period * 60 * 60 * 1000) / delta < 50)
              //d["label"] = val.title;
              d["color"] = val.color;
              d["title"] = val.title;
            }
          }
          if (i==0)
            data.push(d);
          else{
              if (data[data.length-1].color == d.color)
                data[data.length-1].ending_time = d.ending_time;
              else
                data.push(d);
            }
          this.valueLoad = Math.round(
            ((index + 1) * 100) / this.widget.series.length
          );
        }
        var dataset = {
          label: element.title,
          times: data,
        };
        datasets.push(dataset);
      }
      this.valueLoad = 100;

      this.datacollection = datasets;

      //console.log(this.datacollection);
      this.fillControl();
    },
    getRandomInt() {
      return Math.floor(Math.random() * (50 - 5 + 1)) + 5;
    },
    onResize() {
      this.fillControl();
    },
    getStep(step, w, ticks){
      if ( w / Math.round(ticks / step) < 20)
        step = this.getStep(step+1,w,ticks)
      return step
    },
    fillControl() {
      if (this.datacollection == undefined) return;
      const today = new Date();
      today.setHours(today.getHours() - this.widget.period);
      var v = this;
      var w = this.$refs[this.widget.id].$el.clientWidth - 100;
      var h = this.$refs[this.widget.id].$el.clientHeight - 35;
      console.log(this.transparent,h)
      var c = this.datacollection.length
      var ih = Math.round((h-36-4*c)/c)
      if (ih > 30) ih = 40
      h = ih * c + 36 + 4*c
      var step = this.getStep(1, w, this.widget.period)
      var chart = d3
        .timelines()
        .stack() // toggles graph stacking
        .margin({ left: 100, right: 0, top: 0, bottom: 0 })
        //.width(2500)
        //.allowZoom(true)
        .itemHeight(ih)
        .showTimeAxis(true)
        .tickFormat({
          format: timeFormat("%H"),
					tickTime: timeHour,
					tickInterval: step,
					tickSize: 6,
					tickValues: null})
        .itemVerticalPadding(2)
        .labelMargin(2)
        //.rotateTicks(45)
        .beginning(today.getTime())
        .click(function (d, i, datum) {
          console.log(d, i, datum);
          //alert(datum.label);
        })
        // eslint-disable-next-line no-unused-vars
        .mouseover(function (d, i, datum, pos) {
          //console.log(d,i,datum, pos)
          //alert(datum.label);
          v.selItem = d;
          v.selItem["name"] = datum.label;
        })
        // eslint-disable-next-line no-unused-vars
        .mouseout(function (d, i, datum, pos) {
          //console.log(d,i,datum, pos)
          //alert(datum.label);
          v.selItem = null;
        })
        .scroll(function (x, scale) {
          console.log(x, scale);
          this.scroll_text = scale.invert(x) + " to " + scale.invert(x);
        });
      d3.select("#timeline_" + this.widget.id)
        .select("svg")
        .remove();
      var height = h //(this.widget.series.length + 1) * 40;
      // eslint-disable-next-line no-unused-vars
      var svg = d3
        .select("#timeline_" + this.widget.id)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height.toString())
        .datum(this.datacollection)
        .call(chart);
      //this.timelineKey += 1;
    },
    tooltipText(d) {
      return (
        "Color base: " +
        Math.round(d[2] * 100) / 100 +
        ", Position: " +
        Math.round(d[0] * 100) / 100 +
        ";" +
        Math.round(d[1] * 100) / 100
      );
    },
    getDateTimeFromTimestamp(unixTimeStamp) {
      let date = new Date(unixTimeStamp);
      return (
        ("0" + date.getDate()).slice(-2) +
        "/" +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        "/" +
        date.getFullYear() +
        " " +
        ("0" + date.getHours()).slice(-2) +
        ":" +
        ("0" + date.getMinutes()).slice(-2) +
        ":" +
        ("0" + date.getSeconds()).slice(-2)
      );
    },
  },
  computed: {
    selItemText() {
      if (this.selItem == null) return "";
      return (
        this.selItem.name +
        ": " +
        this.selItem.title +
        "(" +
        this.getDateTimeFromTimestamp(this.selItem.starting_time) +
        "-" +
        this.getDateTimeFromTimestamp(this.selItem.ending_time) +
        ")"
      );
    },
  },
  created() {},
  mounted() {
    this.fillData();
    this.fillControl();
  },
};
</script>

<style>
.axis path,
.axis line {
  fill: none;
  stroke: black;
  shape-rendering: crispEdges;
}

.axis text {
  font-family: sans-serif;
  font-size: 10px;
}

.timeline-label {
  font-family: sans-serif;
  font-size: 12px;
}
</style>