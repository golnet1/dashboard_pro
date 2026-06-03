<template>
  <div>
    <vfa-picker :itemsPerPage="100" :value="value" @input="update($event)" >
      <template v-slot:activator="{ on }">
        <v-row class="px-0">
          <v-col cols="3" class="pr-0" v-if="!only_icon">
          <v-select
                    v-model="type_icon"
                    :items="types"
                    item-text="title"
                    item-value="name"
                    label="Type"
                  ></v-select>
          </v-col>
          <v-col v-if="type_icon == 'icon'" :cols="only_icon ? 10 : 7" class="pb-0 pr-0">
            <v-text-field :label="label" required :value="value" @input="update($event)"></v-text-field>
          </v-col>
          <v-col v-if="type_icon == 'icon'" cols="2" class="mt-3">
            <v-tooltip top>
              <template v-slot:activator="{ on: tooltip }">
                <v-btn v-on="{ ...tooltip}" @click="on">
                  <v-icon>{{value}}</v-icon>
                </v-btn>
              </template>
              <span>{{$t("icon_input.select")}}</span>
            </v-tooltip>
          </v-col>
          <v-col v-if="type_icon == 'url'" cols="9" class="pb-0 pr-0">
            <v-text-field :label="label" required :value="value" @input="update($event)"></v-text-field>
          </v-col>
          <v-col v-if="type_icon == 'property'" cols="9" class="pb-0 pr-0">
            <select-objectproperty class="mt-3 mr-2" :label="label" :value="value" @input="update($event)"/>
          </v-col>
        </v-row>
      </template>
    </vfa-picker>
  </div>
</template>

<script>
import Vue from "vue";
import VueFontAwesomePicker from "./vfa-picker";
Vue.use(VueFontAwesomePicker);
export default {
  props: {
    value: {
        type: String,
        required: true
    },
    label: String,
    only_icon: Boolean,
  },
  data: () => ({
     types: [
      { title: "Icon", name: "icon" },
      { title: "Url image", name: "url" },
      { title: "Property", name: "property" },
    ],
    type_icon: "icon",
  }),

  computed: {

  },
  created() {
    if (this.value.includes("fa")) this.type_icon = "icon"
    if (this.value.includes("/")) this.type_icon = "url"
    if (this.value.includes(".") && !this.value.includes("/")) this.type_icon = "property"
  },
  methods: {
    parent(icon) {
      if (icon.styles.indexOf("regular") > -1) {
        return "fa";
      } else if (icon.styles.indexOf("solid") > -1) {
        return "fas";
      } else if (icon.styles.indexOf("brands") > -1) {
        return "fab";
      }
      return "";
    },
    update(value)
    {
      this.$emit('input', value)
    }
  },
  watch: {
    value(value) {
      this.$emit("input", value);
    },
  },
};
</script>