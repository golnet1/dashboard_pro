// eslint-disable-next-line no-unused-vars
export default {
  props: ["widgetId"],
  data: () => ({
    dialog: false,
  }),
  methods:{
    openOption()
    {
      this.dialog = true
    },
    reloaded(){
      this.$store.commit("resetReloadWidget", this.widget.id);
    }
  },
  computed: {
    widget() {
      return this.$store.getters.getWidgetById(this.widgetId);
    },
    parent_panel() {
      var panel = this.$store.getters.getPanelByName(this.widget.parent)
      if (panel) return panel
      return this.$store.getters.getWidgetById(this.widget.parent)
    },
    reload()
    {
      return this.widget.reload
    }
  },
  created: function () {
    //console.log(this.widget)
  }
}