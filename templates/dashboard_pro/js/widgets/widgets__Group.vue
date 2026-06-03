<template>
  <v-card :height="parent_panel.type == 'panel' ? '100%':''" :max-height="parent_panel.type == 'panel' ? '': widget.max_height" :color="card_color" class="overflow-y-auto">
    <div v-if="widget.title" class="ml-3 mb-n2 subheading">{{widget.title}}</div>
    <div v-for="(item,index) in widget.items" :key="item.id">
      <component
            fill-height
            transparent
            :key="item.id"
            :is="`widget-${getType(item.type)}`"
            :ref="item.id"
            :widgetId="item.id"
      ></component>
      <v-divider v-if="index!=(widget.items.length-1) && widget.dividers"/>
    </div>
    <v-dialog persistent scrollable v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
          <v-tabs v-model="tabOption" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('widget.group.widgets')}}</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabOption">
          <v-tab-item :key="1">
            <v-col class="py-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col class="py-0">
              <v-switch v-model="widget.dividers" :label="$t('widget.group.dividers')"></v-switch>
            </v-col>
            <v-col class="py-0" v-if="parent_panel.type != 'panel'">
              <v-text-field :label="$t('widget.group.max_height')" v-model="widget.max_height"></v-text-field>
            </v-col>
            <v-col class="py-0">
              <select-color v-model="widget.color"></select-color>
            </v-col>
          </v-tab-item>
          <v-tab-item :key="2">
                <v-btn
                  color="primary"
                  dark
                  class = "mt-1"
                  @click="dialogAdd = true"
                >
                  {{$t('add')}}
                </v-btn>
    <draggable :options="options" v-model="widget.items">
      <v-list-item two-line v-for="(item, index) in widget.items" :key="index" class="mt-1 mx-auto">
      <v-list-item-avatar tile style="cursor:move;">
        <img v-if="getWidgetInfo(item.type).type != 'unknown'" size="8" :src="getWidgetInfo(item.type).icon" />
        <v-icon v-if="getWidgetInfo(item.type).type == 'unknown'">{{getWidgetInfo(item.type).icon}}</v-icon>
      </v-list-item-avatar>
      <v-list-item-content style="cursor:move;">
        <resv-list-item-title :value="getWidgetOption(item.id).title ? getWidgetOption(item.id).title : $t('widget.'+getWidgetInfo(item.type).type+'.name')" />
        <resv-list-item-subtitle v-if="getWidgetOption(item.id).title" :value="$t('widget.'+getWidgetInfo(item.type).type+'.name')" />
      </v-list-item-content>
      <v-list-item-action>
        <div>
        <v-btn icon ripple @click="openOptionWidget(item.id)">
          <v-icon color="grey lighten-1">fas fa-cog</v-icon>
        </v-btn>
        <v-btn icon ripple @click="moveItem(index)">
          <v-icon color="grey lighten-1">fas fa-external-link-alt</v-icon>
        </v-btn>
        <v-btn icon ripple @click.stop="delItem(index)">
          <v-icon color="grey lighten-1">far fa-trash-alt</v-icon>
        </v-btn>
        </div>
      </v-list-item-action>
      </v-list-item>
    </draggable>
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
    <v-dialog v-model="dialogAdd" scrollable max-width="500px">
      <v-card :color="dialog_color">
        <v-card-title>{{$t('panel.select')}}</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 500px;">
            <v-list-item
              two-line
              v-for="item in support_widgets"
              :key="item.name"
              @click="addItem(item.type)"
            >
              <v-list-item-avatar tile>
                <img v-show="item.icon" :src="item.icon" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{$t("widget."+item.type+".name")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("widget."+item.type+".info")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialogAdd = false">{{$t('close')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import WidgetsList from "../widgets/widgets.js";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import draggable from "vuedraggable";
import systemColor from '../components/mixins/system_color';
var shortid = require("shortid")
export default {
  name: "Group",
  mixins: [mixinWidget,colorWidget,systemColor],
  components: {
    draggable,
  },
  data: () => ({
    tabOption:0,
    dialogAdd:false,
  }),
  methods: {
    openOption() {
      if (!this.widget.items) this.widget.items = [];
      this.dialog = true;
    },
    closeDialog(){
      this.dialog = false
      this.dialogAdd = false
    },
    addItem(type) {
      this.dialogAdd = false
      var support_widget = this.support_widgets.find((t) => t.type == type);
      var id = shortid.generate();
      var widget = {
        id: id,
        type: type,
        parent: this.widget.id,
      };
      if (support_widget.options)
      {
        let options = JSON.parse(JSON.stringify(support_widget.options));
        for (const [key, value] of Object.entries(options)) {
          widget[key]=value;
        }
      }
      if (this.$store.state.debug) console.log("add widget", widget)
      this.$store.commit("addWidget", widget);
      this.widget.items.push({
        id:id,
        type:type,
      }
      );
     },
    delItem: async function (index) {
      const res = await this.$confirm(this.$t("panel.confirm") , {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning") })
      if (res) {
        this.$store.commit("delWidget", this.widget.items[index].id);
        this.widget.items.splice(index, 1);
      }
    },
    moveItem: async function (index) {
      const res = await this.$confirm(this.$t("panel.confirm_move") , {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning") })
      if (res) {
        var widgetSrc = this.$store.getters.getWidgetById(this.widget.items[index].id)
        var widget = JSON.parse(JSON.stringify(widgetSrc));
        var widgets = this.$store.getters.getWidgetsByPanel(this.widget.parent)
        var max = {y:0,h:0};
        if (widgets.length > 0) {
          max = widgets.reduce(function (prev, current) {
            return prev.y > current.y ? prev : current;
          });
        }
        console.log("max",max)
        var posx = 0;
        var posy = max.y + max.h;
        var id = shortid.generate();
        widget.id = id;
        widget.x = posx;
        widget.y = posy;
        var support_widget = this.support_widgets.find((t) => t.type == widget.type);
        if (!widget.w)
          widget.w= support_widget.w
        if (!widget.h)
          widget.h= support_widget.h
        widget.i = widgets.length + 1;
        widget.parent = this.widget.parent
        console.log("move",widget)
        this.$store.commit("addWidget", widget);
        //del from group
        this.widget.items.splice(index, 1);
        this.$store.commit("delWidget", widgetSrc.id);
      }
    },
    getType(type){
      if(this.support_widgets.find(t=>t.type == type))
        return type
      return "unknown"
    },
    getWidgetInfo(type){
      var widget_info = this.support_widgets.find(t=>t.type == type)
      if (widget_info)
        return widget_info
      widget_info = {name:"Unknow", type:"unknown",icon:"fas fa-question"}
      return widget_info
    },
    getWidgetOption(id){
        return this.$store.getters.getWidgetById(id);
    },
    openOptionWidget(name) {
      var widget = this.$refs[name][0];
      if (this.$store.state.debug) console.log(widget);
      widget.openOption();
    },
  },
  computed:{
    support_widgets() {
      var listWidget = WidgetsList.all_widgets.filter((t) =>
        t.limit.includes(process.env.VUE_APP_TYPE)
      );
      if (this.$store.state.debug) return listWidget;
      return listWidget.filter((t) => !t.debug);
    },
    options () {
      return {
        disabled: false
      }
    },
    editEnable() {
      return this.$store.state.editEnable;
    },
  },
  created() {
  }
};
</script>

<style>
</style>