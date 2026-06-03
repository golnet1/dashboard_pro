<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="text_value.value || widget.object_value==undefined  ? false : 'primary'">
    <v-list-item v-if="widget.title || widget.icon" class="px-0 px-xs-n1 px-md-1 px-lg-3 px-xl-3">
      <resv-list-item-avatar v-if="widget.icon" :icon="widget.icon"/>
      <v-list-item-content v-if="widget.title" class="py-0 py-md-2 py-lg-3 py-xl-3">
        <resv-list-item-title :value="widget.title"/>
      </v-list-item-content>
    </v-list-item>
    <v-list-item class="px-1 px-md-1 px-lg-2 px-xl-3">
        <div class="my-n1 pb-2" height="100%" v-if="text_value.value" :style="'font-size:'+fontSize +'rem'" v-html="formatedText" />
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
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <icon-input :label="$t('option.icon')"  required v-model="widget.icon"></icon-input>
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_value')" v-model="widget.object_value" />
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
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "Text",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
  }),
  methods: {
    closeDialog()
    {
      this.dialog = false
      this.$store.dispatch("requestData", this.widget.object_value);
    },
  },
  computed: {
    text_value() {
      return this.$store.getters.getData(this.widget.object_value);
    },
    formatedText() {
      if (this.text_value.value)
        return this.text_value.value.replace(/\n/g, "<br />");
      return ""
    },
    settingFontSize(){
        return (this.$store.state.fontSizeSubtitle) / 100;
    },
    responsiveWidget() {
        return this.$store.state.responsiveWidget;
    },
    fontSize() {
      if (this.responsiveWidget)
        switch (this.$vuetify.breakpoint.name) {
          case 'xs': return this.settingFontSize + 0.5
          case 'sm': return this.settingFontSize + 0.6
          case 'md': return this.settingFontSize + 0.7
          case 'lg': return this.settingFontSize + 0.8
          case 'xl': return this.settingFontSize + 0.9
        }
      return this.settingFontSize +1;
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
  },
};
</script>

<style>
</style>