<template>
  <div>
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="mt-16"
          v-bind="attrs"
          v-on="on"
          v-show="editEnable"
          color="primary"
          :disabled="limitWidgets"
          fixed
          right
          :top="btnPosition=='Top'"
          :bottom="btnPosition=='Bottom'"
          fab
          @click="dialog = true"
        >
          <v-icon>fas fa-plus</v-icon>
        </v-btn>
      </template>
      <span>{{$t('panel.add')}}</span>
    </v-tooltip>

<vue-flex-waterfall
      v-if="widgets"
      col="5"
      col-spacing="5"
      :break-at="breakAt"
      :break-by-container="true"
      style="align-content: center;"
    >
 <v-card
        v-for="(item,index) in widgets"
        :key="item.id"
        class="mt-1 mb-0"
        color="rgba(0,0,0,0)"
        :style="'width: '+width_widget+'px;'"
        min-height="30px"
      >
          <component
            :key="item.id"
            :is="`widget-${getType(item.type)}`"
            :ref="item.id"
            :widgetId="item.id"
            class="pa-0"
          ></component>
          <v-overlay
            absolute="absolute"
            :value="editEnable"
            opacity=0.2
            :z-index="0"
          >
            <v-avatar color="primary" size="24">
            {{item.i}}
            </v-avatar>
          </v-overlay>
          <v-btn-toggle id="buttons" class="pa-n5" v-show="editEnable" dense>
            <v-btn
              v-if="index!=0"
              min-width="24px"
              x-small
              @click="move(item.i,item.i-1)"
            >
              <v-icon x-small color="primary">fas fa-arrow-up</v-icon>
            </v-btn>
            <v-btn
              v-if="index!=widgets.length-1"
              min-width="24px"
              x-small
              @click="move(item.i,item.i+1)"
            >
              <v-icon x-small color="primary">fas fa-arrow-down</v-icon>
            </v-btn>
            <v-menu bottom left offset-y>
              <template v-slot:activator="{ on: menu, attrs }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn min-width="24px" x-small v-bind="attrs" v-on="{ ...tooltip, ...menu }">
                      <v-icon x-small color="primary">fas fa-bars</v-icon>
                    </v-btn>
                  </template>
                  <span>{{$t('panel.actions')}}</span>
                </v-tooltip>
              </template>
              <v-list>
                <v-list-item @click="openOptionWidget(item.id)">
                  <v-list-item-avatar  tile size=16>
                  <v-icon size=16 color="primary">fas fa-cog</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{$t('panel.options')}}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-menu bottom left>
                  <template v-slot:activator="{ on: menu, attrs }">
                    <v-list-item v-bind="attrs" v-on="{ ...menu }">
                      <v-list-item-avatar tile size=16>
                      <v-icon size=16 color="primary">fas fa-angle-double-right</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-title>{{$t('panel.change_panel')}}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-list>
                    <v-list-item v-for="(panel, i) in panels" :key="i" @click="moveToPanel(item,panel)">
                       <v-list-item-avatar tile size=16>
                        <v-img v-show="panel.image && !panel.icon" :src="panel.image"></v-img>
                        <v-icon v-show="panel.icon" size=16 color="primary">{{ panel.icon }}</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-title>{{ panel.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-menu v-if="item.type!='group'" bottom left>
                  <template v-slot:activator="{ on: menu, attrs }">
                    <v-list-item v-bind="attrs" v-on="{ ...menu }">
                      <v-list-item-avatar  tile size=16>
                        <v-icon size=16 color="primary">fas fa-layer-group</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-title>{{$t('panel.move_group')}}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-list>
                    <v-list-item v-for="(group, i) in groups" :key="i" @click="moveToGroup(item,group)">
                       <v-list-item-avatar  tile size=16>
                        <v-icon size=16 color="primary">fas fa-layer-group</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-title v-if="group.title">{{ group.title }}</v-list-item-title>
                      <v-list-item-title v-else>Group {{ group.id }}({{group.parent}})</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-list-item @click="copyWidget(item.id)">
                  <v-list-item-avatar tile size=16>
                    <v-icon size=16 color="primary">fas fa-copy</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{$t('panel.copy')}}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="exportWidget(item.id)">
                  <v-list-item-avatar tile size=16>
                    <v-icon size=16 color="primary">fas fa-file-import</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{$t('settings.export')}}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="delWidget(item.id)">
                  <v-list-item-avatar  tile size=16>
                  <v-icon size=16 color="primary">fas fa-trash</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{$t('panel.delete')}}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn-toggle>
      </v-card>
    </vue-flex-waterfall>

    <v-dialog v-model="dialog" scrollable max-width="500px">
      <v-card :color="dialog_color">
        <v-card-title>{{$t('panel.select')}}</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 500px;">
            <v-list-item
              two-line
              v-for="item in support_widgets"
              :key="item.name"
              @click="addWidget(item.type)"
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
          <v-btn color="primary" text @click="importWidget">
            <v-icon class="mr-1" size=16 color="primary">fas fa-file-export</v-icon>
            {{$t('settings.import')}}
          </v-btn>
          <input
                      ref="uploader"
                      class="d-none"
                      type="file"
                      @change="onFileChanged"
                    >
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog = false">{{$t('close')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import system_color from "../components/mixins/system_color.js";
import panel from "../components/mixins/panel.js";
import VueFlexWaterfall from 'vue-flex-waterfall';

export default {
  name: "Waterfall",
  mixins:[panel,system_color],
  components: {
    VueFlexWaterfall
  },
  data: () => ({
    dialog: false,
  }),
  methods: {
    move(from, to) {
      console.log("move",from,to,this.widgets[from].i ,this.widgets[to].i )
      var i = this.widgets[from].i
      this.widgets[from].i = this.widgets[to].i
      this.widgets[to].i = i
      this.$store.commit("updatePosWidgets", this.widgets);
    },
  },
  computed: {
    breakAt() {
      var obj = {};
      for (let i = 1; i <= 10; i++) {
        obj[this.width_widget * (i + 1) + 15 * i] = i;
      }
      return obj;
    },
    width_widget(){
      var w=200
        if (this.panel != undefined && this.panel.width_widget != undefined)
          w = this.panel.width_widget
        return w
    }
  },
  mounted() {},
};
</script>

<style>
#buttons {
  line-height: 12px;
  font-size: 8pt;
  font-family: tahoma;
  margin-top: 1px;
  margin-right: 2px;
  position: absolute;
  top: 0;
  right: 0;
}
</style>