<template>
  <div v-if="viewInput">
    <v-text-field :value="value" @input="$emit('input',$event)" :mask="mask" class="ma-0 pa-0" solo hide-details>
      <template v-slot:append>
        <v-menu top nudge-bottom="165" nudge-left="16" :close-on-content-click="false">
          <template v-slot:activator="{ on: menu, attrs }">
            <v-tooltip top>
              <template v-slot:activator="{ on: tooltip }">
                <div :style="swatchStyle" v-bind="attrs" v-on="{ ...tooltip, ...menu }" />
              </template>
              <span>{{$t("option.color")}}</span>
            </v-tooltip>
          </template>
          <v-card>
            <v-card-text class="pa-0">
              <v-color-picker :value="color" @input="$emit('input',$event)" hide-mode-switch show-swatches dark flat />
            </v-card-text>
          </v-card>
        </v-menu>
      </template>
    </v-text-field>
  </div>
  <div v-else>
    <v-menu top nudge-bottom="165" nudge-left="16" :min-width="300" :close-on-content-click="false">
      <template v-slot:activator="{ on: menu, attrs }">
        <v-tooltip top>
          <template v-slot:activator="{ on: tooltip }">
            <v-btn fab x-small :color="value" dark v-bind="attrs" v-on="{ ...tooltip, ...menu }"></v-btn>
          </template>
          <span>{{$t("option.color")}}</span>
        </v-tooltip>
      </template>
      <v-color-picker :value="color" @input="$emit('input',$event)" hide-inputs show-swatches class="mx-auto"></v-color-picker>
    </v-menu>
  </div>
</template>

<script>
export default {
  props: {
    value:
    {
      type: String,
      default: "#ff0000"
    },
    viewInput: Boolean,
  },
  data: () => ({
    mask: "!#XXXXXX",
    color: '#FF0000',
    menu: false,
    type_color: 'hex',
  }),

  computed: {
    swatchStyle() {
      const { value, menu } = this;
      return {
        backgroundColor: value,
        cursor: "pointer",
        height: "30px",
        width: "30px",
        borderRadius: menu ? "50%" : "4px",
        transition: "border-radius 200ms ease-in-out",
      };
    },
  },
  created() {
      this.color = this.value
  },
  methods: {},
  watch: {
    value(value) {
      console.log(value)
      if (value == undefined)
      {
        this.color = "#ff0000"
      }
      else this.color = value
      this.$emit("input", value);
    },
    color(value) {
      // temporary fix while there is no way to disable the alpha channel in the colorpicker component: https://github.com/vuetifyjs/vuetify/issues/9590
      if (value.toString().match(/#[a-zA-Z0-9]{8}/)) {
        this.color = value.substr(0, 7);
      }
    }
  },
};
</script>