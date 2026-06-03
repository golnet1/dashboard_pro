<template>
  <v-dialog v-model="dialog" max-width="1200px">
    <v-card :color="dialog_color">
      <v-card-title>
        <span class="headline">{{$t("history.title")}} "{{ title }}"</span>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pa-0">
        <v-container>
          <v-row>
          <v-col class="d-flex" cols="12" sm="2">
          <v-select
            v-model="selectView"
            :items="itemsView"
            item-text="title"
            item-value="state"
            return-object
            :label="$t('history.type_view')"
            solo
            dense
            hide-details
          ></v-select>
          </v-col>
          <v-col class="d-flex" cols="12" sm="6">
          <v-btn :color="dataLength==1? 'primary' : dialog_color" @click="getData(1)">{{$t("history.hour")}}</v-btn>
          <v-btn :color="dataLength==12? 'primary' : dialog_color" @click="getData(12)">{{$t("history.hour12")}}</v-btn>
          <v-btn :color="dataLength==24? 'primary' : dialog_color" @click="getData(24)">{{$t("history.day")}}</v-btn>
          <v-btn :color="dataLength==148? 'primary' : dialog_color" @click="getData(148)">{{$t("history.week")}}</v-btn>
          <v-btn :color="dataLength==744? 'primary' : dialog_color" @click="getData(744)">{{$t("history.month")}}</v-btn>
          </v-col>
          </v-row>
          <v-row
            v-if="!datacollection && !dataTable && !datatimeline"
            class="fill-height ma-0"
            align="center"
            justify="center"
          >
            <v-progress-circular
              v-if="!emptyHistory"
              indeterminate
              color="primary"
            ></v-progress-circular>
            <div v-if="emptyHistory">{{$t("history.empty")}}</div>
          </v-row>
          <div v-if="selectView.state == 'line'">
            <line-chart
              :ref="'graph_' + object_property"
              v-if="datacollection"
              style="height: 100%"
              :chart-data="datacollection"
              :options="datacollection.options"
            ></line-chart>
            <div v-else>{{$t("history.wrong_data")}}</div>
          </div>
          <div v-if="selectView.state == 'bar'">
            <bar-chart
              :ref="'graphbar_'+object_property"
              v-if="datacollection"
              style="height:100%"
              :chart-data="datacollection"
              :options="datacollection.options"
            ></bar-chart>
            <div v-else>{{$t("history.wrong_data")}}</div>
          </div>
          <div class="mt-3" v-show="selectView.state == 'timeline'" height="120px">
            <div class="mx-0" :id="'timeline_'+historyId"></div>
            <div v-if="datatimeline">
              <span class="caption">{{selItemText}}</span>
            </div>
            <div v-else>{{$t("history.wrong_data")}}</div>
          </div>
          <div class="mt-3" v-show="selectView.state == 'table'">
          <v-data-table
            v-if="dataTable"
            dense
            :items="dataTable"
            :headers="headersData"
            sort-by="x"
            :sort-desc="true"
            item-key="name"
            class="elevation-1"
            style="background-color: rgba(0, 0, 0, 0)"
          >
            <template v-slot:[`item.x`]="{ item }">
              {{ item.x }}
            </template>
            <template v-slot:[`item.y`]="{ item }">
              {{ item.y }}
            </template>
          </v-data-table>
          </div>
        </v-container>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="closeHistory()">{{
          $t("close")
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import LineChart from "../LineChart.js";
import BarChart from "../BarChart.js";

import * as d3Base from "d3";
import { timelines } from "../timelines/index.js";
import { timeFormat } from 'd3-time-format';
import { timeHour } from 'd3-time';
//import { timelines } from "d3-timelines";
// attach all d3 plugins to the d3 library
// eslint-disable-next-line no-import-assign
const d3 = Object.assign(d3Base, { timelines });

import axios from "axios";
import system_color from "../mixins/system_color";
export default {
  name: "HistoryDialog",
  props: {
    value: Boolean,
    object_property: String,
    title: String,
    color: String,
    step_graph: Boolean,
    timelineItems:Array,
  },
  mixins: [system_color],
  components: {
    LineChart,
    BarChart,
  },
  data: () => ({
    dialog: false,
    datacollection: null,
    datatimeline: null,
    dataLength: 6,
    dataSeries: [],
    dataTable: null,
    emptyHistory: false,
    headersData: [
      { text: "Value", value: "y" },
      { text: "Datetime", value: "x" },
    ],
    historyId: 123,
    itemsView: [],
    listColors:["red","green","blue","orange","lime","yellow","gray","pink"],
    selectView: null,
    selItem: null,
    tlItems:[],
  }),
  methods: {
    closeHistory() {
      this.dialog = false;
      this.$emit("input", false);
    },
    async getData(period) {
      this.dataLength = period
      this.dataSeries = []
      this.emptyHistory = false;
      const today = new Date();
      var date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1 < 10 ? "0" : "") +
        (today.getMonth() + 1) +
        "-" +
        (today.getDate() < 10 ? "0" : "") +
        today.getDate();
      var time =
        (today.getHours() < 10 ? "0" : "") +
        today.getHours() +
        ":" +
        (today.getMinutes() < 10 ? "0" : "") +
        today.getMinutes() +
        ":" +
        (today.getSeconds() < 10 ? "0" : "") +
        today.getSeconds();
      var endTime = date + " " + time;
      today.setHours(today.getHours() - period);
      date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1 < 10 ? "0" : "") +
        (today.getMonth() + 1) +
        "-" +
        (today.getDate() < 10 ? "0" : "") +
        today.getDate();
      time =
        (today.getHours() < 10 ? "0" : "") +
        today.getHours() +
        ":" +
        (today.getMinutes() < 10 ? "0" : "") +
        today.getMinutes() +
        ":" +
        (today.getSeconds() < 10 ? "0" : "") +
        today.getSeconds();
      var beginTime = date + " " + time;
      let urlMethod =
        "/api/module/mboard_" +
        process.env.VUE_APP_TYPE +
        "/history/" +
        this.object_property +
        "/" +
        period;
      var response = await axios.get(urlMethod);
      if (this.$store.state.debug) console.log(response);
      var dataRes = response.data.apiHandleResult;

      if (dataRes.length == 0) {
        this.emptyHistory = true;
        return;
      }
      //console.log(dataRes);
      var data = [];
      //var times = [];
      if (!isNaN(parseFloat(dataRes[0].VALUE))) { //graph
        var start = new Date(dataRes[0].ADDED);
        if (today > start) dataRes[0].ADDED = beginTime;

        dataRes.forEach((element) => {
          //times.push(element.ADDED);
          //data.push(element.VALUE);
          data.push({ x: element.ADDED, y: element.VALUE });
        });
        data.push({ x: endTime, y: dataRes[dataRes.length - 1].VALUE });
        this.dataSeries.push(data);

        if (this.datacollection) this.zoomReset();
        this.fillData(period);
        if (period == 6)
          this.selectView = this.itemsView[1]
      }
      if (isNaN(parseFloat(dataRes[0].VALUE)) || this.tlItems.length > 0) { // timeline
        if (period == 6)
          this.selectView = this.itemsView[2]

//console.log(dataRes);
     // d3.select("#timeline_" + this.historyId)
     //   .select("svg")
     //   .remove();
        var datasets = [];
        const today = new Date();
        today.setHours(today.getHours() - period);
        if (dataRes.length == 0) {
          let urlMethod ="/api/data/" + this.object_property
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
            title: dataRes[i].VALUE,
          };
          var val = this.tlItems.find(
              (t) => (t.status == dataRes[i].VALUE ||
                (parseFloat(t.status) <= parseFloat(dataRes[i].VALUE) &&
                parseFloat(t.status2) > parseFloat(dataRes[i].VALUE)))
            );
            if (val) {
              d["color"] = val.color
              d["title"] = val.title
            }
            else
            {
              var color = this.listColors[this.tlItems.length]
                // eslint-disable-next-line vue/no-mutating-props
                this.tlItems.push({
                  color: color,
                  status:dataRes[i].VALUE,
                  title:dataRes[i].VALUE
                })
                d["color"] = color
            }
          if (i==0)
            data.push(d);
          else{
              if (data[data.length-1].color == d.color && data[data.length-1].title == d.title)
                data[data.length-1].ending_time = d.ending_time;
              else
                data.push(d);
            }
        }
        var dataset = {
          label: "",
          times: data,
        };
        datasets.push(dataset);
        this.datatimeline = datasets;
        //console.log(this.datacollection);
        if (this.selectView.state == "timeline")
          this.fillControl(period);
      }
        //for table view
      var data_all = []
      dataRes.forEach((element) => {
        data_all.push({ x: element.ADDED, y: element.VALUE });
      });
      this.dataTable = data_all
    },

    fillControl(period) {
      //console.log("fill timeline")
      if (this.datatimeline == undefined) return;
      const today = new Date();
      today.setHours(today.getHours() - period);
      var v = this;
      var w = 800 // this.$refs[this.object_property].$el.clientWidth - 100;
      var h = 150 //this.$refs[this.object_property].$el.clientHeight - 35;
      var c = this.datatimeline.length
      var ih = Math.round((h-36-4*c)/c)
      var step = this.getStep(1, w, period)
      var chart = d3
        .timelines()
        .stack() // toggles graph stacking
        .margin({ left: 0, right: 0, top: 0, bottom: 0 })
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
        // eslint-disable-next-line no-unused-vars
        .click(function (d, i, datum) {
          //console.log(d, i, datum);
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
        });
      d3.select("#timeline_" + this.historyId)
        .select("svg")
        .remove();
      var height = h //(this.widget.series.length + 1) * 40;
      // eslint-disable-next-line no-unused-vars
      var svg = d3
        .select("#timeline_" + this.historyId)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height.toString())
        .datum(this.datatimeline)
        .call(chart);
      //this.timelineKey += 1;
    },
    getStep(step, w, ticks){
      if ( w / Math.round(ticks / step) < 20)
        step = this.getStep(step+1,w,ticks)
      return step
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
    zoomReset() {
      //console.log(this.$refs["graph_" + this.object_property]);
      if (this.$refs["graph_" + this.object_property])
        this.$refs["graph_" + this.object_property].resetZoom();
    },
    async fillData(period) {
      //console.log("fill graph")
      var datasets = [];
      var labels = [];
      var yAxes = [];

      var dataset = {
        label: this.title,
        borderColor: this.color,
        backgroundColor: this.color+"39",
        data: this.dataSeries[0],
        pointRadius: 2,
        fill: true,
        cubicInterpolationMode: "monotone",
        steppedLine: this.step_graph,
        barPercentage: 0.5,
        barThickness: 'flex',// 10,
        maxBarThickness: 20,
        minBarLength: 2,
      };
      dataset["yAxisID"] = this.object_property;
      datasets.push(dataset);
      yAxes.push({
        id: this.object_property,
        type: "linear",
        ticks: { fontColor: this.color },
        display: true,
        position: "left",
      });

      var unitAxes = "second";
      if (period >= 2) unitAxes = "minute";
      if (period >= 12) unitAxes = "hour";
      if (period >= 24) unitAxes = "day";

      this.datacollection = {
        labels: labels,
        datasets: datasets,
        options: {
          animation: {
            //duration: 0 // general animation time
          },
          hover: {
            //animationDuration: 0 // duration of animations when hovering an item
          },
          //responsiveAnimationDuration: 0, // animation duration after a resize
          legend: {
            display: true,
            labels: {
              fontColor: this.$vuetify.theme.dark ? "white" : "black",
            },
          },
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  displayFormats: {
                    second: "HH:mm:ss",
                    minute: "HH:mm",
                    hour: "HH",
                    day: "D MMM",
                  },
                  parsing: false,
                  unit: unitAxes,
                },
                ticks: {
                  fontColor: this.$vuetify.theme.dark ? "white" : "black",
                },
              },
            ],
            yAxes: yAxes,
          },
          plugins: {
            zoom: {
              // Container for pan options
              pan: {
                // Boolean to enable panning
                enabled: true,

                // Panning directions. Remove the appropriate direction to disable
                // Eg. 'y' would only allow panning in the y direction
                mode: "x",
              },

              // Container for zoom options
              zoom: {
                // Boolean to enable zooming
                enabled: true,

                // Zooming directions. Remove the appropriate direction to disable
                // Eg. 'y' would only allow zooming in the y direction
                mode: "x",
              },
            },
          },
          layout: {
            padding: {
              left: 5,
              right: 10,
              top: 5,
              bottom: 5,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        },
      };
    },
  },
  watch: {
    value(value) {
      this.dialog = value;
      if (value) this.getData(6);
    },
    dialog(val) {
      this.$emit("input", val);
    },
    selectView(value){
      if (value.state == "timeline")
      {
        this.$nextTick(function() {
          this.fillControl(this.dataLength)
        });
      }
    },
  },
  computed: {
    selItemText() {
      if (this.selItem == null) return "-----";
      return (
        this.selItem.title +
        "(" +
        this.getDateTimeFromTimestamp(this.selItem.starting_time) +
        "-" +
        this.getDateTimeFromTimestamp(this.selItem.ending_time) +
        ")"
      );
    },
  },
  beforeMount(){
    this.tlItems = []
    if (this.timelineItems)
    this.timelineItems.forEach((item) => {
        this.tlItems.push(item)
        //console.log(item)
      });
  },
  created() {
    this.historyId = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
    this.itemsView.push({state:"table", title: this.$t("history.table")})
    this.itemsView.push({state:"line", title:this.$t("history.graph")})
    //this.itemsView.push({state:"bar", title:this.$t("history.bar")})
    this.itemsView.push({state:"timeline", title:this.$t("history.timeline")})
    this.selectView = this.itemsView[0]
  },
};
</script>