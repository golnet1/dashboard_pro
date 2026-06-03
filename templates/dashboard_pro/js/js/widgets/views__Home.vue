<template>
  <v-container fluid grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 md6 lg3 v-for="item in items" :key="item.name">
        <v-card
          class="mx-auto"
          :color="system_color"
        >
        <v-card
          color="transparent"
          :to="'/' + item.type + '/' + item.name"
          link>

          <v-img
            class="white--text align-end"
            :src="item.image"
            height="120px"
          ></v-img>
          <v-list-item dense class="pa-0 ma-0">
            <v-list-item-avatar v-show="item.icon" class="ma-0">
              <v-icon small>{{ item.icon }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content :class="item.icon ? 'mt-0' : 'mt-0 pl-3'">
              <v-list-item-title class="headline py-1">{{
                item.title
              }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
          <v-btn-toggle id="buttons" class="pa-n5" v-show="editEnable" dense>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  min-width="24px"
                  x-small
                  @click="openEditDialog(item)"
                >
                  <v-icon x-small color="primary">fas fa-edit</v-icon>
                </v-btn>
              </template>
              <span>{{$t('edit')}}</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  min-width="24px"
                  x-small
                  dense
                  @click="deletePanel(item)"
                >
                  <v-icon dense x-small color="primary">fas fa-trash</v-icon>
                </v-btn>
              </template>
              <span>{{$t('delete')}}</span>
            </v-tooltip>
          </v-btn-toggle>
        </v-card>
      </v-flex>
    </v-layout>
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="mt-16"
          v-bind="attrs"
          v-on="on"
          v-show="editEnable"
          color="primary"
          fixed
          right
          :top="btnPosition == 'Top'"
          :bottom="btnPosition == 'Bottom'"
          fab
          :disabled="limitPanel"
          @click="openAddDialog"
        >
          <v-icon>fas fa-plus</v-icon>
        </v-btn>
      </template>
      <span>{{ $t("navigator.add_panel") }}</span>
    </v-tooltip>
    <AddPanelDialog ref="panelDialog" />
  </v-container>
</template>

<script>
import AddPanelDialog from "../components/core/AddPanelDialog.vue";
import systemColor from "../components/mixins/system_color";
export default {
  mixins: [systemColor],
  name: "Home",
  components: {
    AddPanelDialog,
  },
  computed: {
    items() {
      //var panels = this.$store.getters.getPanelsByType('panel')
      //panels = panels.concat(this.$store.getters.getPanelsByType('page'))
      var panels = this.$store.getters.getPanelsParent("root");
      if (this.$route.params.group)
        panels = this.$store.getters.getPanelsParent(this.$route.params.group);
      return panels.filter((t) => !t.hideHome);
    },
    loading() {
      return this.$store.state.loading;
    },
    limitPanel() {
      return (
        this.$store.getters.countPanels >= process.env.VUE_APP_LIMIT_PANELS
       );
    },
    editEnable() {
      return this.$store.state.editEnable;
    },
    btnPosition(){
      return this.$store.state.addBtnPosition
    },
  },
  methods: {
    openAddDialog() {
      this.$refs.panelDialog.openAddDialog();
    },
    openEditDialog(item) {
      this.$refs["panelDialog"].openEditDialog(item);
    },
    async deletePanel(item) {
      const res = await this.$confirm(this.$t("panel_dialog.confirm"), {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning"),
      });
      if (res) {
        this.$store.dispatch("deletePanel", item.name);
      }
    },
  },
  watch: {
    loading(newLoading) {
      if (!newLoading) {
        if (this.items.length == 0) {
          this.$router.push("about");
          this.$store.state.editEnable = true;
        } else {
          var def_panel = this.$store.state.default_panel;
          if (def_panel != "") {
            var panel = this.$store.getters.getPanelByName(def_panel);
            this.$router.push({ path: "/" + panel.type + "/" + panel.name });
          }
        }
      }
    },
  },
  mounted() {},
};
</script>
