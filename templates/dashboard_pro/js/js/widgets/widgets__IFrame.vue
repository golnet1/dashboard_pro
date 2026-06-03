<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
   <v-row v-if="loading" class="fill-height ma-0" align="center" justify="center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>
    <div class="section section_dark ma-0 pa-1" style="height:100%; width:100%;">
    <vue-friendly-iframe  style="height:100%; width:100%;" :src="widget.url" @load="onLoad"></vue-friendly-iframe>
    </div>
    <v-overlay
          :absolute="absolute"
          :value="editEnable"
          opacity="0"
          :z-index="0"
        >
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-overlay>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('panel_dialog.url')" required v-model="widget.url"></v-text-field>
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
  name: "IFrame",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    loading: true,
  }),
  methods: {
    closeDialog()
    {
      this.dialog = false
      this.$store.dispatch("requestData", this.widget.object_value);
    },
    onLoad: function () {
      this.loading = false
    }
  },
  computed: {
    editEnable() {
      return this.$store.state.editEnable;
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
  },
};
</script>

<style>
</style>