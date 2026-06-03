import { render, staticRenderFns } from "./Test.vue?vue&type=template&id=15fe3c87&"
import script from "./Test.vue?vue&type=script&lang=js&"
export * from "./Test.vue?vue&type=script&lang=js&"


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
import { VCardText } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VListItem } from 'vuetify/lib/components/VList';
import { VListItemContent } from 'vuetify/lib/components/VList';
import { VListItemTitle } from 'vuetify/lib/components/VList';
installComponents(component, {VCard,VCardText,VCardTitle,VDialog,VListItem,VListItemContent,VListItemTitle})
