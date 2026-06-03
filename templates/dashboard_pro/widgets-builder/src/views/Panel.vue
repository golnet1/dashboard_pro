<template>
  <div class="panel">
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
          @click="$refs.widgetDialog.dialog = true"
        >
          <v-icon>fas fa-plus</v-icon>
        </v-btn>
      </template>
      <span>{{$t('panel.add')}}</span>
    </v-tooltip>
    <v-flex fill-height>
      <grid-layout
        :layout.sync="widgets"
        :col-num="20"
        :cols="{lg:20, md: 15, sm: 8, xs: 6, xxs: 2 }"
        :rowHeight="height"
        :margin="[5, 5]"
        :is-draggable="editEnable"
        :is-resizable="editEnable"
        :use-css-transforms="true"
        :vertical-compact="vertical_compact"
        :prevent-collision="this.$store.state.prevent_collision"
        :responsive="this.$store.state.responsive"
        @layout-updated="layoutUpdatedEvent"
      >
        <grid-item
          v-for="item in widgets"
          :key="item.id"
          :x="parseInt(item.x)"
          :y="parseInt(item.y)"
          :w="parseInt(item.w)"
          :h="parseInt(item.h)"
          :i="parseInt(item.i)"
          :minW="parseInt(item.minw)"
          :minH="parseInt(item.minh)"
        >
          <component
            fluid
            fill-height
            :key="item.id"
            :is="`widget-${getType(item.type)}`"
            :ref="item.id"
            :widgetId="item.id"
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
        </grid-item>
      </grid-layout>
    </v-flex>
    <AddWidgetDialog ref="widgetDialog" />
  </div>
</template>
<script>
import AddWidgetDialog from "../components/core/AddWidgetDialog.vue";
import VueGridLayout from "vue-grid-layout";
import system_color from "../components/mixins/system_color.js";
import panel from "../components/mixins/panel.js";
export default {
  name: "Panel",
  mixins:[panel, system_color],
  components: {
    AddWidgetDialog,
    GridLayout: VueGridLayout.GridLayout,
    GridItem: VueGridLayout.GridItem,
  },
  data() {
    if (this.$store.state.debug) console.log(this.$route.params);
    return {
      
    };
  },
  methods: {
    layoutUpdatedEvent: function (newLayout) {
      if (this.$store.state.debug) console.log("Updated layout: ", newLayout);
      /* for (var i = 0; i < newLayout.length; i++) {
        var arr = [];
        arr.push({x: newLayout[i].x, y: newLayout[i].y, w: newLayout[i].w, h: newLayout[i].h});
        const data = JSON.stringify(arr)
        localStorage.setItem("device"+newLayout[i].id, data);
        console.log(JSON.parse(localStorage.getItem("device"+newLayout[i].id)))
      }*/
    },
  },
  computed: {
    mini(){
      return this.$store.state.mini
    },
    sizeWidget() {
      return this.$store.state.sizeWidget;
    },
    height() {
      return parseInt(this.sizeWidget) + 65;
    },
    vertical_compact(){
      if (this.panel.skipDefault)
      {
        return this.panel.verticalCompact
      }
      return this.$store.state.vertical_compact
    },
  },
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