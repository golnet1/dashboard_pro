<template>
  <v-card
    :height="
      parent_panel.type == 'panel'
        ? '100%'
        : widget.min_height
        ? widget.min_height
        : '150px'
    "
    :color="card_color"
    :flat="transparent"
    :loading="object_value.value || widget.object_value==undefined ? false : 'primary'"
  >
    <v-img height="100%" width="100%">
      <l-map
        :zoom="zoom"
        :center="center"
        :options="mapOptions"
        @update:center="centerUpdate"
        @update:zoom="zoomUpdate"
        ref="mymap"
      >
        <l-tile-layer
          :url="widget.provider ? providers[widget.provider].url : providers[0].url"
          :subdomains="widget.provider ? providers[widget.provider].subdomains : providers[0].subdomains"
          :attribution="attribution"
          :reuseTiles="reuseTiles"
          :updateWhenIdle="updateWhenIdle"
        />
        <l-marker v-if="widget.object_value" :lat-lng="markerLatLng">
          <l-popup v-if="widget.title">{{ widget.title }}</l-popup>
        </l-marker>
      </l-map>
    </v-img>
    <v-dialog persistent scrollable v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{
            $t("option.title", [$t("widget." + widget.type + ".name")])
          }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col class="pa-0">
              <v-text-field
                label="Title"
                required
                v-model="widget.title"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="pa-0">
              <select-objectproperty
                :label="$t('option.object_status')"
                v-model="widget.object_value"
              />
            </v-col>
            <v-col class="pa-0" v-if="parent_panel.type != 'panel'">
              <v-text-field
                :label="$t('widget.group.max_height')"
                v-model="widget.min_height"
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="pa-0">
              <v-select
                v-model="widget.provider"
                :items="providers"
                item-text="title"
                item-value="id"
                label="Map provider"
                hide-details=""
              ></v-select>
            </v-col>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog()">{{
            $t("close")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { latLng } from "leaflet";
import { LMap, LTileLayer, LMarker, LPopup } from "vue2-leaflet";
import mixinWidget from "../components/mixins/widget";
import colorWidget from "../components/mixins/card_color";
import system_color from "../components/mixins/system_color";
export default {
  name: "MapWidget",
  mixins: [mixinWidget, colorWidget, system_color],
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
  },
  data: () => ({
    providers: [
      { id: 0, title: "Openstreet", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"},
      { id: 1, title: "2GIS", url: "http://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}"},
      { id: 2, title: "Google Map Streets", url: "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", subdomains:['mt0','mt1','mt2','mt3']},
      { id: 3, title: "Google Map Hybrid", url: "http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}", subdomains:['mt0','mt1','mt2','mt3']},
      { id: 4, title: "Google Map Satellite", url: "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", subdomains:['mt0','mt1','mt2','mt3']},
    ],
    url_image: null,
    componentKey: 0,
    zoom: 13,
    // center: latLng(47.41322, -1.219482),
    attribution: "",
    reuseTiles: true,
    updateWhenIdle: false,

    withPopup: latLng(47.41322, -1.219482),
    withTooltip: latLng(47.41422, -1.250482),
    currentZoom: 11.5,
    currentCenter: latLng(47.41322, -1.219482),
    showParagraph: false,
    mapOptions: {
      zoomSnap: 0.5,
      zoomControl: false,
    },
  }),
  methods: {
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_value);
    },
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
    },
    showLongText() {
      this.showParagraph = !this.showParagraph;
    },
    innerClick() {
      alert("Click!");
    },
    initMap() {
      this.$getLocation().then((coordinates) => {
        console.log(coordinates);
        this.currentCenter = latLng(coordinates.lat, coordinates.lng);
      });
    },
  },
  computed: {
    object_value() {
      return this.$store.getters.getData(this.widget.object_value);
    },
    center() {
      if (this.widget.object_value)
        return this.markerLatLng
      else
        return this.currentCenter
    },
    markerLatLng() {
      if (this.object_value.value != undefined) {
        var latlon = this.object_value.value.split(",");
        return latLng(parseFloat(latlon[0]), parseFloat(latlon[1]));
      }
      return [47.31322, -1.319482];
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
  },
  mounted() {
    this.initMap();
    setTimeout(() => {
    this.$refs.mymap.mapObject.invalidateSize()
    }, 100)
  },
};
</script>

<style>
</style>