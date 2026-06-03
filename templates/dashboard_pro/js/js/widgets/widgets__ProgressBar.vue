<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="level.value ? false : 'primary'">
    <v-list-item>
      <v-list-item-content class="pt-2">
        <v-list-item-subtitle
          v-if="widget.title"
          class="pa-0 justify-center"
        >{{widget.title}}</v-list-item-subtitle>
        <v-progress-linear
          :value="levelProc"
          :color="progress_color"
          height="25"
          :striped="widget.striped"
          :rounded="widget.rounded"
        >
          <strong v-if="level">{{widget.pre_info}}{{ level.value }}{{widget.pos_info}}</strong>
        </v-progress-linear>
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
            <v-col cols="12" class="py-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <select-objectproperty :label="$t('option.object_level')" v-model="widget.object_level" />
            </v-col>
            <v-row class="pl-3 pr-3">
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_min')" type="number" required v-model="widget.level_min"></v-text-field>
              </v-col>
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_max')" type="number" required v-model="widget.level_max"></v-text-field>
              </v-col>
            </v-row>
            <v-row class="pl-3 pr-3">
                <v-col class="py-0">
                  <v-text-field :label="$t('option.pre_info')"  v-model="widget.pre_info"></v-text-field>
                </v-col>
                <v-col class="py-0">
                  <v-text-field :label="$t('option.pos_info')"  v-model="widget.pos_info"></v-text-field>
                </v-col>
              </v-row>
            <v-col class="py-0">
              <v-switch v-model="widget.striped" :label="$t('widget.progressbar.striped')"></v-switch>
            </v-col>
            <v-col class="py-0">
              <v-switch v-model="widget.rounded" :label="$t('widget.progressbar.rounded')"></v-switch>
            </v-col>
             <v-col class="py-0">
              <select-color :id="widget.id+'_pb'" v-model="widget.color_progress" :title="$t('option.color')"></select-color>
            </v-col>
            <v-col class="py-0">
              <select-color :id="widget.id+'_bg'" v-model="widget.color"></select-color>
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
  name: "ProgressBar",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
  }),
  methods: {
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_level);
      if (this.widget.color_progress) {
         if (this.widget.color_progress.type == 'property') {
          this.$store.dispatch("requestData", this.widget.color_progress.object)
         }
      }
    },
  },
  computed: {
    level() {
      return this.$store.getters.getData(this.widget.object_level);
    },
    levelProc(){
      var min = 0
      var max = 100
      if (this.widget.level_min)
        min = this.widget.level_min
      if (this.widget.level_max)
        max = this.widget.level_max
      //x - ?
      //max-min  - 100
      if (this.level != undefined && this.level.value != undefined)
        return  Math.round( this.level.value * 100 / (max-min))
      return 100
    },
    progress_color() {
            let color = "primary"
            if (this.widget.color_progress) {
                if (this.widget.color_progress.type != 'default') {
                    if (this.widget.color_progress.color)
                        color = this.widget.color_progress.color
                    if (this.widget.color_progress.type == 'property') {
                        let obj_color = this.$store.getters.getData(this.widget.color_progress.object)
                        if (obj_color) {
                            if (obj_color.value != undefined)
                            {
                                color = obj_color.value
                                if (color[0]!="#")
                                  color ="#"+color.substr(0, 6)
                                else
                                  color =color.substr(0, 7)
                            }
                        }
                    }
                }
            }
            return color
        },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_level);
      if (this.widget.color_progress) {
         if (this.widget.color_progress.type == 'property') {
          this.$store.dispatch("requestData", this.widget.color_progress.object)
         }
      }
  },
};
</script>

<style>
</style>