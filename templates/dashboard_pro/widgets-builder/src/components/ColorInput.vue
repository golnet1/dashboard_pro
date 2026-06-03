import { render, staticRenderFns } from "./ColorInput.vue?vue&type=template&id=68293e98&"
import script from "./ColorInput.vue?vue&type=script&lang=js&"
export * from "./ColorInput.vue?vue&type=script&lang=js&"


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
import { VCard } from 'vuetify/lib/components/VCard';
import { VCardText } from 'vuetify/lib/components/VCard';
import { VColorPicker } from 'vuetify/lib/components/VColorPicker';
import { VMenu } from 'vuetify/lib/components/VMenu';
import { VTextField } from 'vuetify/lib/components/VTextField';
import { VTooltip } from 'vuetify/lib/components/VTooltip';
installComponents(component, {VBtn,VCard,VCardText,VColorPicker,VMenu,VTextField,VTooltip})
