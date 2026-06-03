<template>
  <v-card>
    <v-btn class="my-3" @click="process()">Magic</v-btn> This function use only "Simple devices"
    <v-simple-table dense fixed-header>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-center">Type</th>
            <th class="text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in itemsLog" :key="index">
            <td>{{ item.name }}</td>
            <td class="text-center">{{ item.type }}</td>
            <td class="text-center">{{ item.result }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-card>
</template>

<script>
import axios from "axios";
import WidgetsList from "../widgets/widgets.js";

export default {
  name: "SimpleDevices",
  data: () => ({
    itemsLog: [],
  }),
  methods: {
    async process() {
      this.itemsLog = [];
      this.itemsLog.push({ name: "Get rooms", type: "Data", result: "..." });
      //get rooms
      var response = await axios.get("/api/rooms");
      console.log(response);
      var rooms = response.data.rooms;
      this.itemsLog[0].result = rooms.length + " rooms";

      this.itemsLog.push({ name: "Get devices", type: "Data", result: "..." });
      //get devices
      response = await axios.get("/api/devices");
      console.log(response);
      var devices = response.data.devices;
      this.itemsLog[1].result = devices.length + " devices";

      var panels = this.$store.getters.allPanels;
      //TODO import rooms
      rooms.forEach((room) => {
        var res = "...";
        // TODO get room object (background)
        console.log(panels)
        var panel = panels.find((t) => t.title == room.title);
        if (panel) {
          //modify
          panel.title = room.title;
          res = "Modify";
        } else {
          //TODO add (check limit panel)
          if (panels.length <= process.env.VUE_APP_LIMIT_PANELS) {
            this.$store.commit("addPanel", {
              title: room.title,
              name: room.object,
              icon: "fas fa-home",
              image: "",
              type: "panel",
              parent: "root",
              url: "",
            });
            res = "Add";
          } else res = "Skip (limit panels)";
        }
        this.itemsLog.push({ name: room.title, type: "Room", result: res });
      });

      var widgets = this.$store.getters.allWidgets;
      //TODO import devices
      devices.forEach((device) => {
        var res = "Not supported";
        var room = rooms.find((t) => t.object == device.linkedRoom);
        console.log(room, device)
        var panel = undefined
        if (room != undefined)
           panel = panels.find((t) => t.title == room.title);
        if (panel != undefined) {
          // find widget
          var widget = widgets.find((t) => t.id == device.object);
          if (widget) {
            res = "Modify";
          } else {
            //TODO limit widget
            if (device.type == "relay") {
              [widget,res] = this.initWidget(device, "relay", panel.name)
              widget.title = device.title
              widget.icon=  device.object+".icon"
              widget.object_value = device.object+".status"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              res = "Add widget Relay";
            } else if (device.type == "dimmer") {
              [widget,res] = this.initWidget(device, "dimmer", panel.name)
              widget.title = device.title
              widget.icon=device.object+".icon"
              widget.object_status = device.object+".status"
              widget.object_level = device.object+".level"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              widget.level_min = 0
              widget.level_max = 100
              widget.level_step = 20
              res = "Add widget Dimmer";
            } else if (device.type == "rgb") {
              [widget,res] = this.initWidget(device, "rgb", panel.name)
              widget.title = device.title
              widget.icon=device.object+".icon"
              widget.object_status = device.object+".status"
              widget.object_color = device.object+".color"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              res = "Add widget RGB";
            } else if (device.type == "camera") {
              [widget,res] = this.initWidget(device, "image", panel.name)
              widget.h = 4
              widget.title = device.title
              widget.url = device.streamURL
              widget.object_alive = device.object+".alive"
              res = "Add widget Image";
            } else if (device.type == "sensor_temp" ) {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-temperature-high"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "°C"
              res = "Add widget Value";
            } else if (device.type == "sensor_humidity") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-cloud"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "%"
              res = "Add widget Value";
            } else if (device.type == "sensor_temphum" ) {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title + " температура"
              widget.icon="fas fa-temperature-high"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "°C"
              res = "Add widget Value";
              if (this.$store.state.debug) console.log("Wizard: add widget", widget);
              this.$store.commit("addWidget", widget);
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.id += "_hum"
              widget.title = device.title + " влажность"
              widget.icon="fas fa-cloud"
              widget.object_value = device.object+".valueHumidity"
              widget.object_alive = device.object+".alive"
              widget.unit = "%"
              res = "Add widget Value";
            } else if (device.type == "sensor_CO") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-cloud"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "ppm"
              res = "Add widget Value";
            } else if (device.type == "sensor_pressure") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-cloud"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "ммрт"
              res = "Add widget Value";
            } else if (device.type == "sensor_light") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-sun"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = device.unit
              res = "Add widget Value";
            } else if (device.type == "counter") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-calculator"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = device.unit
              res = "Add widget Value";
            } else if (device.type == "sensor_general") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon=""
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = device.unit
              res = "Add widget Value";
            } else if (device.type == "sensor_power") {
              [widget,res] = this.initWidget(device, "gauge", panel.name)
              widget.title = device.title
              widget.icon=""
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "Wt"
              widget.minValue = device.minValue ? device.minValue : 0
              widget.maxValue = device.maxValue ? device.maxValue : 4000
              res = "Add widget Gauge";
            } else if (device.type == "sensor_voltage") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-bolt"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "V"
              res = "Add widget Value";
            } else if (device.type == "sensor_current") {
              [widget,res] = this.initWidget(device, "value", panel.name)
              widget.title = device.title
              widget.icon="fas fa-tachometer-alt"
              widget.object_value = device.object+".value"
              widget.object_alive = device.object+".alive"
              widget.unit = "A"
              res = "Add widget Value";
            } else if (device.type == "motion") {
              [widget,res] = this.initWidget(device, "status", panel.name)
              widget.title = device.title
              widget.object_status = device.object+".status"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              widget.pre_info = device.title+" - "
              widget.statuses = [{status:0,title:"Нет никого",color:"#00ff00",icon:"fas fa-male"},
                                 {status:1,title:"Кто-то есть",color:"#ff0000",icon:"fas fa-running"}]
              res = "Add widget Status";
            } else if (device.type == "openclose") {
              [widget,res] = this.initWidget(device, "status", panel.name)
              widget.title = device.title
              widget.object_status = device.object+".status"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              widget.pre_info = device.title+" - "
              widget.statuses = [{status:0,title:"Открыто",color:"#ff0000",icon:"fas fa-door-open"},
                                 {status:1,title:"Закрыто",color:"#00ff00",icon:"fas fa-door-closed"}]
              res = "Add widget Status";
            } else if (device.type == "leak") {
              [widget,res] = this.initWidget(device, "status", panel.name)
              widget.title = device.title
              widget.object_status = device.object+".status"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              widget.pre_info = device.title+" - "
              widget.statuses = [{status:1,title:"Протечка",color:"#ff0000",icon:"fas fa-tint"},
                                 {status:0,title:"Сухо",color:"#00ff00",icon:"fas fa-tint-slash"}]
              res = "Add widget Status";
            } else if (device.type == "smoke") {
              [widget,res] = this.initWidget(device, "status", panel.name)
              widget.title = device.title
              widget.object_status = device.object+".status"
              widget.object_alive = device.object+".alive"
              widget.object_info = device.object+".updated"
              widget.pre_info = device.title+" - "
              widget.statuses = [{status:1,title:"Возгорание",color:"#ff0000",icon:"fas fa-fire"},
                                 {status:0,title:"Ок",color:"#00ff00",icon:"fas fa-fire-extinguisher"}]
              res = "Add widget Status";
            }

            if (widget)
            {
                  if (this.$store.state.debug) console.log("Wizard: add widget", widget);
                  this.$store.commit("addWidget", widget);
            }
            else res = "Not supported";
          }
        } else res = "Room not found";

        this.itemsLog.push({
          name: device.title,
          type: device.type,
          result: res,
        });
      });
      this.$store.commit("updateEditEnable", true);
    },
    initWidget(device, type, parent) {
      var support_widget = WidgetsList.all_widgets.find((t) => t.type==type);
      if (!support_widget.limit.includes(process.env.VUE_APP_TYPE))
        return [null, "Skip (limit widget)"]
      var widgets = this.$store.getters.getWidgetsByPanel(parent)
      //todo calc position
      var max = 0;
      if (widgets.length > 0) {
        max = widgets.reduce(function (prev, current) {
          return prev.y > current.y ? prev : current;
        });
      }
      console.log(max)
      var posx = widgets.length % 3 * 6;
      var posy = 0;//max.y + max.h;
      var id = device.object;
      var widget = {
        i: widgets.length + 1,
        id: id,
        type: type,
        x: posx,
        y: posy,
        w: 6,
        h: support_widget.h,
        minw: support_widget.mw,
        minh: support_widget.mh,
        parent: parent,
      };
      if (support_widget.options) {
        let options = JSON.parse(JSON.stringify(support_widget.options));
        for (const [key, value] of Object.entries(options)) {
          widget[key] = value;
        }
      }
      return [widget, "Ok"]
    },
  },
};
</script>