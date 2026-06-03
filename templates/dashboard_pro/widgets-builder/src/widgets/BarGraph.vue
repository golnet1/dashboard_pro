<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-row v-if="!datacollection" class="fill-height ma-0" align="center" justify="center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>
    <line-chart
      :ref="'graph_'+widget.id"
      v-show="chartType=='line'"
      v-if="datacollection"
      style="height:100%"
      :chart-data="datacollection"
      :options="datacollection.options"
    ></line-chart>
    <bar-chart
      :ref="'graph_'+widget.id"
      v-show="chartType=='bar'"
      v-if="datacollection"
      style="height:100%"
      :chart-data="datacollection"
      :options="datacollection.options"
    ></bar-chart>
    <v-btn-toggle id="buttonsLeft" class="pa-n5" dense>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" min-width="24px" x-small @click="getData()">
            <v-icon x-small color="primary">fas fa-sync</v-icon>
          </v-btn>
        </template>
        <span>{{$t("widget.graph.update_data")}}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" min-width="24px" x-small @click="zoomReset()">
            <v-icon x-small color="primary">fas fa-search</v-icon>
          </v-btn>
        </template>
        <span>{{$t("widget.graph.reset_zoom")}}</span>
      </v-tooltip>
    </v-btn-toggle>
    <v-dialog persistent scrollable v-model="dialog" width="650">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0" :key="componentKey">
            <v-col class="pb-0 ml-n2">
              <v-text-field :label="$t('widget.graph.period')" type="number" required v-model="widget.period"></v-text-field>
            </v-col>
            <div class="ml-1">{{$t('widget.graph.series')}}</div>
            <v-tabs v-model="tab" background-color="transparent">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on" class="my-2" fab x-small @click="addSeries()">
                    <v-icon>fas fa-plus</v-icon>
                  </v-btn>
                </template>
                <span>{{$t("add")}}</span>
              </v-tooltip>
              <v-tab v-for="(item, index) in widget.series" :key="item.key">
                {{ item.title ? item.title : "Series "+(index+1) }}
                <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on" class="ml-4 mb-1" fab x-small @click="delSeries(item.key)">
                  <v-icon>fas fa-minus</v-icon>
                </v-btn>
                </template>
                <span>{{$t("delete")}}</span>
              </v-tooltip>
              </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item v-for="item in widget.series" :key="item.key">
                  <v-col cols="12" class="py-0">
                    <v-text-field x-small :label="$t('option.name')" required v-model="item.title"></v-text-field>
                  </v-col>
                  <v-col cols="12" class="py-0">
                    <select-objectproperty :label="$t('option.object_value')" v-model="item.object_value" />
                  </v-col>
                  <v-row class="px-3">
                    <v-col cols="2" class="justify-center align-center">
                      <color-input v-model="item.color" />
                    </v-col>
                    <v-col cols="3" class="py-0">
                      <v-select
                        v-model="item.scale"
                        :items="scalePositions"
                        item-text="title"
                        item-value="name"
                        :label="$t('widget.graph.scale')"
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-tab-item>
              </v-tabs-items>
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
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
import axios from "axios";
var shortid = require("shortid");
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
export default {
  name: "BarGraph",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    tab: null,
    chartType: "bar",
    datacollection: null,
    dataSeries: [],
    componentKey: 1,
    scalePositions: [
      { title: "Left", name: "left" },
      { title: "Right", name: "right" },
      { title: "None", name: "none" },
    ],
  }),
  components: {
    LineChart,
    BarChart,
  },
  methods: {
    openOption() {
      if (!this.widget.series) this.widget.series = [];
      this.dialog = true;
    },
    closeDialog() {
      this.dialog = false;
      this.getData();
    },
    addSeries() {
      var id = shortid.generate();
      this.widget.series.push({
        key: id,
        title: "",
        object_value: "",
        color: "#ffffff",
      });
      this.componentKey += 1;
    },
    delSeries(id) {
      let index = this.widget.series.findIndex((t) => t.key === id);
      this.widget.series.splice(index, 1);
      this.componentKey += 1;
    },
    zoomReset() {
      console.log(this.$refs["graph_" + this.widget.id]);
      this.$refs["graph_" + this.widget.id].resetZoom();
    },
    async getData() {
      this.dataSeries = [];
      if (this.widget.series == null) return;
      var period = this.widget.period;
      if (period == undefined) period = 1;

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
      today.setHours(today.getHours() - this.widget.period);
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
        //var times = [];
        if (dataRes.length > 0) {
          var start = new Date(dataRes[0].ADDED);
          if (today > start) dataRes[0].ADDED = beginTime;
        }
        dataRes.forEach((element) => {
          //times.push(element.ADDED);
          //data.push(element.VALUE);
          data.push({ x: element.ADDED, y: element.VALUE });
        });
        data.push({ x: endTime, y: dataRes[dataRes.length - 1].VALUE });
        this.dataSeries.push(data);
      }
      if (this.datacollection) this.zoomReset();
      this.fillData();
    },

    async fillData() {
      if (this.widget.series == null) return;
      var period = this.widget.period;
      if (period == undefined) period = 1;
      var datasets = [];
      var labels = [];
      var yAxes = [];

      for (let index = 0; index < this.widget.series.length; index++) {
        const element = this.widget.series[index];
        var dataset = {
          label: element.title,
          borderColor: element.color,
          backgroundColor: element.color,// + "39",
          data: this.dataSeries[index],
          pointRadius: 2,
          fill: element.fill,
          cubicInterpolationMode: "monotone",
          barPercentage: 0.5,
          barThickness: 'flex',// 10,
          maxBarThickness: 20,
          minBarLength: 2,
        };
        if (element.scale) dataset["yAxisID"] = element.key;
        datasets.push(dataset);
        yAxes.push({
          id: element.key,
          type: "linear",
          ticks: { fontColor: element.color },
          display: element.scale != "none",
          position: element.scale != "none" ? element.scale : "left",
        });
      }

      var unitAxes = "hour";
      if (period <= 12) unitAxes = "minutes";

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
              fontColor: this.$vuetify.theme.themes.dark.primary.base,
            },
          },
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  displayFormats: {
                    hour: "HH",
                    minutes: "HH:mm",
                  },
                  unit: unitAxes,
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
  computed: {
    valuesSeries() {
      var arr = [];
      this.widget.series.forEach((series) => {
        arr.push({
          name: series.object_value,
          value: this.$store.getters.getDataValue(series.object_value),
        });
      });
      return arr;
    },
  },
  watch: {
    valuesSeries(newData, oldData) {
      //console.log("watch", newData, oldData);
      newData.forEach((element, index) => {
        var newValue = element.value;
        var oldValue =
          oldData[index].value != undefined ? oldData[index].value : undefined;
        if (!newValue) return;
        if (this.dataSeries.length == 0) return;
        if (newValue != oldValue)
          if (this.$store.state.debug)
            console.log("Change ", element.name, oldValue, "=>", newValue);
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
        this.dataSeries[index].push({ x: endTime, y: newValue }); // add new point
        today.setHours(today.getHours() - this.widget.period);
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
        while (new Date(this.dataSeries[index][1].x) < today) {
          // del point
          this.dataSeries[index].shift();
        }
        this.dataSeries[index][0].x = beginTime;
        this.fillData();
        //Vue.set(this.datacollection.datasets[index], 'data', data);
      });
    },
  },
  created() {
    this.widget.series.forEach((series) => {
      this.$store.dispatch("requestData", series.object_value);
    });
  },
  mounted() {
    this.getData();
  },
};
</script>

<style>
#buttonsLeft {
  line-height: 12px;
  font-size: 8pt;
  font-family: tahoma;
  margin-top: 1px;
  margin-right: 2px;
  position: absolute;
  top: 0;
  left: 0;
}
</style>