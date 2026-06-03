import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify';
import router from './router'
import VuetifyConfirm from "vuetify-confirm";
import VueNativeNotification from 'vue-native-notification'
import VueMeta from 'vue-meta'

Vue.use(VueMeta)

import VueTheMask from 'vue-the-mask'
Vue.use(VueTheMask)

Vue.use(VueNativeNotification, {
  // Automatic permission request before
  // showing notification (default: true)
  requestOnNotify: true
})

import VueCookies from 'vue-cookies'
Vue.use(VueCookies)
// 365 day expiried
Vue.$cookies.config('365d')

var language = navigator.language || navigator.userLanguage
//language = "en-EN"
console.log("Current language",language)
// initialize the vuex-i18 module
import vuexI18n from 'vuex-i18n'
Vue.use(vuexI18n.plugin, store)
// import predefined localizations
import translationsEn from './i18n/en.js'
import translationsRu from './i18n/ru.js'
// add translations
Vue.i18n.add('en-EN', translationsEn)
Vue.i18n.add('ru-RU', translationsRu)

import moment from 'moment'
import 'moment/locale/ru'  // without this line it didn't work

// set locale is browser language
if (language == "ru-RU" || language == "ru")
{
  Vue.i18n.set("ru-RU")
  store.state.language = "ru-RU"
  moment.locale('ru')
}
else
{
  Vue.i18n.set("en-EN")
  store.state.language = "en-EN"
  moment.locale('en')
}
vuetify.framework.lang.current = language.split('-')[0]

Vue.config.productionTip = false

import VueFriendlyIframe from 'vue-friendly-iframe';
Vue.use(VueFriendlyIframe);
import VueGeolocation from 'vue-browser-geolocation';
Vue.use(VueGeolocation);

import SelectObject from "./components/selectors/SelectObject.vue";
Vue.component("select-object", SelectObject);
import IconInput from "./components/selectors/IconInput.vue";
Vue.component("icon-input", IconInput);
import ColorInput from "./components/selectors/ColorInput.vue";
Vue.component("color-input", ColorInput);
import SelectColor from "./components/selectors/SelectColor.vue";
Vue.component("select-color", SelectColor);
import SelectProperty from "./components/selectors/SelectProperty.vue";
Vue.component("select-property", SelectProperty);
import SelectMethod from "./components/selectors/SelectMethod.vue";
Vue.component("select-method", SelectMethod);
import SelectObjectProperty from "./components/selectors/SelectObjectProperty.vue";
Vue.component("select-objectproperty", SelectObjectProperty);
import SelectObjectMethod from "./components/selectors/SelectObjectMethod.vue";
Vue.component("select-objectmethod", SelectObjectMethod);
import SelectScript from "./components/selectors/SelectScript.vue";
Vue.component("select-script", SelectScript);
import IconView from "./components/view/IconView.vue";
Vue.component("icon-view", IconView);
import ValueView from "./components/view/ValueView.vue";
Vue.component("value-view", ValueView);

//responsive

import ListViewAvatar from "./components/responsive/ListItemAvatar.vue";
Vue.component("resv-list-item-avatar", ListViewAvatar);
import ListViewTitle from "./components/responsive/ListItemTitle.vue";
Vue.component("resv-list-item-title", ListViewTitle);
import ListViewSubtitle from "./components/responsive/ListItemSubtitle.vue";
Vue.component("resv-list-item-subtitle", ListViewSubtitle);

//widgets


import Test from "./widgets/Test.vue";
Vue.component("widget-test", Test);
import Unknown from "./widgets/Unknown.vue";
Vue.component("widget-unknown", Unknown);
import PanelLink from "./widgets/PanelLink.vue";
Vue.component("widget-panellink", PanelLink);
import Clock from "./widgets/Clock.vue";
Vue.component("widget-clock", Clock);
import AnalogClock from "./widgets/AnalogClock.vue";
Vue.component("widget-analogclock", AnalogClock);
import Gauge from "./widgets/Gauge.vue";
Vue.component("widget-gauge", Gauge);
import Relay from "./widgets/Relay.vue";
Vue.component("widget-relay", Relay);
import Dimmer from "./widgets/Dimmer.vue";
Vue.component("widget-dimmer", Dimmer);
import Select from "./widgets/Select.vue";
Vue.component("widget-select", Select);
import TimePicker from "./widgets/TimePicker.vue";
Vue.component("widget-timepicker", TimePicker);
import DatePicker from "./widgets/DatePicker.vue";
Vue.component("widget-datepicker", DatePicker);
import Text from "./widgets/Text.vue";
Vue.component("widget-text", Text);
import Value from "./widgets/Value.vue";
Vue.component("widget-value", Value);
import Image from "./widgets/Image.vue";
Vue.component("widget-image", Image);
import Button from "./widgets/Button.vue";
Vue.component("widget-button", Button);
import Status from "./widgets/Status.vue";
Vue.component("widget-status", Status);
import SendText from "./widgets/SendText.vue";
Vue.component("widget-send_text", SendText);
import Slider from "./widgets/Slider.vue";
Vue.component("widget-slider", Slider);
import RoundSliderWidget from "./widgets/RoundSlider.vue";
Vue.component("widget-roundslider", RoundSliderWidget);
import RGB from "./widgets/RGB.vue";
Vue.component("widget-rgb", RGB);
import Graph from "./widgets/Graph.vue";
Vue.component("widget-graph", Graph);
import BarGraph from "./widgets/BarGraph.vue";
Vue.component("widget-bar_graph", BarGraph);
import Timeline from "./widgets/Timeline.vue";
Vue.component("widget-timeline", Timeline);
import MapWidget from "./widgets/Map.vue";
Vue.component("widget-map", MapWidget);
import Weather from "./widgets/Weather.vue";
Vue.component("widget-weather", Weather);
import IFrame from "./widgets/IFrame.vue";
Vue.component("widget-iframe", IFrame);
import Group from "./widgets/Group.vue";
Vue.component("widget-group", Group);
import ProgressBar from "./widgets/ProgressBar.vue";
Vue.component("widget-progressbar", ProgressBar);
import Table from "./widgets/Table.vue";
Vue.component("widget-table", Table);


import Chat from 'vue-beautiful-chat'
Vue.use(Chat)

String.prototype.format = function() {
  var a = this;
  for (var k in arguments) {
    a = a.replace("{" + k + "}", arguments[k])
  }
  return a
}

import { Icon } from 'leaflet';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
  return this;
};

Vue.use(VuetifyConfirm, {
  vuetify
});

import VueMasonry from 'vue-masonry-css'
Vue.use(VueMasonry);

new Vue({
  store,
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
