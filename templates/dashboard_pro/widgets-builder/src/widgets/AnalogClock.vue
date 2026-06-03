import { render, staticRenderFns } from "./AnalogClock.vue?vue&type=template&id=0271390b&scoped=true&"
import script from "./AnalogClock.vue?vue&type=script&lang=js&"
export * from "./AnalogClock.vue?vue&type=script&lang=js&"
import style0 from "./AnalogClock.vue?vue&type=style&index=0&id=0271390b&scoped=true&lang=css&"


/* normalize component */
import normalizer from "!../../node_modules/vue-loader/lib/runtime/componentNormalizer.js"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  false,
  null,
  "0271390b",
  null
  
)

export default component.exports

/* vuetify-loader */
import installComponents from "!../../node_modules/vuetify-loader/lib/runtime/installComponents.js"
import { VBtn } from 'vuetify/lib/components/VBtn';
import { VCard } from 'vuetify/lib/components/VCard';
import { VCardActions } from 'vuetify/lib/components/VCard';
import { VCardText } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VCol } from 'vuetify/lib/components/VGrid';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VSelect } from 'vuetify/lib/components/VSelect';
import { VSpacer } from 'vuetify/lib/components/VGrid';
import { VTextField } from 'vuetify/lib/components/VTextField';
installComponents(component, {VBtn,VCard,VCardActions,VCardText,VCardTitle,VCol,VContainer,VDialog,VDivider,VSelect,VSpacer,VTextField})


/* vuetify-loader */
import installDirectives from "!../../node_modules/vuetify-loader/lib/runtime/installDirectives.js"
import Resize from 'vuetify/lib/directives/resize'
installDirectives(component, {Resize})
