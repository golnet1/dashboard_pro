<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-list-item two-line v-if="city">
      <v-list-item-content>
        <v-list-item-title class="headline">{{city.name}}</v-list-item-title>
        <v-list-item-subtitle>{{firstWeatherDate}}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-card-text>
      <v-row align="center">
        <v-col class="display-2" cols="6">{{currentTemp}}&deg;C</v-col>
        <v-col cols="6" v-if="list">
          <img :src="'http://openweathermap.org/img/wn/'+list[time].weather[0].icon+'@2x.png'" width="92" />
        </v-col>
      </v-row>
    </v-card-text>

    <v-list-item dense>
      <v-list-item-icon>
        <v-icon>mdi-send</v-icon>
      </v-list-item-icon>
      <v-list-item-subtitle v-if="list">{{ list[time].wind.speed }} м.с</v-list-item-subtitle>
    </v-list-item>

    <v-list-item dense>
      <v-list-item-icon>
        <v-icon>mdi-cloud-download</v-icon>
      </v-list-item-icon>
      <v-list-item-subtitle v-if="list">{{ list[time].main.humidity }}%</v-list-item-subtitle>
    </v-list-item>

    <v-slider v-model="time" :max="4" :tick-labels="labels" class="mx-4" ticks></v-slider>

    <v-list class="transparent" dense>
      <v-list-item v-for="item in forecast" :key="item.day">
        <v-list-item-title>{{ item.day }}</v-list-item-title>

        <v-list-item-icon>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-img
              v-bind="attrs"
              v-on="on"
              :src="'http://openweathermap.org/img/wn/'+item.icon+'@2x.png'"
              width="40" />
            </template>
            <span>{{item.description}}</span>
          </v-tooltip>
        </v-list-item-icon>

        <v-list-item-subtitle class="text-right">{{ item.temp }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-dialog v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-text-field label="City id" required v-model="widget.city_id"></v-text-field>
            </v-col>
          </v-container>
          Get weather from openweathermap.org
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
export default {
  name: "Weather",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    toggle: 1,
    //ApiKey: "7009e684b37f925a4f60ce6978addc0f",
    ApiKey: "9d4bffe1e9b31216bac120e117ec33f3", //MboardPro
    dataWeather: "",
    measure_fahrenheit: "",
    temperature: "",
    lat: "45",
    lon: "38",
    labels: ["SU", "MO", "TU", "WED", "TH", "FR", "SA"],
    time: 0,
    city: null,
    list:null,
    forecast: [

    ],
  }),
  methods: {
    closeDialog()
    {
      this.dialog = false
      this.getForecast()
    },
    getForecast() {
      axios
        .get(
          //`http://api.openweathermap.org/data/2.5/find?lat=${this.lat}&lon=${this.lon}&type=like&lang=ru&units=metric&APPID=${this.ApiKey}`
          //`http://api.openweathermap.org/data/2.5/onecall?lat=${this.lat}&lon=${this.lon}&lang=ru&units=metric&exclude=minutely,hourly&APPID=${this.ApiKey}`
          `http://api.openweathermap.org/data/2.5/forecast?id=${this.widget.city_id}&lang=ru&units=metric&APPID=${this.ApiKey}`
          
        )
        .then((response) => {
          this.dataWeather = response.data
          this.city= response.data.city
          this.list = response.data.list
          this.labels = []
          this.list.forEach(element => {
            var time = element.dt_txt.split(" ")[1]
            time = time.substring(0,5)
            this.labels.push(time)
          });
          this.forecast=[]
          var min = this.list[0].main.temp
          var max = this.list[0].main.temp
          this.list.forEach(element => {
            if (element.main.temp < min) min = element.main.temp
            if (element.main.temp > max) max = element.main.temp
            var date = element.dt_txt.split(" ")[0]
            var time = element.dt_txt.split(" ")[1]
            time = parseInt(time.substring(0,2))
            console.log(time)
            if (time >= 11 && time < 14)
            {
              this.forecast[this.forecast.length-1].icon= element.weather[0].icon
              this.forecast[this.forecast.length-1].description= element.weather[0].description
            }
            if (!this.forecast.find(t=>t.day==date))
            {
              if (this.forecast.length > 0)
              {
                this.forecast[this.forecast.length-1].temp = min.toFixed(1)+"/"+max.toFixed(1)
                min = element.main.temp
                max = element.main.temp
                //this.forecast[this.forecast.length-1].icon= element.weather[0].icon
              }
              this.forecast.push(
              {
                  day: date,
                  icon: "04n",
                  description:"",
                  temp: "...",
              })
            }

          });
          this.forecast[this.forecast.length-1].temp = min.toFixed(1)+"/"+max.toFixed(1)

        })
        .then(
          () =>
            (this.value_icon = "01d")
        );
    },
    getPosition: function () {
      navigator.geolocation.getCurrentPosition(this.updatePosition);
    },
    updatePosition: function (position) {
      this.lat = position.coords.latitude;
      this.lon = position.coords.longitude;
      this.getForecast();
    },

  },
  async created() {
    //await this.getPosition();
    //await this.measureSystemC();
    //await this.measureSystemF();
    //await this.toggleIcon();
     this.getForecast();
  },
  computed: {
    firstWeatherDate()
    {
      if (!this.list) return "..."
      //var dt = new Date(this.list[this.time].dt * 1000);
      //return dt.toLocaleString();
      return this.list[this.time].dt_txt
    },
    currentTemp()
    {
      if (!this.list) return "..."
      return Math.round(this.list[this.time].main.temp)
    },
  },
};
</script>

<style>
</style>