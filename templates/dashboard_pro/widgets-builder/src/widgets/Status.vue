<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="status ? false : 'primary'">
    <div style="height: 100%;" v-if="status">
    <v-list-item style="height: 100%;" v-if="status.exec_type != 'empty'" @click="runMethod()">
      <resv-list-item-avatar v-if="status" :color="status.color" :icon="status.icon" :background="widget.background" :round="widget.round"/>
      <v-list-item-content>
        <resv-list-item-title v-if="status" :value="status.title ? status.title : widget.title" />
        <resv-list-item-subtitle
         :info="widget.object_info!=''"
         :value="widget.object_info ? info.value : widget.title"
         :prefix="widget.pre_info"
         :posfix="widget.pos_info"/>
      </v-list-item-content>
      <v-list-item-action v-if="widget.view_history" class="ma-0">
        <v-btn icon ripple @click.stop="dialog_history=true">
          <v-icon color="grey lighten-1">fas fa-history</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-list-item v-else style="height: 100%;">
        <resv-list-item-avatar v-if="status" :color="status.color" :icon="status.icon" :background="widget.background" :round="widget.round"/>
        <v-list-item-content>
          <resv-list-item-title v-if="status" :value="status.title ? status.title : widget.title" />
          <resv-list-item-subtitle
          :info="widget.object_info!=''"
          :value="widget.object_info ? info.value : widget.title"
          :prefix="widget.pre_info"
          :posfix="widget.pos_info"/>
      </v-list-item-content>
      <v-list-item-action v-if="widget.view_history" class="ma-0">
        <v-btn icon ripple @click.stop="dialog_history=true">
          <v-icon color="grey lighten-1">fas fa-history</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    </div>
    <v-list-item v-else style="height: 100%;">
        <resv-list-item-avatar icon="fas fa-question" :background="widget.background" :round="widget.round"/>
        <v-list-item-content>
          <resv-list-item-title :value="widget.title" />
      </v-list-item-content>
    </v-list-item>

    <v-overlay
      absolute="absolute"
      :value="alive"
      color="red"
      :z-index="0"
    >
    </v-overlay>
    <History v-model="dialog_history" :object_property="widget.object_status" :title="widget.title" :color="widget.history_color" step_graph :timelineItems="widget.statuses"/>
    <v-dialog persistent scrollable v-model="dialog" width="700">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{
            $t("option.title", [$t("widget." + widget.type + ".name")])
          }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0" :key="componentKey">
            <v-tabs v-model="tabOption" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('option.statuses')}}</v-tab>
              <v-tab :key="3">{{$t('option.advanced')}}</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tabOption">
              <v-tab-item :key="1">
              <v-col cols="12" class="pb-0">
                <v-text-field
                  :label="$t('option.name')"
                  required
                  v-model="widget.title"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="pb-0">
                <select-objectproperty
                  :label="$t('option.object_status')"
                  v-model="widget.object_status"
                />
              </v-col>
              </v-tab-item>
              <v-tab-item :key="2">
              <v-col cols="12" class="pa-0 mb-2">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="addStatus()"
                    >
                      <v-icon>fas fa-plus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("add") }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="delStatus()"
                    >
                      <v-icon>fas fa-minus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("delete") }}</span>
                </v-tooltip>
              </v-col>
              <v-tabs vertical class="my-tabs" v-model="tab" background-color="transparent">
                <v-tab v-for="(item, index) in widget.statuses" :key="index">
                  <icon-view class="mr-1" :color="item.color"
                    :value="item.icon"/>
                  {{ item.title ? item.title : (item.status ? item.status : $t("option.status")) }}
                </v-tab>

                <v-tab-item v-for="(item, index) in widget.statuses" :key="index">
                      <v-row class="px-3 pt-2">
                        <v-col cols="6" class="pa-0">
                          <v-text-field
                            x-small
                            :label="$t('option.status')"
                            required
                            v-model="item.status"
                            hint=">="
                          ></v-text-field>
                        </v-col>
                        <v-col cols="5" class="pa-0 px-1">
                          <v-text-field x-small required v-model="item.status2" hint="<"></v-text-field>
                        </v-col>
                        <v-col cols="1" class="pa-0 pt-3">
                          <color-input v-model="item.color" />
                        </v-col>
                      </v-row>
                      <v-row class="px-3">
                        <v-text-field x-small :label="$t('option.info')" required v-model="item.title"></v-text-field>
                      </v-row>
                      <v-col cols="12" class="pa-0">
                        <icon-input :label="$t('option.icon')" required v-model="item.icon"></icon-input>
                      </v-col>
                      <v-col cols="12" class="pa-0">
                    <v-select
                      v-model="item.exec_type"
                      :items="type"
                      item-text="title"
                      item-value="name"
                      :label="$t('option.action')"
                    ></v-select>
                    </v-col>
                    <v-col cols="12" class="pa-0" v-if="item.exec_type == 'method'">
                      <select-objectmethod :label="$t('select.method')" v-model="item.method" />
                    </v-col>
                    <v-col cols="12" class="pa-0" v-if="item.exec_type == 'script'">
                      <select-script :label="$t('select.script')" v-model="item.script" />
                    </v-col>
                    <v-col cols="12" class="pa-0" v-if="item.exec_type != 'empty'">
                      <v-text-field :label="$t('select.param')" v-model="item.exec_param" />
                    </v-col>
                </v-tab-item>
              </v-tabs>
            </v-tab-item>
            <v-tab-item :key="3">
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
          <v-btn color="primary" text @click="closeDialog()">{{
            $t("close")
          }}</v-btn>
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
var shortid = require("shortid");
export default {
  name: "Status",
  mixins: [mixinWidget,aliveWidget,infoWidget,colorWidget,system_color],
  components:{
    History,
  },
  data: () => ({
    componentKey: 1,
    tab:0,
    tabOption:0,
    type: [
      { title: "No action", name: "empty" },
      { title: "Script", name: "script" },
      { title: "Method", name: "method" },
    ],
    dialog_history:false,
  }),
methods: {
    openOption() {
      if (!this.widget.statuses) this.widget.statuses = [];
      this.dialog = true;
    },
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_status);
      this.$store.dispatch("requestData", this.widget.object_alive);
      this.$store.dispatch("requestData", this.widget.object_info);
    },
    addStatus() {
      var id = shortid.generate();
      this.widget.statuses.push({
        key: id,
        status: "",
        title: "",
        icon: "",
        exec_type:"empty",
        color: "#ffffff",
        method:"",
        script:"",
      });
      this.componentKey += 1;
     },
    delStatus() {
      let index = this.tab
      this.widget.statuses.splice(index, 1);
      this.componentKey += 1;
    },
    runMethod: function () {
      if (this.status.exec_type == "method" && this.status.exec_param=="")
        this.$store.dispatch("runMethod", this.status.method);
      else if (this.status.exec_type == "script" && this.status.exec_param=="")
        this.$store.dispatch("runScript", this.status.script);
      else if (this.status.exec_type == "method" && this.status.exec_param!="")
      {
        var method = { method: this.status.method, value: this.status.exec_param };
        this.$store.dispatch("runMethodParams", method);
      }
      else if (this.status.exec_type == "script" && this.status.exec_param!="")
      {
        var script = { script: this.status.script, value: this.status.exec_param };
        this.$store.dispatch("runScriptParams", script);
      }
    },
  },
  computed: {
    editEnable() {
      return this.$store.state.editEnable;
    },
    status_value() {
      return this.$store.getters.getData(this.widget.object_status);
    },
    status() {
      if (this.widget.object_status && this.status_value) {
        var item = this.widget.statuses.find(
          (t) => t.status == this.status_value.value ||
          (parseFloat(t.status) <= parseFloat(this.status_value.value) &&
           parseFloat(t.status2) >= parseFloat(this.status_value.value))
         );
         if (item != undefined)
            if (!('exec_type' in item)) item.exec_type = "empty"
         return item
      }
      return null;
    },
  },
  created() {
    this.type[0].title = this.$t('select.noaction')
    this.type[1].title = this.$t('select.script')
    this.type[2].title = this.$t('select.method')
    this.$store.dispatch("requestData", this.widget.object_status);
    this.$store.dispatch("requestData", this.widget.object_alive);
    this.$store.dispatch("requestData", this.widget.object_info);
  },
};
</script>

<style>
div.my-tabs [role="tab"] {
  justify-content: flex-start;
}
</style>