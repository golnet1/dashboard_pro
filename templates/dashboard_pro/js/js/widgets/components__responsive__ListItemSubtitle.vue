<template>
<div>
        <v-list-item-subtitle
         :style="'font-size:'+fontSize +'rem'"
         v-show="!info" >{{value}}</v-list-item-subtitle>
        <value-view v-if="info" :value="value" :preValue="prefix" :posValue="posfix"/>
</div>
</template>

<script>
export default {
  props: {
    value: String,
    prefix: String,
    posfix: String,
    info: Boolean,
  },
  data: () => ({
  }),

  computed: {
    settingFontSize(){
        return (this.$store.state.fontSizeSubtitle) / 100;
    },
    fontSize() {
      return this.settingFontSize +1;
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