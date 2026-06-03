<template>
  <v-card height="100%" :color="card_color" :flat="transparent">
    <v-row
          class="fill-height ma-0"
          align="center"
          justify="center"
        >
          {{ $t('widget.unknown.message', [ widget.type]) }}
        </v-row>
    <v-dialog v-model="dialog" width="500">
      <v-card :color="dialog_color">
        <v-card-title class="h6">{{ $t('widget.unknown.message', [ widget.type]) }}</v-card-title>
        <v-card-text>{{$t("widget.unknown.info")}}</v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import mixinWidget from '../components/mixins/widget';
import colorWidget from '../components/mixins/card_color';
import system_color from "../components/mixins/system_color";
export default {
  name: "Unknown",
  mixins: [mixinWidget,colorWidget,system_color],
  data: () => ({
  }),
  methods: {
  },
  computed:{
  },
};
</script>

<style>
</style>