<template>
  <v-list-item-subtitle :style="'font-size:'+fontSize +'rem'" v-if="value">{{ calc_value }}</v-list-item-subtitle>
</template>

<script>
export default {
  props: {
    value: String,
    preValue: String,
    posValue: String,
  },
  data: () => ({
    calc_value: "",
    interval: null,
    valueInt: NaN,
  }),

  computed: {
    settingFontSize(){
        return (this.$store.state.fontSizeSubtitle) / 100;
    },
    responsiveWidget() {
        return this.$store.state.responsiveWidget;
    },
    fontSize() {
      if (this.responsiveWidget)
        switch (this.$vuetify.breakpoint.name) {
          case 'xs': return this.settingFontSize + 0.5
          case 'sm': return this.settingFontSize + 0.7
          case 'md': return this.settingFontSize + 0.8
          case 'lg': return this.settingFontSize + 0.9
          case 'xl': return this.settingFontSize + 1
        }
      return this.settingFontSize +1;
    },
  },
  created() {
    this.setValue(this.value);
  },
  methods: {
    setValue(value) {
      clearInterval(this.interval);
      this.valueInt = parseInt(value);
      if (this.valueInt  > 100000000) {
          this.interval = setInterval(() => {
            this.updateDiffs();
          }, 1000);
          this.updateDiffs();
          return;
      }
      var text = ""
      if (this.preValue) text = this.preValue
      text += value
      if (this.posValue) text += this.posValue;
      this.calc_value = text
    },
    updateDiffs() {
          var diff = Math.abs(Date.now() - this.valueInt * 1000);
          var second = 1000;
          var minute = 1000 * 60;
          var hour = 1000 * 60 * 60;
          var day = 1000 * 60 * 60 * 24;
          var days = Math.floor(diff / day);
          diff -= days * day;
          var hours = Math.floor(diff / hour);
          diff -= hours * hour;
          var minutes = Math.floor(diff / minute);
          diff -= minutes * minute;
          var seconds = Math.floor(diff / second);
          var text = "";
          if (days > 0) text += days + " дн. ";
          if (hours > 0) text += hours + " ч. ";
          if (days==0 && minutes > 0) text += minutes + " мин. ";
          if (days==0 && hours == 0 && seconds > 0) text += seconds + " сек. ";
          if (text == "") text += "только что";
          else text += "назад";
          if (this.preValue) text = this.preValue + text
          if (this.posValue) text = text + this.posValue
          this.calc_value = text
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