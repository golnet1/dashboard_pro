<template>
  <v-list-item-title
      :style="'font-size:'+fontSize +'rem'"
  >{{value}} {{posfix}}</v-list-item-title>
</template>

<script>
export default {
  props: {
    value: String,
    posfix: String,
  },
  data: () => ({
  }),

  computed: {
    settingFontSize(){
        return (this.$store.state.fontSizeTitle) / 100;
    },
    fontSize() {
      return this.settingFontSize + 1.5;
    },
  },
  created() {
  },
  methods: {
  },
  watch: {
  },
};
</script>