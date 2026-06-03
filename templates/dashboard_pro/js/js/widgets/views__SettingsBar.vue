<template>
  <div class="settingsbar">
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          dark
          v-bind="attrs"
          v-on="on"
        >
          Add item
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in types"
          :key="index"
          @click="addItem(item.name)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
          color="primary"
          dark
          class = "ml-2"
           @click="clearBar()"
        >
          Clear
        </v-btn>
    <draggable :options="options" v-model="itemsBar" @end="onEnd">
    <v-card v-for="(item, index) in itemsBar" :key="index" class="mt-1 mx-auto" :color="system_color" max-width="1000">
      <v-list-item>
      <v-list-item-icon style="cursor:move;">
        <v-icon>{{getType(item.type).icon}}</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <resv-list-item-title style="cursor:move;" :value="getType(item.type).title" />
      </v-list-item-content>
      <v-list-item-action>
        <div>
        <v-btn v-if="getType(item.type).options" icon ripple @click="show = (show != index ? index : -1)">
          <v-icon>{{ show == index ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
        <v-btn icon ripple @click.stop="delItem(index)">
          <v-icon color="grey lighten-1">far fa-trash-alt</v-icon>
        </v-btn>
        </div>
      </v-list-item-action>
      </v-list-item>
      <v-expand-transition v-if="item.type=='panel'">
      <div class="pa-3 pt-0" v-show="show == index">
        <v-divider></v-divider>
        <v-list-item>
        <v-col cols="12" class="pa-0" >
              <v-select
                        v-model="item.panel"
                        :items="panels"
                        item-text="title"
                        item-value="name"
                        hide-details
                        :label="$t('panel_type.panel')"
              ></v-select>
        </v-col>
        </v-list-item>
      </div>
      </v-expand-transition>
      <v-expand-transition v-if="item.type=='textvalue'">
        <div class="pa-3 pt-0" v-show="show == index">
        <v-divider></v-divider>
        <v-col cols="12" class="pa-0 pr-1 pt-2">
          <select-objectproperty :label="$t('option.object_info')" v-model="item.object_info" />
        </v-col>
        <v-col cols="12" class="pa-0 pr-1 pt-2">
          <icon-input :label="$t('option.icon')" required v-model="item.icon"></icon-input>
        </v-col>
        <v-row class="pa-0">
          <v-col class="py-0">
            <v-text-field :label="$t('option.pre_info')"  v-model="item.pre_info"></v-text-field>
          </v-col>
          <v-col class="py-0">
            <v-text-field :label="$t('option.pos_info')"  v-model="item.pos_info"></v-text-field>
          </v-col>
          <v-col class="py-0">
            <v-text-field :label="$t('option.min_width')"  v-model="item.min_width"></v-text-field>
          </v-col>
          <v-col class="py-0">
            <v-switch v-model="item.marquee" :label="$t('option.marquee')"></v-switch>
          </v-col>
          <v-col class="py-0">
            <v-text-field :label="$t('option.marquee_length')"  v-model="item.marquee_length"></v-text-field>
          </v-col>
        </v-row>
        </div>
      </v-expand-transition>
    </v-card>
    </draggable>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import systemColor from '../components/mixins/system_color';
export default {
  mixins: [systemColor],
  components: {
    draggable,
  },
  data: () => ({
    tab:0,
    show:-1,
    mode: process.env.VUE_APP_TYPE,
    types:[
      { title: "Navigator", name: "navigator", icon:"fas fa-bars"},
      { title: "Title", name: "title", icon: "fas fa-font"},
      { title: "Spacer", name: "spacer", icon:"fas fa-arrows-alt-h"},
      { title: "Divider", name: "divider", icon:"fas fa-grip-lines-vertical"},
      { title: "Events", name: "events", icon:"fas fa-bell" },
      { title: "Updater", name: "updater", icon:"fas fa-sync" },
      { title: "Theme", name: "theme", icon:"mdi-theme-light-dark" },
      { title: "Edit", name: "edit", icon:"fas fa-edit"},
      { title: "Menu", name: "menu", icon:"far fa-user-circle" },
      { title: "Time", name: "time", icon:"far fa-clock" },
      { title: "Panel", name: "panel", icon:"fas fa-external-link-alt", options: true },
      { title: "Object text value", name: "textvalue", icon: "fas fa-bold", options: true },
    //  { title: "Object status value", name: "statusvalue" },
      ]
  }),
  created() {
    //this.btnPositions[0]=this.$t("settings.top")
    //this.btnPositions[1]=this.$t("settings.bottom")
  },
  methods: {
    addItem(type) {
      this.itemsBar.push({
        type: type,
      });
     },
    delItem(index) {
      this.itemsBar.splice(index, 1);
    },
    getType(name)
    {
      return this.types.find(t => t.name == name)
    },
    onEnd() {
      this.$store.dispatch("saveSettings")
    },
    async clearBar(){
      const res = await this.$confirm(
        "Reset settings bar?",
        {
          buttonTrueText: this.$t("yes"),
          buttonFalseText: this.$t("no"),
          color: "error",
          title: this.$t("warning"),
        }
      );
      if (res) {
        this.itemsBar=[]
      }
    }
  },
  computed: {
    itemsBar: {
      get() {
        return this.$store.state.itemsBar
      },
      set(value) {
        this.$store.state.itemsBar = value
      },
    },
    panels(){
      const root = [{"title":this.$t("views.home"),"name":"root"}];
      const panels = this.$store.getters.allPanels
      const res = root.concat(panels);
      return res
    },
    options () {
      return {
        disabled: false
      }
    },
  }
}
</script>

<style scoped>
.v-card { color: rgb(0, 0, 0, 0.8) }
</style>