<template>
  <v-card
    :height="parent_panel.type == 'panel'
        ? '100%'
        : widget.min_height
        ? widget.min_height
        : '150px'
    " :color="card_color" :flat="transparent" v-resize.initial:debounce="onResize" ref="tableBox">
    <v-card-title v-if="widget.title" class="pb-0 pt-1">
      <span class="ml-5">{{widget.title}}</span>
    </v-card-title>
    <v-btn-toggle id="buttonsLeft" class="pa-n5" dense>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" min-width="24px" x-small @click="update_data()">
            <v-icon x-small color="primary">fas fa-sync</v-icon>
          </v-btn>
        </template>
        <span>{{$t("widget.table.update_data")}}</span>
      </v-tooltip>
    </v-btn-toggle>
      <v-data-table
        :headers="widget.headers"
        :items="data"
        :items-per-page="15"
        class="elevation-1"
        :style="'background-color:rgba(0,0,0,0);  height:'+tableHeight+'px; overflow: auto;'"
        disable-pagination
        hide-default-footer
        dense
        :loading="loading"
        loading-text="Loading... Please wait"
      >
      <template v-slot:item="myprops">
        <tr @click="rowClick(myprops.item)">
        <td v-for="(header,index) in widget.headers"  :key="myprops.index+'_'+index"
        :class="('text-'+ header.align || 'start') + (header.divider ? ' v-data-table__divider':'')"
        >
        <div v-show="header.type=='string'">
          {{header.pre}}{{ myprops.item[header.value]}}{{header.pos}}
        </div>
        <div v-show="header.type=='checkbox'">
          <v-simple-checkbox
            :value="getBoolean(myprops.item[header.value])"
            disabled
          ></v-simple-checkbox>
        </div>
        <div v-show="header.type=='chip'">
          <v-chip
            small
            class="ma-2"
            :color="myprops.item[header.colorValue]"
          >
             {{header.pre}}{{ myprops.item[header.value]}}{{header.pos}}
          </v-chip>
        </div>
        <div v-show="header.type=='icon'">
          <v-icon
            small
            :color="myprops.item[header.colorValue]"
          >
             {{ myprops.item[header.value]}}
          </v-icon>
        </div>
        <div v-show="header.type=='progressbar'">
          <v-progress-linear
            :value="myprops.item[header.value]"
            :color="myprops.item[header.colorValue]"
            height="25"
            :striped="header.striped"
            :rounded="header.rounded"
          >
          <strong>{{header.pre}}{{ myprops.item[header.value]}}{{header.pos}}</strong>
        </v-progress-linear>
        </div>
        </td>
        </tr>
      </template>
      </v-data-table>

    <v-dialog persistent scrollable v-model="dialog" width="700">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
          <v-tabs v-model="tabOption" background-color="transparent">
              <v-tab :key="1">{{$t('option.general')}}</v-tab>
              <v-tab :key="2">{{$t('widget.table.columns')}}</v-tab>
              <v-tab :key="3">{{$t('option.advanced')}}</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabOption">
          <v-tab-item :key="1">
            <v-col class="pb-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <v-textarea v-model="widget.query" hide-details :label="$t('widget.table.query')" ></v-textarea>
            </v-col>
            <v-col class="pb-0">
              <v-text-field :label="$t('widget.table.timeout')" required v-model="widget.timeout"></v-text-field>
            </v-col>
          </v-tab-item>
           <v-tab-item :key="2">
             <v-row cols="12" class="pa-0 ma-1">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="addColumn()"
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
                      @click="upColumn()"
                    >
                      <v-icon>fas fa-angle-up</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("panel_dialog.up") }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="downColumn()"
                    >
                      <v-icon>fas fa-angle-down</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("panel_dialog.down") }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="delColumn()"
                    >
                      <v-icon>fas fa-minus</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("delete") }}</span>
                </v-tooltip>
                <v-spacer />
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      v-on="on"
                      fab
                      x-small
                      @click="autoColumn()"
                    >
                      <v-icon>fas fa-magic</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("widget.table.auto_columns") }}</span>
                </v-tooltip>
              </v-row>
             <v-tabs vertical class="my-tabs" v-model="tab" background-color="transparent">
                <v-tab v-for="(item, index) in widget.headers" :key="index">
                  {{ item.text ? item.text : (item.value ? item.value : $t("widget.table.column")) }}
                </v-tab>

                <v-tab-item v-for="(item, index) in widget.headers" :key="index">
                      <v-row class="px-3 mt-3">
                        <v-text-field x-small :label="$t('option.info')" hide-details v-model="item.text"></v-text-field>
                      </v-row>
                      <v-row class="px-3">
                        <v-text-field x-small :label="$t('widget.table.column')" hide-details v-model="item.value"></v-text-field>
                      </v-row>
                      <v-row class="px-3">
                        <v-select
                        v-model="item.align"
                        :items="alignTypes"
                        item-text="title"
                        item-value="name"
                        hide-details
                        :label="$t('widget.table.align')"
                      ></v-select>
                      </v-row>
                      <v-row class="px-3">
                        <v-text-field x-small :label="$t('widget.table.width')" hide-details v-model="item.width"></v-text-field>
                      </v-row>
                      <v-row class="px-3">
                        <v-switch v-model="item.sortable" :label="$t('widget.table.sortable')" hide-details></v-switch>
                      </v-row>
                      <v-row class="px-3">
                        <v-switch v-model="item.divider" :label="$t('widget.table.divider')" hide-details></v-switch>
                      </v-row>
                       <v-row class="px-3">
                        <v-select
                        v-model="item.type"
                        :items="valueTypes"
                        item-text="title"
                        item-value="name"
                        :hide-details="item.type!='checkbox'"
                        :label="$t('widget.table.types')"
                      ></v-select>
                      </v-row>
                      <v-row class="px-3" v-if="item.type=='string' || item.type=='chip' || item.type=='progressbar'">
                        <v-text-field x-small :label="$t('widget.table.pre')" hide-details v-model="item.pre"></v-text-field>
                        <v-text-field x-small :label="$t('widget.table.pos')" v-model="item.pos"></v-text-field>
                      </v-row>
                      <v-row class="px-3" v-if="item.type=='chip' || item.type=='icon' || item.type=='progressbar'">
                        <v-text-field x-small :label="$t('widget.table.colorValue')" v-model="item.colorValue"></v-text-field>
                      </v-row>
                      <v-row class="px-3" v-if="item.type=='progressbar'">
                        <v-switch v-model="item.striped" :label="$t('widget.progressbar.striped')"></v-switch>
                        <v-switch v-model="item.rounded" :label="$t('widget.progressbar.rounded')"></v-switch>
                      </v-row>
                </v-tab-item>
             </v-tabs>
           </v-tab-item>
           <v-tab-item :key="3">
            <v-col cols="12" class="pb-0">
                  <v-select
                    v-model="widget.callback_type"
                    :items="type"
                    item-text="title"
                    item-value="name"
                    :label="$t('option.type') +' callback'"
                  ></v-select>
            </v-col>
             <v-col cols="12" class="pb-0" v-if="widget.callback_type == 'property'">
              <select-objectproperty :label="$t('option.object_value')" v-model="widget.property" />
            </v-col>
            <v-col cols="12" class="pb-0" v-if="widget.callback_type == 'method'">
              <select-objectmethod :label="$t('select.method')" v-model="widget.method" />
            </v-col>
            <v-col cols="12" class="pb-0 pt-0" v-if="widget.callback_type == 'script'">
              <select-script :label="$t('select.script')" v-model="widget.script" />
            </v-col>
            <v-col class="py-0 pt-3">
              <select-color v-model="widget.color"></select-color>
            </v-col>
            <v-col class="py-0" v-if="parent_panel.type != 'panel'">
              <v-text-field
                :label="$t('widget.group.max_height')"
                v-model="widget.min_height"
              ></v-text-field>
            </v-col>
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
import axios from "axios"
import resize from "vue-resize-directive";
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "Table",
  mixins: [mixinWidget,colorWidget,system_color],
  components:{
  },
  directives: {
    resize,
  },
  data: () => ({
    interval:'',
    data: [],
    tableHeight:300,
    componentKey : 0,
    tabOption:0,
    tab:0,
    loading:true,
    type: [
      { title: "None", name: "none" },
      { title: "Property", name: "property" },
      { title: "Method", name: "method" },
      { title: "Script", name: "script" },
    ],
    alignTypes: [
      { title: "Left", name: "start" },
      { title: "Center", name: "center" },
      { title: "Right", name: "end" },
    ],
    valueTypes: [
      { title: "String", name: "string" },
      { title: "Checkbox", name: "checkbox" },
      { title: "Chip", name: "chip" },
      { title: "Icon", name: "icon" },
      { title: "Progressbar", name: "progressbar" },

    ],
    headers: [
          {
            text: 'TITLE',
            align: 'center',
            value: 'TITLE',
          },
          { text: 'DESCRIPTION', value: 'DESCRIPTION' },
          { text: 'ID', value: 'ID' },
        ],
  }),
  methods: {
    openOption() {
      if (!this.widget.headers) this.widget.headers = [];
      this.dialog = true;
    },
    closeDialog(){
      this.dialog = false
    },
    onResize() {
      var h = this.$refs.tableBox.$el.clientHeight;
      this.tableHeight = h-36
    },
    addColumn() {
      this.widget.headers.push({
        text: "",
        value: "",
        align: 'start',
        sortable: true,
      });
     },
    delColumn() {
      let index = this.tab
      this.widget.headers.splice(index, 1);
    },
    upColumn() {
      let index = this.tab
      if (index==0) return
      this.widget.headers.move(index,index-1)
      --this.tab
    },
    downColumn() {
      let index = this.tab
      if (index>= this.widget.headers.length-1) return
      this.widget.headers.move(index,index+1)
      ++this.tab
    },
    async autoColumn() {
      this.loading = true
      try {
            const response = await axios.get('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/query', {
                params: {
                    query: this.widget.query
                }
            });
            if (this.$store.state.debug) console.log(response.data)
            this.data = response.data.apiHandleResult
            if (this.data.length > 0)
            {
              this.widget.headers = []
              var rec = this.data[0]
              var cols = Object.keys(rec)
              cols.forEach(col => {
                this.widget.headers.push({
                    text: col,
                    value: col,
                    align: 'start',
                    type: 'string',
                    sortable: true,
                  });
              });

            }
        } catch (e) {
            console.log(e)
            this.data = []
        }
        this.loading = false
    },
    async update_data()
    {
      this.loading = true
      try {
            const response = await axios.get('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/query', {
                params: {
                    query: this.widget.query
                }
            });
            if (this.$store.state.debug) console.log(response.data)
            this.data = response.data.apiHandleResult
        } catch (e) {
            console.log(e)
            this.data = []
        }
        this.loading = false
    },
    getBoolean(value)
    {
      if (value == "true") return true
      if (value == 1) return true
      return false
    },
    rowClick: function (item) {
      if (this.$store.state.debug) console.log(item);
      if (this.widget.callback_type == "property")
      {
        var payload = { name: this.widget.property, value: JSON.stringify(item) };
        this.$store.dispatch("setGlobal", payload);
      }
      if (this.widget.callback_type == "method")
      {
        var method = { method: this.widget.method, value: item };
        this.$store.dispatch("runMethodParams", method);
      }
      if (this.widget.callback_type == "script")
      {
        var script = { script: this.widget.script, value: item };
        this.$store.dispatch("runScriptParams", script);
      }
    },
  },
  computed:{
  },
  created() {
    if (this.widget.timeout && this.widget.timeout>0)
      this.interval = setInterval(() => this.update_data(), this.widget.timeout * 1000);
    this.update_data()
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },

};
</script>

<style>
</style>