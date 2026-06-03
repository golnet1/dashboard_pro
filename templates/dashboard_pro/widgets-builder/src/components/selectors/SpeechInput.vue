import { render, staticRenderFns } from "./SpeechInput.vue?vue&type=template&id=9f497f58&"
import script from "./SpeechInput.vue?vue&type=script&lang=js&"
export * from "./SpeechInput.vue?vue&type=script&lang=js&"


/* normalize component */
import normalizer from "!../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js"
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
import installComponents from "!../../../node_modules/vuetify-loader/lib/runtime/installComponents.js"
import { VBtn } from 'vuetify/lib/components/VBtn';
import { VIcon } from 'vuetify/lib/components/VIcon';
installComponents(component, {VBtn,VIcon})
