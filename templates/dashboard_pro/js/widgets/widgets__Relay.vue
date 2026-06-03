<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :class="transparent ? 'ma-0' : ''" :loading="status.value ? false : 'primary'">
  <v-list-item v-if="widget.view_history" style="height: 100%;" @click="dialog_history=true">
      <v-list-item-action class="ma-0" @click.stop="switch_relay(1)">
      <resv-list-item-avatar v-if="widget.icon"
        :icon="widget.icon"
        :color="widget.background || !$vuetify.breakpoint.mdAndUp ? (status.value=='1' ? 'primary' : '') : ''"
        :background="widget.background || !$vuetify.breakpoint.mdAndUp"
        :round="widget.round"
        />
      </v-list-item-action>
      <v-list-item-content>
        <resv-list-item-title :value="widget.title"/>
        <resv-list-item-subtitle
         v-if="widget.object_info"
         :value="info.value"
         :info="true"
         :prefix="widget.pre_info"
         :posfix="widget.pos_info"/>
      </v-list-item-content>
      <v-switch
        v-if="status.value != undefined"
        v-model="status.value"
        false-value="0"
        true-value="1"
        @click.stop="switch_relay(0)"
      ></v-switch>
    </v-list-item>
    <v-list-item v-else style="height: 100%;">
      <v-list-item-action class="ma-0" @click.stop="switch_relay(1)">
      <resv-list-item-avatar v-if="widget.icon"
        :icon="widget.icon"
        :color="widget.background || !$vuetify.breakpoint.mdAndUp ? (status.value=='1' ? 'primary' : '') : ''"
        :background="widget.background || !$vuetify.breakpoint.mdAndUp"
        :round="widget.round"
        :size_avatar="20"
        />
      </v-list-item-action>
      <v-list-item-content>
        <resv-list-item-title :value="widget.title"/>
        <resv-list-item-subtitle
         v-if="widget.object_info"
         :value="info.value"
         :info="true"
         :prefix="widget.pre_info"
         :posfix="widget.pos_info"/>
      </v-list-item-content>
      <v-switch
        v-if="status.value != undefined"
        v-model="status.value"
        false-value="0"
        true-value="1"
        @click.stop="switch_relay(0)"
      ></v-switch>
    </v-list-item>
    <v-overlay
      absolute="absolute"
      :value="alive"
      color="red"
      :z-index="0"
    />
    <History v-model="dialog_history" :object_property="widget.object_value" :title="widget.title" :color="widget.history_color" step_graph :timelineItems="statuses"/>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-tabs v-model="tabOption" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('option.advanced')}}</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabOption">
            <v-tab-item :key="1">
              <v-col cols="12" class="pb-0">
                <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
              </v-col>
              <v-col cols="12" class="pb-0">
                <icon-input :label="$t('option.icon')" required v-model="widget.icon"></icon-input>
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectproperty :label="$t('option.object_status')" v-model="widget.object_value" />
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectmethod :label="$t('option.method_switch')" v-model="widget.object_switch" />
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectmethod :label="$t('option.method_on')" v-model="widget.object_on" />
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectmethod :label="$t('option.method_off')" v-model="widget.object_off" />
              </v-col>
            </v-tab-item>
            <v-tab-item :key="2">
              <v-col cols="12" class="pb-0">
                <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectproperty :label="$t('option.object_info')" v-model="widget.object_info" />
              </v-col>
              <v-row class="pl-3 pr-3">
                <v-col class="py-0">
                  <v-text-field :label="$t('option.pre_info')"  v-model="widget.pre_info"></v-text-field>
                </v-col>
                <v-col class="py-0">
                  <v-text-field :label="$t('option.pos_info')"  v-model="widget.pos_info"></v-text-field>
                </v-col>
              </v-row>
              <v-row class="pl-3 pr-3">
                <v-col class="py-0">
                  <v-switch v-model="widget.background" :label="$t('option.background')"></v-switch>
                </v-col>
                <v-col class="py-0">
                  <v-switch :disabled="!widget.background"  v-model="widget.round" :label="$t('option.round')"></v-switch>
                </v-col>
              </v-row>
              <v-col class="py-0">
                <select-color v-model="widget.color"></select-color>
              </v-col>
              <v-row class="pl-3 pr-3 mt-3">
              <v-col class="py-0">
                <v-switch v-model="widget.view_history" :label="$t('option.view_history')"></v-switch>
              </v-col>
              <v-col v-if="widget.view_history" class="pa-0">
                <color-input v-model="widget.history_color" view-input/>
              </v-col>
            </v-row>
            </v-tab-item>
            </v-tabs-items>
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
import aliveWidget from '../components/mixins/alive';
import infoWidget from '../components/mixins/info';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
import History from "../components/core/HistoryDialog";
export default {
  name: "Relay",
  mixins: [mixinWidget,aliveWidget,infoWidget,colorWidget,system_color],
  components:{
    History,
  },
  data: () => ({
    tabOption:0,
    dialog_history:false,
    statuses:[{title:"Off", status:"0",color:"red"},
    {title:"On", status:"1",color:"green"}]
  }),
  methods: {
    switch_relay: function (t) {
      if (this.widget.object_switch)
      {
        var method = this.widget.object_switch;
        this.$store.dispatch("runMethod", method);
      }
      else if (this.widget.object_on && this.widget.object_off)
      {
        if (this.status.value == 1)
          this.$store.dispatch("runMethod", this.widget.object_on);
        else
          this.$store.dispatch("runMethod", this.widget.object_off);
      }
      else
      {
        var state = this.status.value
        if (t == 1)
          state = state == "1" ? "0" : "1"
        var payload = { name: this.widget.object_value, value: state };
        this.$store.dispatch("setGlobal", payload);
      }

    },
    closeDialog()
    {
      this.dialog = false
      this.$store.dispatch("requestData", this.widget.object_value);
      this.$store.dispatch("requestData", this.widget.object_info);
      this.$store.dispatch("requestData", this.widget.object_alive);
    },
  },
  computed: {
    editEnable() {
      return this.$store.state.editEnable;
    },
    status() {
      return this.$store.getters.getData(this.widget.object_value);
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
    this.$store.dispatch("requestData", this.widget.object_info);
    this.$store.dispatch("requestData", this.widget.object_alive);
  },
};
</script>

<style>
</style>