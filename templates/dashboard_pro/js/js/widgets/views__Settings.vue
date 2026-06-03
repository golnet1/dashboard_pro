<template>
  <div class="settings">
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          v-show="debug"
          color="primary"
          fixed
          right
          bottom
          fab
          to="/system"
        >
          <v-icon>fa fa-cog</v-icon>
        </v-btn>
      </template>
      <span>{{$t("views.system")}}</span>
    </v-tooltip>
    <v-row>
      <v-col dense lg="4" cols="sm" class="pb-2">
        <v-card :color="system_color">
          <v-list color="transparent">
            <v-list-item>
              <v-select v-model="default_panel"
                item-text="title"
                item-value="name"
                :items="panels"
                :label="$t('settings.default_panel')"></v-select>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.panel_options")}}</v-subheader>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="prevent_collision"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.prevent_collision")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.prevent_collision_info")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="responsive"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.responsive")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.responsive_info")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="vertical_compact"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.vertical_compact")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.vertical_compact_info")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-select v-model="btnPosition" :items="btnPositions" :label="$t('settings.position_button')"></v-select>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.update_data")}}</v-subheader>
            <v-list-item>
              <v-list-item-content>
                <v-text-field
                  :label="$t('settings.timeout_label')"
                  :hint="$t('settings.timeout_hint')"
                  type="number"
                  required
                  v-model="timeoutUpdate"
                ></v-text-field>
              </v-list-item-content>
            </v-list-item>
             <v-list-item>
              <v-list-item-action>
                <v-switch v-model="forceUpdate"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.force_update_label")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.force_update_hint")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.system")}}</v-subheader>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="debug"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.debug")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.debug_info")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.statistics")}}</v-subheader>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.count_panels")}}: {{ count_panels }}</v-list-item-title>
                <v-list-item-title>{{$t("settings.count_widgets")}}: {{ count_widgets }}</v-list-item-title>
                <v-list-item-title>{{$t("settings.count_data")}}: {{ count_datas }}</v-list-item-title>
                <v-list-item-title>
                  Websoket traffic:
                  <i class="fas fa-upload" style="color:orange"></i>
                  {{ ws_state.sendBytes | prettyBytes }}/
                  <i
                    class="fas fa-download"
                    style="color:lime"
                  ></i>
                  {{ ws_state.recvBytes | prettyBytes }}
                  <br />
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent" class="pb-4">
            <v-subheader>Donate</v-subheader>
            <v-list-item>
              <v-spacer/><YooMoney/>
              <v-spacer/><BuyMeACoffee />
              <v-spacer/>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col lg="4" cols="sm" class="pb-2">
        <v-card v-show="mode == 'pro'" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.customization")}}</v-subheader>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="hideMenu"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.hide_menu")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.hide_menu_hint")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-text-field
                  :label="$t('settings.img_menu')"
                  :hint="$t('settings.img_menu_hint')"
                  persistent-hint
                  type="text"
                  required
                  v-model="backgroundMenu"
                ></v-text-field>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-text-field
                  :label="$t('settings.img_panel')"
                  :hint="$t('settings.img_panel_hint')"
                  persistent-hint
                  type="text"
                  required
                  v-model="backgroundPanel"
                ></v-text-field>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="useBackgroundPanel"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.use_panel_img")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.use_panel_img_hint")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="useBackgroundBar"></v-switch>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{$t("settings.use_bar_img")}}</v-list-item-title>
                <v-list-item-subtitle>{{$t("settings.use_bar_img_hint")}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.transparent_card")}}</v-list-item-title>
                <v-slider
                  v-model="transparent_card"
                  class="align-center"
                  max=100
                  min=0
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.transparent_control")}}</v-list-item-title>
                <v-slider
                  v-model="transparent_control"
                  class="align-center"
                  max=100
                  min=0
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.transparent_dialog")}}</v-list-item-title>
                <v-slider
                  v-model="transparent_dialog"
                  class="align-center"
                  max=100
                  min=0
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                {{$t("settings.primary_color")}}<color-input v-model="colorPrimary" viewInput/>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                {{$t("settings.light_color")}}<color-input v-model="colorLight" viewInput/>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                {{$t("settings.dark_color")}}
                <color-input v-model="colorDark" viewInput/>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col lg="4" cols="sm" class="pb-2">
        <v-card v-show="mode == 'pro'" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.style_widgets")}}</v-subheader>
            <v-card class="ma-4" color="primary" :height="height_widget">
              <v-list-item style="height: 100%;">
                <resv-list-item-avatar icon="fas fa-bolt" color="warning" round/>
              <v-list-item-content>
                <resv-list-item-title class="mb-2" :value='$t("settings.font_size_title")' />
                <resv-list-item-subtitle class="mb-2" :value='$t("settings.font_size_subtitle")' />
              </v-list-item-content>
              </v-list-item>
            </v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.icon_size_widget")}}</v-list-item-title>
                <v-slider
                  v-model="icon_size_widget"
                  class="align-center_title"
                  max=40
                  min=-40
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2" >{{$t("settings.font_size_title")}}</v-list-item-title>
                <v-slider
                  v-model="font_size_title"
                  class="align-center_title"
                  max=100
                  min=-100
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.font_size_subtitle")}}</v-list-item-title>
                <v-slider
                  v-model="font_size_subtitle"
                  class="align-center_title"
                  max=100
                  min=-100
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="mb-2">{{$t("settings.size_widget")}}</v-list-item-title>
                <v-slider
                  v-model="size_widget"
                  class="align-center_title"
                  max=40
                  min=-40
                  hide-details
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" v-show="mode == 'pro'" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.tools")}}</v-subheader>
            <v-list-item>
              <v-list-item-action>
                <v-btn color="success" to="/wizard">
                  <v-icon left>fas fa-magic</v-icon>{{$t("settings.wizard")}}
                </v-btn>
              </v-list-item-action>
              <v-list-item-content>{{$t("settings.wizard_hint")}}</v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-btn @click="cleanWrongParent()">{{$t("settings.clean")}}</v-btn>
              </v-list-item-action>
              <v-list-item-content>{{$t("settings.clean_hint")}}</v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-btn color="error" @click="resetConfig()">
                  <v-icon left>fas fa-trash-alt</v-icon>{{$t("settings.reset")}}
                </v-btn>
              </v-list-item-action>
              <v-list-item-content>{{$t("settings.reset_hint")}}</v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card class="mt-2" :color="system_color">
          <v-list subheader color="transparent">
            <v-subheader>{{$t("settings.import_export")}}</v-subheader>
            <v-list-item>
            <v-menu bottom left>
              <template v-slot:activator="{ on: menu, attrs }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn v-bind="attrs" v-on="{ ...tooltip, ...menu }">
                      <v-icon left>fas fa-file-export</v-icon>
                      {{$t('settings.export')}}
                    </v-btn>
                  </template>
                  <span>{{$t('settings.export_hint')}}</span>
                </v-tooltip>
              </template>
              <v-list>
                <v-list-item v-for="(panel, i) in only_panels" :key="i" @click="exportPanel(panel)">
                  <v-list-item-title >{{ panel.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn class="ml-2" @click="importPanel" v-bind="attrs" v-on="on">
                      <v-icon left>fas fa-file-import</v-icon>
                      {{$t('settings.import')}}
                    </v-btn>
                    <input
                      ref="uploader"
                      class="d-none"
                      type="file"
                      @change="onFileChanged"
                    >
                  </template>
                  <span>{{$t('settings.import_hint')}}</span>
                </v-tooltip>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import systemColor from '../components/mixins/system_color';
import BuyMeACoffee from '../components/BuyMeACoffee.vue'
import YooMoney from '../components/YooMoney.vue'
export default {
  mixins: [systemColor],
  components: {BuyMeACoffee,YooMoney},
  data: () => ({
    mode: process.env.VUE_APP_TYPE,
    btnPositions: ["Top","Bottom"],
  }),
  created() {
    //this.btnPositions[0]=this.$t("settings.top")
    //this.btnPositions[1]=this.$t("settings.bottom")
  },
  methods: {
    async resetConfig() {
      const res = await this.$confirm(
        this.$t("settings.reset_confirm"),
        {
          buttonTrueText: this.$t("yes"),
          buttonFalseText: this.$t("no"),
          color: "error",
          title: this.$t("warning"),
        }
      );
      if (res) {
        this.$store.commit("resetPanels");
        this.$store.commit("resetWidgets");
        this.$store.commit("resetData");
        this.$store.dispatch("viewNotify", {text:"Reset panels and widgets"});
      }
    },
    cleanWrongParent() {
      var panels = this.$store.getters.allPanels;
      var widgets = this.$store.getters.allWidgets;
      var count = 0;
      widgets.forEach((element) => {
        if (!panels.find((t) => t.name == element.parent) && !widgets.find((t) => t.id == element.parent)) {
          this.$store.commit("delWidget", element.id);
          ++count;
        }
      });
      this.$store.dispatch(
        "viewNotify",
        {text:"Delete widgets without panel (count:" + count + ")"}
      );
    },
    exportPanel(panel)
    {
      //console.log(panel)
      let panel_export =  { panel: panel, widgets: this.$store.getters.getWidgetsByPanel(panel.name)}
      //add widgets from groups
      var childs_group = []
      panel_export.widgets.forEach(widget => {
        if (widget.type == "group"){
          var childs = this.$store.getters.getWidgetsByPanel(widget.id)
          childs.forEach(el => {
            childs_group.push(el)
          })
        }
      });
      childs_group.forEach(el => {
        panel_export.widgets.push(el)
      })
      //save file
      let filename = panel.title
      const data = JSON.stringify(panel_export)
       let blob = new Blob([data], { type: 'application/json;charset=utf-8;' })
        if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, filename)
        } else {
        let link = document.createElement('a')
        if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          let url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', filename)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    },
    importPanel(){
      //open file
      this.isSelecting = true
      window.addEventListener('focus', () => {
        this.isSelecting = false
      }, { once: true })

      this.$refs.uploader.click()
    },
    onFileChanged(e) {
      // do something
      let file = e.target.files[0];
      if(!file || file.type !== 'application/json') return;

      let reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload =  evt => {
        console.log(evt.target.result);
        var panel_import = JSON.parse(evt.target.result)
        this.$store.commit("addPanel", panel_import.panel)
        panel_import.widgets.forEach(widget => {
          this.$store.commit("addWidget", widget)
        });
      }
      reader.onerror = evt => {
        console.error(evt);
      }
    }

  },
  computed: {
    btnPosition: {
      get() {
        return this.$store.state.addBtnPosition;
      },
      set(value) {
        this.$store.state.addBtnPosition = value;
      },
    },
    timeoutUpdate: {
      get() {
        return this.$store.state.timeoutUpdate;
      },
      set(value) {
        this.$store.state.timeoutUpdate = value;
      },
    },
    forceUpdate: {
      get() {
        return this.$store.state.forceUpdate;
      },
      set(value) {
        this.$store.state.forceUpdate = value;
      },
    },
    debug: {
      get() {
        return this.$store.state.debug;
      },
      set(value) {
        this.$store.state.debug = value;
      },
    },
    prevent_collision: {
      get() {
        return this.$store.state.prevent_collision;
      },
      set(value) {
        this.$store.state.prevent_collision = value;
      },
    },
    responsive: {
      get() {
        return this.$store.state.responsive;
      },
      set(value) {
        this.$store.state.responsive = value;
      },
    },
    vertical_compact: {
      get() {
        return this.$store.state.vertical_compact;
      },
      set(value) {
        this.$store.state.vertical_compact = value;
      },
    },
    hideMenu: {
      get() {
        return this.$store.state.hideMenu;
      },
      set(value) {
        this.$store.state.hideMenu = value;
      },
    },
    useBackgroundPanel: {
      get() {
        return this.$store.state.useBackgroundPanel;
      },
      set(value) {
        this.$store.state.useBackgroundPanel = value;
      },
    },
    useBackgroundBar: {
      get() {
        return this.$store.state.useBackgroundBar;
      },
      set(value) {
        this.$store.state.useBackgroundBar = value;
      },
    },
    backgroundPanel: {
      get() {
        return this.$store.state.backgroundPanel;
      },
      set(value) {
        this.$store.state.backgroundPanel = value;
      },
    },
    backgroundMenu: {
      get() {
        return this.$store.state.backgroundMenu;
      },
      set(value) {
        this.$store.state.backgroundMenu = value;
      },
    },
    colorPrimary: {
      get() {
        return this.$vuetify.theme.themes.light.primary;
      },
      set(value) {
        // Light theme
        this.$vuetify.theme.themes.light.primary = value;
        // Dark theme
        this.$vuetify.theme.themes.dark.primary = value;
      },
    },
    colorLight: {
      get() {
        return this.$store.state.colorLight
      },
      set(value) {
        this.$store.state.colorLight = value;
      },
    },
    colorDark: {
      get() {
        return this.$store.state.colorDark
      },
      set(value) {
        this.$store.state.colorDark = value;
      },
    },
    transparent_card: {
      get() {
        return this.$store.state.transparent_card;
      },
      set(value) {
        this.$store.state.transparent_card = value;
      },
    },
    transparent_control: {
      get() {
        return this.$store.state.transparent_control;
      },
      set(value) {
        this.$store.state.transparent_control = value;
      },
    },
    transparent_dialog: {
      get() {
        return this.$store.state.transparent_dialog;
      },
      set(value) {
        this.$store.state.transparent_dialog = value;
      },
    },
    size_widget: {
      get() {
        return this.$store.state.sizeWidget;
      },
      set(value) {
        this.$store.state.sizeWidget = value;
      },
    },
    height_widget() {
      if (this.responsiveWidget)
        switch (this.$vuetify.breakpoint.name) {
          case 'xs': return this.size_widget + 35
          case 'sm': return this.size_widget + 45
          case 'md': return this.size_widget + 55
          case 'lg': return this.size_widget + 65
          case 'xl': return this.size_widget + 65
        }
        return this.size_widget + 65;
    },
    icon_size_widget: {
      get() {
        return this.$store.state.iconSizeWidget;
      },
      set(value) {
        this.$store.state.iconSizeWidget = value;
      },
    },
    font_size_title: {
      get() {
        return this.$store.state.fontSizeTitle;
      },
      set(value) {
        this.$store.state.fontSizeTitle = value;
      },
    },
    font_size_subtitle: {
      get() {
        return this.$store.state.fontSizeSubtitle;
      },
      set(value) {
        this.$store.state.fontSizeSubtitle = value;
      },
    },
    responsiveWidget: {
      get() {
        return this.$store.state.responsiveWidget;
      },
      set(value) {
        this.$store.state.responsiveWidget = value;
      },
    },
    panels(){
      var panels = [{ title: this.$t("views.home"), name: "" }];
      panels = panels.concat(this.$store.getters.allPanels);
      return panels;
    },
    only_panels() {
      return this.$store.getters.allPanels
    },
    default_panel: {
      get() {
        return this.$store.state.default_panel;
      },
      set(value) {
        this.$store.state.default_panel = value;
      },
    },
    count_panels() {
      return (
        this.$store.getters.countPanels +
        " (limit " +
        process.env.VUE_APP_LIMIT_PANELS +
        ")"
      );
    },
    count_widgets() {
      return (
        this.$store.getters.countWidgets +
        " (limit " +
        process.env.VUE_APP_LIMIT_WIDGETS +
        ")"
      );
    },
    count_datas() {
      return this.$store.getters.countData;
    },
    ws_state() {
      return this.$store.getters.socketState;
    },
  },
};
</script>

<style>
.v-card { color: rgb(0, 0, 0, 0.8) }
</style>