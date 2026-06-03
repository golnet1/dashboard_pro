import { render, staticRenderFns } from "./ValueView.vue?vue&type=template&id=a327bfcc&"
import script from "./ValueView.vue?vue&type=script&lang=js&"
export * from "./ValueView.vue?vue&type=script&lang=js&"


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
import { VListItemSubtitle } from 'vuetify/lib/components/VList';
installComponents(component, {VListItemSubtitle})
