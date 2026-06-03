<template>
  <div>
    <v-row class="mb-2">
      <v-col class="pr-0 pt-0 pb-0">
        <select-object :label="label" v-model="selectObj" />
      </v-col>
      <v-col class="pa-0">
        <select-property v-model="selectProp" :objectName="selectObj" />
      </v-col>
      <div class="pt-4">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" icon @click="selectObj = null">
              <v-icon small>fas fa-backspace</v-icon>
            </v-btn>
          </template>
          <span>{{$t('select.reset_property')}}</span>
        </v-tooltip>
      </div>
    </v-row>
  </div>
</template>

<script>
export default {
  props: {
    value: String,
    label: String,
  },
  data: () => ({
    selectObj: null,
    selectProp: null,
  }),

  computed: {},
  created() {
    this.setValue(this.value);
  },
  methods: {
    setValue(id) {
      if (!this.value) return;

      this.selectObj = id.split(".")[0];
      this.selectProp = id.split(".")[1];
    },
  },
  watch: {
    selectObj(value) {
      this.$emit("input", value ? this.selectObj : null);
    },
    selectProp(value) {
      this.$emit(
        "input",
        value ? this.selectObj + "." + value : this.selectObj
      );
    },
    value(value) {
      this.setValue(value);
    },
    // eslint-disable-next-line no-unused-vars
    search(val) {},
  },
};
</script>