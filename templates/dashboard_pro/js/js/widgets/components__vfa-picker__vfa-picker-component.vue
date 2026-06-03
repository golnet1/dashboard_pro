<template>
  <div>
    <v-dialog v-model="visible" scrollable :width="width">
      <v-card :color="dialog_color" :min-height="height" :max-height="height">
        <v-card-title>
          <v-spacer></v-spacer>
          <v-text-field
            hide-details
            prepend-icon="fas fa-search"
            single-line
            :placeholder="$t('icon_input.search')"
            v-if="searchable"
            v-model="keyword"
          ></v-text-field>
          <v-spacer></v-spacer>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 600px;">
          <v-row align="center" justify="center">
            <v-col v-for="icon in currentIcons" :key="icon.class" class="ma-2">
              <v-tooltip content-class="top" top>
                <template v-slot:activator="{ attrs, on }">
                  <v-icon v-bind="attrs" v-on="on" x-large :color=" selected(icon) ? 'primary':''"  @click.native="picked(icon)">{{ faIcon(icon) }}</v-icon>
                </template>
                <span>{{ icon.label }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <h3>{{ icons.length }} {{$t('icon_input.icons')}}</h3>
          <v-spacer></v-spacer>
          <v-pagination v-model="page" :length="totalPages" :total-visible="7" circle></v-pagination>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <slot name="activator" v-bind:on="on"></slot>
  </div>
</template>

<script>
import _icons from "./icons";
import system_color from "../mixins/system_color";
export default {
  name: "vfa-picker",
  mixins: [system_color],
  props: {
    isUnicode: {
      type: [Boolean, String],
      required: false,
      default: false,
    },
    isBoth: {
      type: [Boolean, String],
      required: false,
      default: false,
    },
    itemsPerPage: {
      type: Number,
      required: false,
      default: 36,
    },
    closeOnContainerClick: {
      type: Boolean,
      required: false,
      default: true,
    },
    width: {
      type: String,
      default: "70%",
    },
    height: {
      type: String,
      default: "50%",
    },
    value: {
      type: String,
    },
    only: {
      type: Array,
      default() {
        return ["solid", "regular", "brands"];
      },
    },
    searchable: {
      type: [Boolean, String],
      default: true,
    },
  },
  components: {},
  data() {
    return {
      visible: false,
      page: 1,
      keyword: undefined,
    };
  },
  computed: {
    currentIcons() {
      return this.icons.slice(
        (this.page - 1) * this.itemsPerPage,
        this.page * this.itemsPerPage
      );
    },
    icons() {
      let icons = _icons.filter((icon) => {
        return icon.styles.some((v) => this.only.indexOf(v) > -1);
      });

      if (this.keyword) {
        icons = icons.filter((icon) => {
          return this.keyword
            ? icon.label.toLowerCase().includes(this.keyword.toLowerCase()) ||
                icon.search.terms.filter((term) =>
                  term.toLowerCase().includes(this.keyword.toLowerCase())
                ).length > 0
            : true;
        });
        // eslint-disable-next-line
        this.page = 1;
      }

      return icons;
    },
    totalItems() {
      return this.icons.length;
    },
    totalPages() {
      return Math.ceil(this.icons.length / this.itemsPerPage);
    },
  },
  methods: {
    on() {
      this.visible = true;
    },
    next() {
      this.page + 1 < this.totalPages ? this.page++ : undefined;
    },
    previous() {
      this.page > 1 ? this.page-- : undefined;
    },
    to(page) {
      this.page = page;
    },
    selected(icon) {
      var name = this.value != undefined ? this.value.substring(7) : "";
      return icon.class === name || icon.unicode === name;
    },
    faIcon(icon) {
      var parent = "";
      if (icon.styles.indexOf("regular") > -1) {
        parent = "far";
      } else if (icon.styles.indexOf("solid") > -1) {
        parent = "fas";
      } else if (icon.styles.indexOf("brands") > -1) {
        parent = "fab";
      }
      return parent + " fa-" + icon.class;
    },
    picked(icon) {
      this.visible = false;

      if (this.isUnicode) return this.$emit("input", icon.unicode);

      if (this.isBoth) {
        this.$emit("update:class", icon.class);
        this.$emit("update:unicode", icon.unicode);
        this.$emit("input", {
          class: icon.class,
          unicode: icon.unicode,
        });
        return;
      }
      var stringIcon = "";
      if (icon.styles.indexOf("regular") > -1) {
        stringIcon = "far";
      } else if (icon.styles.indexOf("solid") > -1) {
        stringIcon = "fas";
      } else if (icon.styles.indexOf("brands") > -1) {
        stringIcon = "fab";
      }
      stringIcon += " fa-" + icon.class;
      return this.$emit("input", stringIcon);
    },
  },
};
</script>

<style>
</style>
