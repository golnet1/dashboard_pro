import { render, staticRenderFns } from "./SelectObject.vue?vue&type=template&id=1047b872&"
import script from "./SelectObject.vue?vue&type=script&lang=js&"
export * from "./SelectObject.vue?vue&type=script&lang=js&"


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
import { VAutocomplete } from 'vuetify/lib/components/VAutocomplete';
installComponents(component, {VAutocomplete})
