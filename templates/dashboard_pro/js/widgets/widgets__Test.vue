<template>
  <v-card height="100%" :color="card_color" :flat="transparent" loading="primary">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="headline">Test widget</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-dialog v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title class="headline">Test widget</v-card-title>
        <v-card-text>First test widget</v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "Test",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
  }),
  methods: {
  },
  computed: {
  },
};
</script>

<style>
</style>