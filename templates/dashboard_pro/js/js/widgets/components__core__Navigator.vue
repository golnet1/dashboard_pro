<template>
  <div>
    <v-navigation-drawer
      v-model="sidebarMenu"
      dense
      mini-variant-width="70"
      :mini-variant="mini && $vuetify.breakpoint.mdAndUp && !hideMenu"
      :src="this.$store.state.backgroundMenu"
      :hide-overlay="!hideMenu"
      :color="nav_color"
      app
      :temporary="hideMenu"
      :permanent="$vuetify.breakpoint.mdAndUp && !hideMenu"
    >
      <template v-slot:prepend>
        <v-list-item :class="'px-2 py-1'" link to="/">
          <v-tooltip right :disabled="!mini">
            <template v-slot:activator="{ on, attrs }">
              <v-list-item-avatar class="pa-0" tile v-bind="attrs" v-on="on">
                <v-img :src="mainIcon"></v-img>
              </v-list-item-avatar>
            </template>
            MBoard
          </v-tooltip>
          <v-list-item-content class="py-1">
            <v-list-item-title class="title">
              MBoard
              <v-chip class="ma-1" x-small color="primary">{{mode}}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>Majordomo UI</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
      </template>
      <template v-for="item in itemsRoot">
        <v-list-item
          v-if="item.type == 'panel' || item.type == 'page' || item.type == 'flex' || item.type == 'waterfall' || item.type == 'dnd'  || !item.type || (item.type=='group' && !item.expand && !editEnable)"
          :key="item.title"
          :to="'/'+item.type+'/'+item.name"
        >
          <v-tooltip right :disabled="!mini">
            <template v-slot:activator="{ on, attrs }">
              <v-list-item-avatar :src="item.image" v-bind="attrs" v-on="on">
                <v-img v-show="item.image && !item.icon" :src="item.image"></v-img>
                <v-icon v-show="item.icon">{{ item.icon }}</v-icon>
              </v-list-item-avatar>
            </template>
            {{ item.title }}
          </v-tooltip>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action v-if="editEnable">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                  color="primary"
                  small
                  v-bind="attrs"
                  v-on="on"
                  @click="openEditDialog(item)"
                >fas fa-edit</v-icon>
              </template>
              {{$t('edit')}}
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
        <v-list-group v-if="item.type=='group' && (item.expand || editEnable)" :key="item.title" @click="expand(item)">
          <v-divider></v-divider>
          <template v-slot:activator class="px-0">
            <v-tooltip right :disabled="!mini">
              <template v-slot:activator="{ on, attrs }">
                <v-list-item-avatar tile :src="item.image" v-bind="attrs" v-on="on">
                  <v-badge color="primary" dot
                      offset-x="10"
                      offset-y="10">
                    <v-avatar size="40">
                      <v-img v-show="item.image && !item.icon" :src="item.image"></v-img>
                      <v-icon v-show="item.icon">{{ item.icon }}</v-icon>
                    </v-avatar>
                  </v-badge>
                </v-list-item-avatar>
              </template>
              {{$t('panel_type.group')}}: {{ item.title }}
            </v-tooltip>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action v-if="editEnable">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="primary"
                    small
                    v-bind="attrs"
                    v-on="on"
                    @click="openEditDialog(item)"
                  >fas fa-edit</v-icon>
                </template>
                {{$t('edit')}}
              </v-tooltip>
            </v-list-item-action>
          </template>
          <v-list-item
            v-for="subitem in itemsParent(item.name)"
            :key="subitem.title"
            :to="'/'+subitem.type+'/'+subitem.name"
          >
            <v-tooltip right :disabled="!mini">
              <template v-slot:activator="{ on, attrs }">
                <v-list-item-avatar :src="subitem.image" v-bind="attrs" v-on="on">
                  <v-img v-show="subitem.image && !subitem.icon" :src="subitem.image"></v-img>
                  <v-icon v-show="subitem.icon">{{ subitem.icon }}</v-icon>
                </v-list-item-avatar>
              </template>
              {{ subitem.title }}
            </v-tooltip>
            <v-list-item-content>
              <v-list-item-title>{{ subitem.title }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action v-if="editEnable">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="primary"
                    small
                    v-bind="attrs"
                    v-on="on"
                    @click="openEditDialog(subitem)"
                  >fas fa-edit</v-icon>
                </template>
                {{$t('edit')}}
              </v-tooltip>
            </v-list-item-action>
          </v-list-item>
          <v-divider></v-divider>
        </v-list-group>
      </template>

      <v-list-item :disabled="limitPanel" v-if="editEnable" @click="openAddDialog">
        <v-tooltip right :disabled="!mini">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item-avatar v-bind="attrs" v-on="on">
              <v-icon>fas fa-plus</v-icon>
            </v-list-item-avatar>
          </template>
          {{$t('navigator.add_panel')}}
        </v-tooltip>
        <v-list-item-content>
          <v-list-item-title>{{$t('navigator.add_panel')}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

    </v-navigation-drawer>
    <AddPanelDialog ref="panelDialog" />
  </div>
</template>

<script>
import AddPanelDialog from "./AddPanelDialog";
import systemColor from '../mixins/system_color';
export default {
  mixins: [systemColor],
  name: "Navigator",
  components: {
    AddPanelDialog,
  },
  data: () => ({
    mainIcon: "./img/icon.png",
    mode: process.env.VUE_APP_TYPE,
  }),
  methods: {
    itemsParent(value) {
      var panels = this.$store.getters.getPanelsParent(value)
      if (this.editEnable)
        return panels
      return panels.filter(t=>t.hideNav == this.editEnable || t.hideNav===undefined)
    },
    openAddDialog() {
      this.$refs.panelDialog.openAddDialog();
    },
    openEditDialog(item) {
      this.$refs["panelDialog"].openEditDialog(item);
    },
    expand(group){
      if (!group.expandClick) return
      console.log(name)
      this.$router.push("/group/"+group.name).catch(()=>{})
    }
  },
  computed: {
    editEnable: {
      get() {
        return this.$store.state.editEnable;
      },
      set(value) {
        this.$store.commit("updateEditEnable", value);
        if (!value) {
          this.saveConfig();
        }
      },
    },
    mini() {
      return this.$store.state.mini
    },
    hideMenu() {
      return this.$store.state.hideMenu
    },
    sidebarMenu:{
      get(){
        return this.$store.getters.sidebarMenu
      },
      set(value){
        this.$store.commit("updateSidebarMenu", value);
      }
    },
    limitPanel() {
      return (
        this.$store.getters.countPanels >= process.env.VUE_APP_LIMIT_PANELS
      );
    },
    itemsRoot(){
      return  this.itemsParent('root')
    },
  },
};
</script>