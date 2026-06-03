<template>
  <v-dialog v-model="dialog" persistent scrollable max-width="600px">
    <v-card :color="dialog_color">
      <v-card-title>
        <span v-if="!dialogEdit" class="headline">{{$t('panel_dialog.add')}}</span>
        <span v-if="dialogEdit" class="headline">{{$t('panel_dialog.edit')}}</span>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-container>
          <v-col cols="12" class="pa-0">
            <v-text-field :label="$t('option.name')" required v-model="dialogName"></v-text-field>
          </v-col>
          <v-col cols="12" class="pa-0">
            <icon-input :label="$t('option.icon')" v-model="dialogIcon" :only_icon="true"></icon-input>
          </v-col>
          <v-col cols="12" class="pa-0">
            <v-text-field :label="$t('option.image')" required v-model="dialogImage"></v-text-field>
          </v-col>
          <v-col cols="12" class="pa-0">
            <v-switch v-model="dialogHideNav" :label="$t('panel_dialog.hide_nav')"></v-switch>
          </v-col>
          <v-col cols="12" class="pa-0">
            <v-switch v-model="dialogHideHome" :label="$t('panel_dialog.hide_home')"></v-switch>
          </v-col>
          <v-col cols="12" class="pa-0">
            <v-select
              v-model="selectType"
              :items="dialogType"
              item-text="title"
              item-value="name"
              :label="$t('panel_dialog.type')"
            ></v-select>
          </v-col>
          <v-col cols="12" class="pa-0" v-if="selectType == 'waterfall'">
            <v-text-field :label="$t('panel_dialog.width_widget')" required v-model="dialogWidgetWidth"></v-text-field>
          </v-col>
          <v-col cols="12" class="pa-0" v-if="selectType == 'dnd'">
            <v-text-field :label="$t('panel_dialog.width_cell')" required v-model="dialogWidthCell"></v-text-field>
          </v-col>
          <v-col cols="12" class="pa-0" v-if="selectType != 'group'">
            <v-select
              v-model="selectParent"
              :items="dialogParent"
              item-text="title"
              item-value="name"
              :label="$t('panel_type.group')"
            ></v-select>
          </v-col>
          <v-col cols="12" class="pa-0" v-if="selectType == 'group'">
            <v-switch v-model="dialogExpand" :label="$t('panel_dialog.expandible')"></v-switch>
            <v-switch v-show="dialogExpand" v-model="dialogExpandClick" :label="$t('panel_dialog.click_open')"></v-switch>
          </v-col>
          <v-col cols="12" class="pa-0" v-if="selectType == 'page'">
            <v-text-field :label="$t('panel_dialog.url')" required v-model="dialogPage"></v-text-field>
          </v-col>
        </v-container>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn v-if="dialogEdit" color="primary darken-1" text @click="upPanel()">{{$t('panel_dialog.up')}}</v-btn>
        <v-btn v-if="dialogEdit" color="primary darken-1" text @click="downPanel()">{{$t('panel_dialog.down')}}</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary darken-1" text @click="dialog = false">{{$t("close")}}</v-btn>
        <v-btn v-if="!dialogEdit" color="primary darken-1" text @click="addPanel()">{{$t("add")}}</v-btn>
        <v-btn v-if="dialogEdit" color="primary darken-1" text @click="deletePanel()">{{$t("delete")}}</v-btn>
        <v-btn v-if="dialogEdit" color="primary darken-1" text @click="editPanel()">{{$t("save")}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const { slugify } = require("transliter");
import Panels from "../../views/panels.js";
import system_color from "../mixins/system_color";
export default {
  name: "AddPanelDialog",
  mixins: [system_color],
  data: () => ({
    dialog: false,
    dialogEdit: false,
    dialogName: "",
    dialogIcon: "",
    dialogImage: "",
    dialogPage: "",
    dialogHideNav: false,
    dialogHideHome: false,
    dialogExpand: true,
    dialogExpandClick: false,
    selectType: "panel",
    dialogType: [],
    selectParent: "root",
    dialogParent: [],
    dialogWidgetWidth: 200,
    dialogWidthCell:55,
    mode: process.env.VUE_APP_TYPE,
  }),
  methods: {
    selectIcon(icon) {
      this.dialogIcon = "fas fa-" + icon;
    },
    checkName(name){
      var panels = this.$store.getters.allPanels
      if (panels.find(t=>t.name==name))
        return false
      return true
    },
    getNameOk(title)
    {
      var name = slugify(title)
      if (name == this.oldName)
       return name
      var nameOk = name
      var c=0
      while (!this.checkName(nameOk))
      {
        c += 1
        nameOk=name+"_"+c.toString()
      }
      return nameOk
    },
    openAddDialog() {
      this.dialogEdit = false;
      this.dialogName = "";
      this.dialogIcon = "fas fa-home";
      this.dialogImage = "";
      this.dialogPage = "";
      this.dialogHideNav = false
      this.dialogHideHome = false
      this.dialogExpand = true
      this.dialogExpandClick = false
      this.selectType = "panel"
      this.selectParent = "root"
      var groups = [{ title: "Root", name: "root" }];
      groups = groups.concat(this.$store.getters.getPanelsByType("group"));
      this.dialogParent = groups;
      this.oldName = ""
      this.dialog = true;
    },
    addPanel() {
      var name = this.getNameOk(this.dialogName)
      this.$store.commit("addPanel", {
        title: this.dialogName,
        name: name,
        icon: this.dialogIcon,
        image: this.dialogImage,
        hideNav: this.dialogHide,
        hideHome: this.dialogHideHome,
        expand: this.dialogExpand,
        expandClick: this.dialogExpandClick,
        type: this.selectType,
        parent: this.selectParent,
        url: this.dialogPage,
        width_widget: this.dialogWidgetWidth,
        width_cell: this.dialogWidthCell,
      });
      this.dialog = false;
      this.$router.push({ path: "/" + this.selectType + "/" + name });
    },
    openEditDialog(panel) {
      this.dialogEdit = true;
      this.oldName = panel.name;
      this.dialogName = panel.title;
      this.dialogIcon = panel.icon;
      this.dialogImage = panel.image;
      this.dialogPage = panel.url;
      this.dialogHideNav = panel.hideNav
      this.dialogHideHome = panel.hideHome
      this.dialogExpand = panel.expand
      this.dialogExpandClick = panel.expandClick
      this.dialogWidgetWidth = panel.width_widget
      this.dialogWidthCell = panel.width_cell
      if (this.dialogWidgetWidth == undefined)
        this.dialogWidgetWidth = 200
      if (this.dialogWidthCell == undefined)
        this.dialogWidthCell = 55
      if (panel.type === undefined) this.selectType = "panel"
      else this.selectType = panel.type
      if (panel.parent === undefined) this.selectParent = "root"
      else this.selectParent = panel.parent
      var groups = [{ title: "Root", name: "root" }];
      groups = groups.concat(this.$store.getters.getPanelsByType("group"));
      this.dialogParent = groups;
      this.dialog = true;
    },
    editPanel() {
      var name = this.getNameOk(this.dialogName)
      this.$store.dispatch("editPanel", {
        oldName: this.oldName,
        panel: {
          title: this.dialogName,
          name: name,
          icon: this.dialogIcon,
          image: this.dialogImage,
          hideNav: this.dialogHideNav,
          hideHome: this.dialogHideHome,
          expand: this.dialogExpand,
          expandClick: this.dialogExpandClick,
          type: this.selectType,
          parent: this.selectParent,
          url: this.dialogPage,
          width_widget: this.dialogWidgetWidth,
          width_cell: this.dialogWidthCell,
        },
      });
      this.dialog = false;
      if (this.oldName != name)
        this.$router.push({ path: "/" + this.selectType + "/" + name });
    },
    async deletePanel() {
      const res = await this.$confirm(this.$t("panel_dialog.confirm"), {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning"),
      });
      if (res) {
        this.$store.dispatch("deletePanel", this.oldName);
        this.dialog = false;
        this.$router.push({ path: "/" });
      }
    },
    upPanel() {
      this.$store.commit("upPanel", this.oldName);
    },
    downPanel() {
      this.$store.commit("downPanel", this.oldName);
    },
  },
  created(){
    this.dialogType = Panels.panelsType.filter((t) =>
      t.limit.includes(process.env.VUE_APP_TYPE)
    );
    this.dialogType.forEach(element => {
      element.title = this.$t("panel_type."+element.name)
    });
  }
};
</script>