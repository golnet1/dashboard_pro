<template>
      <v-list-item-avatar :tile="!round" :size="size_avatar">
        <icon-view :value="icon" :color="color" :background="background" :round="round" :size="size_avatar"/>
      </v-list-item-avatar>
</template>

<script>
export default {
  props: {
    icon: String,
    color: String,
    round: Boolean,
    background: Boolean,
  },
  data: () => ({
  }),

  computed: {
     settingIconSize(){
        return this.$store.state.iconSizeWidget;
    },
    size_avatar() {
      return this.settingIconSize + 40;
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