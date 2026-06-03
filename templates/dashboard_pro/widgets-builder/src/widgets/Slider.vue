import { render, staticRenderFns } from "./Slider.vue?vue&type=template&id=1c28b9e2&"
import script from "./Slider.vue?vue&type=script&lang=js&"
export * from "./Slider.vue?vue&type=script&lang=js&"


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
import { VCardActions } from 'vuetify/lib/components/VCard';
import { VCardText } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VCol } from 'vuetify/lib/components/VGrid';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VListItem } from 'vuetify/lib/components/VList';
import { VListItemContent } from 'vuetify/lib/components/VList';
import { VListItemSubtitle } from 'vuetify/lib/components/VList';
import { VOverlay } from 'vuetify/lib/components/VOverlay';
import { VRow } from 'vuetify/lib/components/VGrid';
import { VSlider } from 'vuetify/lib/components/VSlider';
import { VSpacer } from 'vuetify/lib/components/VGrid';
import { VTextField } from 'vuetify/lib/components/VTextField';
installComponents(component, {VBtn,VCard,VCardActions,VCardText,VCardTitle,VCol,VContainer,VDialog,VDivider,VListItem,VListItemContent,VListItemSubtitle,VOverlay,VRow,VSlider,VSpacer,VTextField})
