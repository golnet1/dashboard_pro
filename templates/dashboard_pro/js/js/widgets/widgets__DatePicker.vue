<template>
  <v-card height="100%" :color="card_color" :flat="transparent" :loading="value.value ? false : 'primary'">
    <v-list-item>
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-right="30"
        :nudge-top="20"
        transition="scale-transition"
        offset-y
        min-width="290px"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="date"
            :label="widget.title"
            :prepend-icon="widget.icon"
            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-date-picker
          :locale="$store.state.language.substr(0, 2)"
          :first-day-of-week="1"
          v-model="date"
          @input="menu = false"
        ></v-date-picker>
      </v-menu>
    </v-list-item>
    <v-dialog persistent scrollable v-model="dialog" width="600">
      <v-card :color="dialog_color">
        <v-card-title>
          <span class="headline">{{ $t('option.title', [ $t("widget."+widget.type+".name")]) }}</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-container class="pa-0">
            <v-col cols="12" class="pb-0">
              <v-text-field :label="$t('option.name')" required v-model="widget.title"></v-text-field>
            </v-col>
            <v-col cols="12" class="pb-0">
              <icon-input :label="$t('option.icon')" required v-model="widget.icon" :only_icon="true"></icon-input>
            </v-col>
            <v-col cols="12" class="pb-0">
              <select-objectproperty :label="$t('option.object_value')" v-model="widget.object_value" />
            </v-col>
            <v-col class="py-0">
              <select-color v-model="widget.color"></select-color>
            </v-col>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog()">{{$t('close')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "DatePicker",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
    menu: false,
  }),

  methods: {
    closeDialog() {
      this.dialog = false;
      this.$store.dispatch("requestData", this.widget.object_value);
    },
  },
  computed: {
    value() {
      return this.$store.getters.getData(this.widget.object_value);
    },
    date: {
      get() {
        if (this.value) return this.value.value;
        return new Date().toISOString().substr(0, 10);
      },
      set(value) {
        console.log("set date", this.value.value, "->", value);
        if (this.value.value == value) return;
        this.value.value = value;
        var payload = { name: this.widget.object_value, value: value };
        this.$store.dispatch("setGlobal", payload);
      },
    },
  },
  created() {
    this.$store.dispatch("requestData", this.widget.object_value);
  },
};
</script>

<style>
</style>