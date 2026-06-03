import { render, staticRenderFns } from "./Error.vue?vue&type=template&id=633b5774&"
import script from "./Error.vue?vue&type=script&lang=js&"
export * from "./Error.vue?vue&type=script&lang=js&"


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
import { VApp } from 'vuetify/lib/components/VApp';
import { VBtn } from 'vuetify/lib/components/VBtn';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VLayout } from 'vuetify/lib/components/VGrid';
installComponents(component, {VApp,VBtn,VContainer,VLayout})
