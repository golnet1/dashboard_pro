import { render, staticRenderFns } from "./ListItemAvatar.vue?vue&type=template&id=0efbe620&"
import script from "./ListItemAvatar.vue?vue&type=script&lang=js&"
export * from "./ListItemAvatar.vue?vue&type=script&lang=js&"


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
import { VListItemAvatar } from 'vuetify/lib/components/VList';
installComponents(component, {VListItemAvatar})
