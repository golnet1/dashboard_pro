<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="level.value ? false : 'primary'">
    <v-list-item>
      <v-list-item-content class="pt-2">
        <v-list-item-subtitle
          v-if="level.value && widget.title"
          class="pa-0 justify-center"
        >{{widget.title}}: {{level.value}} {{widget.unit}}</v-list-item-subtitle>
        <v-slider
          v-if="widget.object_level"
          class="pa-0"
          :append-icon="widget.append_icon"
          :prepend-icon="widget.prepend_icon"
          :value="level.value"
          :min="widget.level_min"
          :max="widget.level_max"
          :step="widget.level_step"
          ticks="always"
          tick-size="2"
          :thumb-size="20"
          thumb-label
          hide-details
          @end="change_level"
          @click:append="upLevel()"
          @click:prepend="downLevel()"
        ></v-slider>
      </v-list-item-content>
    </v-list-item>
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
            <v-col cols="12" class="py-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
              <select-objectproperty :label="$t('option.object_level')" v-model="widget.object_level" />
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('option.unit')" required v-model="widget.unit"></v-text-field>
            </v-col>
            <v-col cols="12" class="py-0">
                <icon-input :label="$t('widget.slider.icon_left')" required v-model="widget.prepend_icon" :only_icon="true"></icon-input>
            </v-col>
            <v-col cols="12" class="py-0">
                <icon-input :label="$t('widget.slider.icon_right')" required v-model="widget.append_icon" :only_icon="true"></icon-input>
            </v-col>
            <v-row class="pl-3 pr-3">
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_min')" type="number" required v-model="widget.level_min"></v-text-field>
              </v-col>
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_max')" type="number" required v-model="widget.level_max"></v-text-field>
              </v-col>
              <v-col class="py-0">
                <v-text-field :label="$t('option.level_step')" type="number" required v-model="widget.level_step"></v-text-field>
              </v-col>
            </v-row>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
            </v-col>
            <v-col class="pa-0">
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
import aliveWidget from "../components/mixins/alive";
export default {
  name: "Slider",
  mixins: [mixinWidget,colorWidget,system_color,aliveWidget],
  data: () => ({
  }),
  methods: {
    change_level: function (level) {
      var payload = { name: this.widget.object_level, value: level }
      this.$store.commit("updateData",payload)
      this.$store.dispatch("setGlobal", payload)
    },
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_level);
    },
    check_level: function (level)
    {
      if (this.widget.level_min)
        {if (level < Number(this.widget.level_min)) return false;}
      else
        if (level < 0) return false;
      if (this.widget.level_max)
        {if (level > Number(this.widget.level_max)) return false;}
      else
        if (level > 100) return false;
      return true;
    },
    upLevel()
    {
      var step = this.widget.level_step
      if (!step) step = 1
      var level = Number(this.level.value)+Number(step);
      if (!this.check_level(level)) return;
      var payload = { name: this.widget.object_level, value: level };
      this.$store.dispatch("setGlobal", payload);
      this.level.value = level
    },
    downLevel()
    {
      var step = this.widget.level_step
      if (!step) step = 1
      var level = Number(this.level.value)-Number(step);
      if (!this.check_level(level)) return;
      var payload = { name: this.widget.object_level, value: level };
      this.$store.dispatch("setGlobal", payload);
      this.level.value = level
    }
  },
  computed: {
    level() {
      return this.$store.getters.getData(this.widget.object_level);
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_level);
  },
};
</script>

<style>
</style>