import { render, staticRenderFns } from "./RGB.vue?vue&type=template&id=384a18b6&"
import script from "./RGB.vue?vue&type=script&lang=js&"
export * from "./RGB.vue?vue&type=script&lang=js&"


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
import { VColorPicker } from 'vuetify/lib/components/VColorPicker';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VListItem } from 'vuetify/lib/components/VList';
import { VListItemContent } from 'vuetify/lib/components/VList';
import { VOverlay } from 'vuetify/lib/components/VOverlay';
import { VRow } from 'vuetify/lib/components/VGrid';
import { VSpacer } from 'vuetify/lib/components/VGrid';
import { VSwitch } from 'vuetify/lib/components/VSwitch';
import { VTab } from 'vuetify/lib/components/VTabs';
import { VTabItem } from 'vuetify/lib/components/VTabs';
import { VTabs } from 'vuetify/lib/components/VTabs';
import { VTabsItems } from 'vuetify/lib/components/VTabs';
import { VTextField } from 'vuetify/lib/components/VTextField';
installComponents(component, {VBtn,VCard,VCardActions,VCardText,VCardTitle,VCol,VColorPicker,VContainer,VDialog,VDivider,VListItem,VListItemContent,VOverlay,VRow,VSpacer,VSwitch,VTab,VTabItem,VTabs,VTabsItems,VTextField})
