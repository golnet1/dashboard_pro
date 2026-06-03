<template>
  <div>{{preValue}}{{calc_value.value}}{{posValue}}</div>
</template>

<script>
export default {
  props: {
    value: String,
    preValue: String,
    posValue: String,
  },
  data: () => ({
  }),

  computed: {
    calc_value(){
      if (!this.value) return ""
      return this.$store.getters.getData(this.value);
    },
  },
  created() {
    this.setValue(this.value);
  },
  methods: {
    setValue(value)
    {
      console.log(value)
      this.$store.dispatch("requestData", value);
    }
  },
  watch: {
    // eslint-disable-next-line no-unused-vars
    value(value) {
      this.setValue(value);
    },
    // eslint-disable-next-line no-unused-vars
    preValue() {
      this.setValue(this.value);
    },
    posValue() {
      this.setValue(this.value);
    },
  },
};
</script>