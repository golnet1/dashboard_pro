<template>
  <div class="system">
    <v-card :color="nav_color">
      <v-card-title>
        <v-text-field v-model="search" prepend-icon="fas fa-search" :label="$t('search')" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table
        dense
        :headers="headersData"
        :items="data"
        :search="search"
        :items-per-page="25"
        single-expand
        show-expand
        :expanded.sync="expanded"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100, -1]
        }"
        item-key="name"
        class="elevation-1"
        style="background-color:rgba(0,0,0,0)"
      >
        <template v-slot:[`item.updated`]="{ item }">
            <v-chip :color="getColor(item.updated)" dark small>{{ getDateString(item.updated) }}</v-chip>
        </template>
        <template v-slot:expanded-item="{ headers, item }">
          <td :colspan="headers.length">
            <v-card style="background-color:rgba(0,0,0,0)">
              <v-data-table
                dense
                :headers="headersWidgets"
                :items="widgets(item.name)"
                hide-default-footer
                style="background-color:rgba(0,0,0,0)"
              ></v-data-table>
            </v-card>
          </td>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script>
import systemColor from '../components/mixins/system_color';
export default {
  mixins: [systemColor],
  name: "System",
  data: () => ({
    search: "",
    expanded: [],
    headersData: [
      {
        text: "Object properties",
        align: "start",
        value: "name",
      },
      { text: "Value", value: "value" },
      { text: "Updated", value: "updated" },
      { text: "", value: "data-table-expand" },
    ],
    headersWidgets: [
      {
        text: "Panel",
        align: "start",
        value: "parent",
      },
      { text: "Widget type", value: "type" },
    ],
  }),
  computed: {
    loading() {
      return this.$store.state.loading;
    },
    editEnable: {
      get() {
        return this.$store.state.editEnable; // || this.$vuetify.breakpoint.mdAndDown;
      },
      set(value) {
        this.$store.commit("updateEditEnable", value);
        if (!value) {
          this.saveConfig();
        }
      },
    },
    data() {
      return this.$store.getters.allData;
    },
  },
  methods: {
    widgets(obj_value) {
      //console.log(this.$store.getters.getWidgetsByObj(obj_value));
      return this.$store.getters.getWidgetsByObj(obj_value);
    },
    getColor (updated) {
        const today = new Date()
        const dt = new Date(updated)
        if (today - dt < 60 * 1000) return 'green'
        else if (today - dt < 60 * 60 * 1000) return 'orange'
        else return 'red'
    },
    getDateString(updated){
        var dt = new Date(updated)
        return dt.toLocaleString()
    }
  },
};
</script>