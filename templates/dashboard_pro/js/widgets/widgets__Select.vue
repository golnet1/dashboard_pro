<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="status.value ? false : 'primary'">
    <v-list-item >
      <v-list-item-content class="pt-1 pb-0">
        <v-select
          v-model="select"
          :items="items"
          item-text="title"
          item-value="state"
          :label="widget.title"
          return-object
          :prepend-icon="widget.icon ? widget.icon : ''"
        >
          <template slot="selection" slot-scope="data">
            <v-icon v-if="data.item.icon" size="16" class="mr-3">{{ data.item.icon }}</v-icon>
            {{data.item.title}}
          </template>
          <template slot="item" slot-scope="data">
            <v-icon v-if="data.item.icon" size="16" class="mr-3">{{ data.item.icon }}</v-icon>
            {{data.item.title}}
          </template>
        </v-select>
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
        <v-card-text style="height: 600px;">
          <v-container class="pa-0">
            <v-tabs v-model="tabOption" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('option.statuses')}}</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabOption">
            <v-tab-item :key="1">
            <v-col cols="12" class="pa-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pa-0">
              <icon-input :label="$t('option.icon')" required v-model="widget.icon" :only_icon="true"></icon-input>
            </v-col>
            <v-col cols="12" class="pa-0">
              <select-objectproperty :label="$t('option.object_status')" v-model="widget.object_value" />
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_alive')" v-model="widget.object_alive" />
            </v-col>
            <v-col class="pa-0">
              <select-color v-model="widget.color"></select-color>
            </v-col>
            </v-tab-item>
            <v-tab-item :key="2">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, tooltip }">
                  <v-btn v-bind="tooltip" v-on="on" fab x-small @click="addItem()">
                    <v-icon>fas fa-plus</v-icon>
                  </v-btn>
                </template>
                <span>{{$t("add")}}</span>
              </v-tooltip>
              <div v-for="(item, index) in widget.items" :key="index">
              <v-row cols="12" class="pa-0 px-3">
                <v-col cols="2" class="pa-0">
                  <v-text-field x-small :label="$t('option.status')" required v-model="item.state"></v-text-field>
                </v-col>
                <v-col cols="9" class="pa-0">
                  <v-text-field x-small :label="$t('option.info')" required v-model="item.title"></v-text-field>
                </v-col>
                <v-col cols="1" class="pa-0 pt-3">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, tooltip }">
                      <v-btn v-bind="tooltip" v-on="on" fab x-small @click="delItem(index)">
                        <v-icon>fas fa-minus</v-icon>
                      </v-btn>
                    </template>
                    <span>{{$t("delete")}}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="11" class="pa-0 pl-3 pt-n3 pb-4">
                  <icon-input :label="$t('option.icon')" required v-model="item.icon" :only_icon="true"></icon-input>
                </v-col>
              </v-row>
              </div>
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
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
import aliveWidget from "../components/mixins/alive";
export default {
  name: "Select",
  mixins: [mixinWidget,colorWidget,system_color,aliveWidget],
  data: () => ({
    tabOption:0,
  }),
  methods: {
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_value);
    },
    addItem() {
      this.widget.items.push({
        state: "",
        title: "",
      });
    },
    delItem(index) {
      this.widget.items.splice(index, 1);
    },
  },
  computed: {
    status() {
      return this.$store.getters.getData(this.widget.object_value);
    },
    items() {
      return this.widget.items;
    },
    select: {
      get(){
      if (this.status)
      {
        console.log(this.status)
        var item = this.widget.items.find(t=>t.state == this.status.value)
        if (item)
          return item
        return {state:this.status.value,title:"Unknow state"};
      }
      return {state:0,title:"Unknow state"};
      },
      set(value)
      {
        var payload = { name: this.widget.object_value, value: value.state };
        this.$store.dispatch("setGlobal", payload);
      }
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
  },
};
</script>

<style>
</style>