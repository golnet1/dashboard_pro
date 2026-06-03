import { render, staticRenderFns } from "./IconView.vue?vue&type=template&id=7e7dd006&"
import script from "./IconView.vue?vue&type=script&lang=js&"
export * from "./IconView.vue?vue&type=script&lang=js&"


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
import { VAvatar } from 'vuetify/lib/components/VAvatar';
import { VIcon } from 'vuetify/lib/components/VIcon';
installComponents(component, {VAvatar,VIcon})
