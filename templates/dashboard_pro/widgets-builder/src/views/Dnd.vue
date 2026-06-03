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
          :top="btnPosition == 'Top'"
          :bottom="btnPosition == 'Bottom'"
          fab
          @click="$refs.widgetDialog.dialog = true"
        >
          <v-icon>fas fa-plus</v-icon>
        </v-btn>
      </template>
      <span>{{ $t("panel.add") }}</span>
    </v-tooltip>
    <v-flex fill-height>
      <dnd-grid-container
        :layout="widgets"
        :cellSize="cellSize"
        :maxColumnCount="maxColumnCount"
        :maxRowCount="maxRowCount"
        :margin="margin"
        :bubbleUp="vertical_compact"
        :dynamicResize="false"
        :nogrid="true"
        @drag:end="onLayoutPosUpdate"
        @resize:end="onLayoutSizeUpdate"
      >
        <dnd-grid-box
          v-for="item in widgets"
          :key="item.id"
          :boxId="item.id"
          :isDraggable="editEnable"
          :isResizable="editEnable"
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
            class="card-header"
            absolute="absolute"
            :value="editEnable"
            opacity="0.2"
            :z-index="0"
            style="cursor: move;"
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
                    <v-btn
                      min-width="24px"
                      x-small
                      v-bind="attrs"
                      v-on="{ ...tooltip, ...menu }"
                    >
                      <v-icon x-small color="primary">fas fa-bars</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t("panel.actions") }}</span>
                </v-tooltip>
              </template>
              <v-list>
                <v-list-item @click="openOptionWidget(item.id)">
                  <v-list-item-avatar tile size="16">
                    <v-icon size="16" color="primary">fas fa-cog</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{
                    $t("panel.options")
                  }}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-menu bottom left>
                  <template v-slot:activator="{ on: menu, attrs }">
                    <v-list-item v-bind="attrs" v-on="{ ...menu }">
                      <v-list-item-avatar tile size="16">
                        <v-icon size="16" color="primary"
                          >fas fa-angle-double-right</v-icon
                        >
                      </v-list-item-avatar>
                      <v-list-item-title>{{
                        $t("panel.change_panel")
                      }}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(panel, i) in panels"
                      :key="i"
                      @click="moveToPanel(item, panel)"
                    >
                      <v-list-item-avatar tile size="16">
                        <v-img
                          v-show="panel.image && !panel.icon"
                          :src="panel.image"
                        ></v-img>
                        <v-icon v-show="panel.icon" size="16" color="primary">{{
                          panel.icon
                        }}</v-icon>
                      </v-list-item-avatar>
                      <v-list-item-title>{{ panel.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-menu v-if="item.type != 'group'" bottom left>
                  <template v-slot:activator="{ on: menu, attrs }">
                    <v-list-item v-bind="attrs" v-on="{ ...menu }">
                      <v-list-item-avatar tile size="16">
                        <v-icon size="16" color="primary"
                          >fas fa-layer-group</v-icon
                        >
                      </v-list-item-avatar>
                      <v-list-item-title>{{
                        $t("panel.move_group")
                      }}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(group, i) in groups"
                      :key="i"
                      @click="moveToGroup(item, group)"
                    >
                      <v-list-item-avatar tile size="16">
                        <v-icon size="16" color="primary"
                          >fas fa-layer-group</v-icon
                        >
                      </v-list-item-avatar>
                      <v-list-item-title v-if="group.title">{{
                        group.title
                      }}</v-list-item-title>
                      <v-list-item-title v-else
                        >Group {{ group.id }}({{
                          group.parent
                        }})</v-list-item-title
                      >
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-list-item @click="copyWidget(item.id)">
                  <v-list-item-avatar tile size="16">
                    <v-icon size="16" color="primary">fas fa-copy</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{ $t("panel.copy") }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="exportWidget(item.id)">
                  <v-list-item-avatar tile size="16">
                    <v-icon size="16" color="primary"
                      >fas fa-file-import</v-icon
                    >
                  </v-list-item-avatar>
                  <v-list-item-title>{{
                    $t("settings.export")
                  }}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="delWidget(item.id)">
                  <v-list-item-avatar tile size="16">
                    <v-icon size="16" color="primary">fas fa-trash</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title>{{
                    $t("panel.delete")
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn-toggle>
        </dnd-grid-box>
      </dnd-grid-container>
    </v-flex>
    <AddWidgetDialog ref="widgetDialog" />
  </div>
</template>
<script>
import AddWidgetDialog from "../components/core/AddWidgetDialog.vue";
import system_color from "../components/mixins/system_color.js";
import panel from "../components/mixins/panel.js";
import { Container, Box } from "../components/dnd-grid";
export default {
  name: "Dnd",
  mixins: [panel, system_color],
  components: {
    AddWidgetDialog,
    DndGridContainer: Container,
    DndGridBox: Box,
  },
  data() {
    if (this.$store.state.debug) console.log(this.$route.params);
    return {
      cellSize: {
        w: 55,
        h: 67,
      },
      maxColumnCount: Infinity,
      maxRowCount: Infinity,
      bubbleUp: true,
      margin: 5,
    };
  },
  methods: {
    onLayoutPosUpdate(evt) {
      this.layout = evt.layout;
      if (this.$store.state.debug) console.log("update layout position", evt);
      this.$store.commit("updatePosWidgets", evt);
    },
    onLayoutSizeUpdate(evt) {
      this.layout = evt.layout;
      if (this.$store.state.debug) console.log("update layout size", evt);
      this.$store.commit("updateSizeWidgets", evt);
    },
  },
  watch: {
    sizeWidget(value) {
      this.cellSize.h = parseInt(value) + 65
    },
    width_cell(value) {
      this.cellSize.w = parseInt(value)
    },
  },
  computed: {
    mini() {
      return this.$store.state.mini;
    },
    sizeWidget() {
      return this.$store.state.sizeWidget;
    },
    width_cell(){
      var w=55
        if (this.panel != undefined && this.panel.width_cell)
          w = this.panel.width_cell
        return w
    },
    vertical_compact(){
      if (this.panel.skipDefault)
      {
        return this.panel.verticalCompact
      }
      return this.$store.state.vertical_compact
    },

  },
  mounted(){
    this.cellSize.w = this.width_cell
    this.cellSize.h = this.sizeWidget + 65
  }
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