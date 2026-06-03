<template>
  <v-avatar :class="round ? '' : 'rounded'" :size="size" :color="background ? color : ''">
    <v-icon dense v-if="type_icon == 'icon'" :color="background ? '' : color" :size="size_icon">{{ img_value }}</v-icon>
    <img v-if="type_icon != 'icon'" :src="img_value" style="object-fit: contain;"/>
  </v-avatar>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default:24
    },
    color: String,
    round: Boolean,
    background: Boolean,
  },
  data: () => ({}),
  computed: {
    type_icon() {
      if (this.img_value)
      {
        if (this.img_value.includes("/")) return "url";
        if (this.img_value.includes(".")) return "property";
      }
      return "icon";
    },
    img_value() {
      if (this.value)
      {
        if (this.value.includes("/")) return this.value;
        if (this.value.includes("."))
          return this.$store.getters.getData(this.value).value;
      }
      return this.value;
    },
    size_icon()
    {
      return this.size - 16
    }
  },
  created() {
    if (this.value.includes(".") && !this.value.includes("/"))
      this.$store.dispatch("requestData", this.value);
  },
};
</script>

<style>
</style>