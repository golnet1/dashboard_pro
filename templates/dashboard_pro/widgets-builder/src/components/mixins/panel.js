import WidgetsList from "@/widgets/widgets.js";
import Vue from 'vue'
//import widget from "./widget";
var shortid = require("shortid");

export default {
  data: () => ({
    dialog: false,
  }),
  methods:{
    addWidget: function (type) {
      var support_widget = this.support_widgets.find((t) => t.type == type);
      //calc position
      var max = 0;
      if (this.widgets.length > 0) {
        max = this.widgets.reduce(function (prev, current) {
          return prev.y > current.y ? prev : current;
        });
      }
      var posx = 0;
      var posy = max.y + max.h;
      var id = shortid.generate();
      var widget = {
        i: this.widgets.length + 1,
        id: id,
        type: type,
        x: posx,
        y: posy,
        w: support_widget.w,
        h: support_widget.h,
        minw: support_widget.mw,
        minh: support_widget.mh,
        parent: this.$route.params.panel,
      };
      if (support_widget.options)
      {
        let options = JSON.parse(JSON.stringify(support_widget.options));
        for (const [key, value] of Object.entries(options)) {
          widget[key]=value;
        }
      }
      if (this.$store.state.debug) console.log("add widget", widget)
      this.$store.commit("addWidget", widget);
      this.dialog = false;
    },
    delWidget: async function (id) {
      const res = await this.$confirm(this.$t("panel.confirm") , {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning") })
      if (res) {
        var widget = this.$store.getters.getWidgetById(id);
        if (widget.type == "group")
        {
          widget.items.forEach(item => {
            this.$store.commit("delWidget", item.id);
          });
        }
        this.$store.commit("delWidget", id);
      }
    },
    openOptionWidget(name) {
      var widget = this.$refs[name][0];
      if (this.$store.state.debug) console.log(widget);
      widget.openOption();
    },
    copyWidget(name) {
      var widgetSrc = this.$store.getters.getWidgetById(name);
      var widget = JSON.parse(JSON.stringify(widgetSrc));
      console.log(widget);
      //calc position
      var max = {y:0,h:0};
      if (this.widgets.length > 0) {
        max = this.widgets.reduce(function (prev, current) {
          return prev.y > current.y ? prev : current;
        });
      }
      var posx = 0;
      var posy = max.y + max.h;
      var id = shortid.generate();
      widget.id = id;
      widget.x = posx;
      widget.y = posy;
      widget.i = this.widgets.length + 1;
      if (widget.type == "group")
      {
        widget.items.forEach(item => {
          var newid = this.copyWidget(item.id)
          item.id = newid
          var widgetChild = this.$store.getters.getWidgetById(newid);
          widgetChild.parent = id
          this.$store.commit("editWidget", widgetChild);
        });
      }
      if (this.$store.state.debug) console.log("copy widget", widget);
      this.$store.commit("addWidget", widget);
      return id // new id
    },
    moveToPanel: async function (widget, panel) {
      const res = await this.$confirm(this.$t("panel.confirm_move") , {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning") })
      if (res) {
        //calc new position
        var widgets = this.$store.getters.getWidgetsByPanel(panel.name);
        var max = {y:0,h:0};
        if (widgets.length > 0) {
          max = widgets.reduce(function (prev, current) {
            return prev.y > current.y ? prev : current;
          });
        }
        var posx = 0;
        var posy = max.y + max.h;
        widget.x = posx;
        widget.y = posy;
        widget.i = widgets.length + 1;
        widget.parent = panel.name;
        this.$store.commit("editWidget", widget);
      }
    },
    moveToGroup: async function (widget, group) {
      const res = await this.$confirm(this.$t("panel.confirm_move") , {
        buttonTrueText: this.$t("yes"),
        buttonFalseText: this.$t("no"),
        color: "primary",
        title: this.$t("warning") })
      if (res) {
        widget.parent = group.id;
        this.$store.commit("editWidget", widget);
        group.items.push({
          id:widget.id,
          type:widget.type,
        })
        this.$store.commit("editWidget", group);
      }
    },
    exportWidget(id)
    {
      //console.log(panel)
      var widget_export =  this.$store.getters.getWidgetById(id)
      if (widget_export.type == "group")
      {
        widget_export.widgets = []
        widget_export.items.forEach(element => {
          var child = this.$store.getters.getWidgetById(element.id)
          widget_export.widgets.push(child)
        });
      }
      //save file
      let filename = widget_export.type+"_"+widget_export.title+"_"+widget_export.id+".json"
      const data = JSON.stringify(widget_export)
       let blob = new Blob([data], { type: 'application/json;charset=utf-8;' })
        if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, filename)
        } else {
        let link = document.createElement('a')
        if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          let url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', filename)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    },
    importWidget(){
      //open file
      this.isSelecting = true
      window.addEventListener('focus', () => {
        this.isSelecting = false
      }, { once: true })

      this.$refs.uploader.click()
    },
    onFileChanged(e) {
      // do something
      let file = e.target.files[0];
      if(!file || file.type !== 'application/json') return;

      let reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload =  evt => {
        console.log(evt.target.result);
        var new_id = shortid.generate();
        var widget_import = JSON.parse(evt.target.result)
        if (widget_import.type=="group")
        {
          widget_import.items.forEach(element => {
            var old_id = element.id
            var id = shortid.generate();
            element.id = id
            var child = widget_import.widgets.find(t => t.id == old_id)
            child.id = id
            child.parent = new_id
            this.$store.commit("addWidget", child)
          });
          Vue.delete(widget_import, 'widgets');
        }
        //calc position
        var max = 0;
        if (this.widgets.length > 0) {
          max = this.widgets.reduce(function (prev, current) {
            return prev.y > current.y ? prev : current;
          });
        }
        var posx = 0;
        var posy = max.y + max.h;
        widget_import.id = new_id
        widget_import.x = posx
        widget_import.y = posy
        widget_import.parent = this.$route.params.panel
        this.$store.commit("addWidget", widget_import)
        this.dialog = false
      }
      reader.onerror = evt => {
        console.error(evt);
      }
    },
    getType(type){
      if(this.support_widgets.find(t=>t.type == type))
        return type
      return "unknown"
    }
  },
  computed: {
    panels() {
      return this.$store.getters.getPanelsByType("panel");
    },
    groups() {
      return this.$store.getters.getWidgetsByType("group");
    },
    limitWidgets() {
      return (
        this.$store.getters.countWidgets >= process.env.VUE_APP_LIMIT_WIDGETS
      );
    },
    support_widgets() {
      var listWidget = WidgetsList.all_widgets.filter((t) =>
        t.limit.includes(process.env.VUE_APP_TYPE)
      );
      if (this.$store.state.debug) return listWidget;
      return listWidget.filter((t) => !t.debug);
    },
    name_panel(){
      return this.$route.params.panel
    },
    panel() {
      return this.$store.getters.getPanelByName(this.name_panel);
    },
    widgets: {
      get() {
        return this.$store.getters.getWidgetsByPanel(this.name_panel)
      },
      set(value) {
        if (this.$store.state.debug) console.log(value)
        this.$store.commit("updatePosWidgets", value);
      },
    },
    btnPosition(){
      return this.$store.state.addBtnPosition
    },
    editEnable() {
      return this.$store.state.editEnable;
    },
    loading() {
      return this.$store.state.loading;
    },
  },
  watch:{
    loading(value)
    {
      if (!value && !this.panel)
        this.$router.push({ name: 'Error', params: { errorCode: '404', errorMessage: "Panel "+ this.$route.params.panel+" not found!"} })
    },
    panel(value)
    {
      if (!value && !this.loading)
        this.$router.push({ name: 'Error', params: { errorCode: '404', errorMessage: "Panel "+ this.$route.params.panel+" not found!"} })
    }
  },
  mounted() {
  },
  created: function () {
    //console.log(this.widget)
}
}