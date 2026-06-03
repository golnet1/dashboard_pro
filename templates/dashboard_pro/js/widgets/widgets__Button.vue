<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-btn
    width="100%"
    height="100%"
    :style="'font-size:'+fontSize +'rem; background-color: #00000000;'"
    @click="runMethod()">
      <icon-view :size="size_avatar" class="mr-0" :value="widget.icon"/>
      {{widget.title}}
    </v-btn>
    <v-overlay
      absolute="absolute"
      :value="alive"
      color="red"
      :z-index="0"
    />
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
              <icon-input :label="$t('option.icon')" required v-model="widget.icon"></icon-input>
            </v-col>
            <v-col cols="12" class="pb-0">
                  <v-select
                    v-model="widget.button_type"
                    :items="type"
                    item-text="title"
                    item-value="name"
                    :label="$t('option.type')"
                  ></v-select>
            </v-col>
            <v-col cols="12" class="pb-0" v-if="widget.button_type == 'method'">
              <select-objectmethod :label="$t('select.method')" v-model="widget.method" />
            </v-col>
            <v-col cols="12" class="pb-0" v-if="widget.button_type == 'script'">
              <select-script :label="$t('select.script')" v-model="widget.script" />
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
            </v-col>
            <v-col class="pb-0">
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
import aliveWidget from "../components/mixins/alive";
export default {
  name: "Button",
  mixins: [mixinWidget,colorWidget,system_color,aliveWidget],
  data: () => ({
    type: [
      { title: "Script", name: "script" },
      { title: "Method", name: "method" },
    ],
  }),

  methods: {
    runMethod: function () {
      if (this.widget.button_type == "method")
        this.$store.dispatch("runMethod", this.widget.method);
      else
        this.$store.dispatch("runScript", this.widget.script);
    },
  },
  computed: {
    settingFontSize(){
        return (this.$store.state.fontSizeTitle) / 100;
    },
    fontSize() {
      return this.settingFontSize + 1;
    },
    settingIconSize(){
        return this.$store.state.iconSizeWidget;
    },
    size_avatar() {
      return this.settingIconSize + 40;
    },
  },
  created() {
    this.type[0].title = this.$t('select.script')
    this.type[1].title = this.$t('select.method')
  },
};
</script>

<style>
</style>