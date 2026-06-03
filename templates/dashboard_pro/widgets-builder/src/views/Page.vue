<template>
 <v-card height=100% color="transparent">
   <v-row v-if="loading" class="fill-height ma-0" align="center" justify="center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>
    <vue-friendly-iframe style="height:100%; width:100%;" :src="page.url" @load="onLoad"></vue-friendly-iframe>
 </v-card>
</template>

<script>
export default {
  name: "Page",
  data: () => ({
    loading: true,
  }),
  computed: {
    page() {
      return this.$store.getters.getPanelByName(this.$route.params.page);
    },
    loadingUI() {
      return this.$store.state.loading;
    },
  },
  methods:{
    onLoad: function () {
      this.loading = false
    }
  },
  watch:{
    loadingUI(value)
    {
      if (!value && !this.page)
        this.$router.push({ name: 'Error', params: { errorCode: '404', errorMessage: "Page "+ this.$route.params.page+" not found!"} })
    },
    page(value)
    {
      if (!value && !this.loadingUI)
        this.$router.push({ name: 'Error', params: { errorCode: '404', errorMessage: "Page "+ this.$route.params.page+" not found!"} })
    }
  }
}
</script>
<style>
.vue-friendly-iframe iframe {
  width: 100%;
  height: 100%;
  border: 0px;
  background-color: transparent;
}
</style>
