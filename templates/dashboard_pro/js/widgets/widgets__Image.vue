<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-img v-if="url_image" :key="componentKey" :src="url_image" aspect-ratio="1" contain height="100%" @click.native="show()">
      <template v-slot:placeholder>
        <v-row
          class="fill-height ma-0"
          align="center"
          justify="center"
        >
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-row>
      </template>
      <v-row align="end" class="lightbox pa-0 px-2 fill-height">
          <div class="ml-3 mb-n2 subheading">{{widget.title}}</div>
      </v-row>
    <img-viewer ref="viewer"/>
    </v-img>
    <v-overlay
      absolute="absolute"
      :value="alive"
      color="red"
      :z-index="0"
    >
    </v-overlay>
    <v-dialog persistent scrollable v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col class="pb-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('widget.image.url_image')" required v-model="widget.url"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_value')" v-model="widget.object_value" />
            </v-col>
            <v-col class="pb-0">
              <v-text-field :label="$t('widget.image.timeout')" required v-model="widget.timeout"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
            </v-col>
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
import ImgViewer from "../components/ImgViewer";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import aliveWidget from '../components/mixins/alive';
import system_color from "../components/mixins/system_color";
export default {
  name: "Image",
  mixins: [mixinWidget,colorWidget,aliveWidget,system_color],
  components:{
    ImgViewer,
  },
  data: () => ({
    url_image: null,
    componentKey : 0,
    interval:""
  }),
  methods: {
    closeDialog(){
      this.dialog = false
      this.$store.dispatch("requestData", this.widget.object_value);
      this.$store.dispatch("requestData", this.widget.object_alive);
      this.new_url()
    },
    show() {
      var images = [{source: this.url_image}];
      this.$refs.viewer.show(
        images,0
      );
    },
    new_url(){
      this.url_image = "/img/Image.png"
      this.componentKey  += 1
      var path_img = this.widget.url
      if (this.img_value)
      {
        if (path_img)
        {
          path_img = path_img.format(this.img_value)
        }
        else
          path_img = this.img_value
      }
      if (path_img == "")
        return

      if (this.widget.timeout && this.widget.timeout > 0)
      {
        if (path_img.includes("?"))
          this.url_image = path_img+ "&ts=" + Math.floor(Date.now() / 1000);
        else
          this.url_image = path_img + "?ts=" + Math.floor(Date.now() / 1000);
      }
      else
        this.url_image = path_img
    }
  },
  computed:{
    valueObj: {
      get()
      {
        return this.$store.getters.getData(this.widget.object_value)
      }
    },
    img_value() {
      if (!this.widget.object_value) return null
      return this.$store.getters.getData(this.widget.object_value).value
    },
  },
  watch: {
    img_value: function(newValue,oldValue){
      console.log(newValue,oldValue)
      this.new_url()
    }
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value)
    this.$store.dispatch("requestData", this.widget.object_alive);
    if (this.widget.timeout && this.widget.timeout>0)
      this.interval = setInterval(() => this.new_url(), this.widget.timeout * 1000);
    this.new_url()
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
};
</script>

<style>
</style>