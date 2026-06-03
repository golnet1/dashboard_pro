import { render, staticRenderFns } from "./About.vue?vue&type=template&id=13756d0e&"
import script from "./About.vue?vue&type=script&lang=js&"
export * from "./About.vue?vue&type=script&lang=js&"


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
import { VAvatar } from 'vuetify/lib/components/VAvatar';
import { VChip } from 'vuetify/lib/components/VChip';
import { VIcon } from 'vuetify/lib/components/VIcon';
import { VImg } from 'vuetify/lib/components/VImg';
import { VSimpleTable } from 'vuetify/lib/components/VDataTable';
installComponents(component, {VAvatar,VChip,VIcon,VImg,VSimpleTable})
