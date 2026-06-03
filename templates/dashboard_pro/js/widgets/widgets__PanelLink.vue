<template>
  <v-card v-resize.initial:debounce="onResize"  height="100%" link :to="panelLink" ref="panelLinkBox" id="info-box" :color="card_color" :flat="transparent">
    <v-img v-if="panel && widget.image" class="align-end" :src="widget.image" :height="imageHeight+'px'"/>
    <v-img v-if="panel && !widget.image" class="align-end" :src="panel.image" :height="imageHeight+'px'"/>
    <v-img v-if="!panel" class="align-end" src="/img/icon.png" aspect-ratio="1" contain :height="imageHeight+'px'"/>
    <v-list-item dense v-if="panel" class="pa-0 ma-0">
      <v-list-item-avatar v-show="panel.icon || widget.icon" class="ma-0">
        <v-icon v-if="widget.icon" small>{{ widget.icon }}</v-icon>
        <v-icon v-else small>{{ panel.icon }}</v-icon>
      </v-list-item-avatar>
      <v-list-item-content :class="(panel.icon || widget.icon) ? 'mt-0':'mt-0 pl-3'">
        <v-list-item-title v-if="widget.title" class="headline py-1">{{widget.title}}</v-list-item-title>
        <v-list-item-title v-else class="headline py-1">{{panel.title}}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-list-item dense v-if="!panel" class="pa-0 ma-0">
      <v-list-item-avatar class="ma-0">
        <v-icon small>fas fa-home</v-icon>
      </v-list-item-avatar>
      <v-list-item-content class="my-0">
        <v-list-item-title class="headline py-1">{{$t("views.home")}}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-select
                        v-model="widget.panel"
                        :items="panels"
                        item-text="title"
                        item-value="name"
                        :label="$t('panel_type.panel')"
              ></v-select>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <icon-input :label="$t('option.icon')" required v-model="widget.icon" :only_icon="true"></icon-input>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('option.image')" required v-model="widget.image"></v-text-field>
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
import resize from "vue-resize-directive";
export default {
  name: "PanelLink",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    imageHeight : 50,
  }),
  directives: {
    resize,
  },
  methods: {
    onResize() {
//      console.log("panelLinkBox height", this.$refs.panelLinkBox.$el.clientHeight)
      var h = this.$refs.panelLinkBox.$el.clientHeight;
      this.imageHeight = h-40
    },
  },
  computed: {
    panels(){
      const root = [{"title":this.$t("views.home"),"name":"root"}];
      const panels = this.$store.getters.allPanels
      const res = root.concat(panels);
      return res
    },
    panel(){
      return this.$store.getters.getPanelByName(this.widget.panel)
    },
    panelLink(){
      if (this.panel)
        return '/'+this.panel.type+'/'+this.panel.name
      return '/'
    },
  },
  created() {
  },
};
</script>

<style>
</style>