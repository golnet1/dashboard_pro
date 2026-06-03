import { render, staticRenderFns } from "./System.vue?vue&type=template&id=339bd10c&"
import script from "./System.vue?vue&type=script&lang=js&"
export * from "./System.vue?vue&type=script&lang=js&"


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
import { VCard } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VChip } from 'vuetify/lib/components/VChip';
import { VDataTable } from 'vuetify/lib/components/VDataTable';
import { VTextField } from 'vuetify/lib/components/VTextField';
installComponents(component, {VCard,VCardTitle,VChip,VDataTable,VTextField})
