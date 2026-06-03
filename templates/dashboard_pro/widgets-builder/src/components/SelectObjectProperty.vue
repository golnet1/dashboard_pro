import { render, staticRenderFns } from "./SelectObjectProperty.vue?vue&type=template&id=4ed7db4c&"
import script from "./SelectObjectProperty.vue?vue&type=script&lang=js&"
export * from "./SelectObjectProperty.vue?vue&type=script&lang=js&"


/* normalize component */
import normalizer from "!../../node_modules/vue-loader/lib/runtime/componentNormalizer.js"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

export default component.exports

/* vuetify-loader */
import installComponents from "!../../node_modules/vuetify-loader/lib/runtime/installComponents.js"
import { VBtn } from 'vuetify/lib/components/VBtn';
import { VCol } from 'vuetify/lib/components/VGrid';
import { VIcon } from 'vuetify/lib/components/VIcon';
import { VRow } from 'vuetify/lib/components/VGrid';
import { VTooltip } from 'vuetify/lib/components/VTooltip';
installComponents(component, {VBtn,VCol,VIcon,VRow,VTooltip})
