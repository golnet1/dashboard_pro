import { render, staticRenderFns } from "./Table.vue?vue&type=template&id=15effe15&"
import script from "./Table.vue?vue&type=script&lang=js&"
export * from "./Table.vue?vue&type=script&lang=js&"


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
import { VBtnToggle } from 'vuetify/lib/components/VBtnToggle';
import { VCard } from 'vuetify/lib/components/VCard';
import { VCardActions } from 'vuetify/lib/components/VCard';
import { VCardText } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VChip } from 'vuetify/lib/components/VChip';
import { VCol } from 'vuetify/lib/components/VGrid';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VDataTable } from 'vuetify/lib/components/VDataTable';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VIcon } from 'vuetify/lib/components/VIcon';
import { VImg } from 'vuetify/lib/components/VImg';
import { VProgressLinear } from 'vuetify/lib/components/VProgressLinear';
import { VRow } from 'vuetify/lib/components/VGrid';
import { VSelect } from 'vuetify/lib/components/VSelect';
import { VSimpleCheckbox } from 'vuetify/lib/components/VCheckbox';
import { VSpacer } from 'vuetify/lib/components/VGrid';
import { VSwitch } from 'vuetify/lib/components/VSwitch';
import { VTab } from 'vuetify/lib/components/VTabs';
import { VTabItem } from 'vuetify/lib/components/VTabs';
import { VTabs } from 'vuetify/lib/components/VTabs';
import { VTabsItems } from 'vuetify/lib/components/VTabs';
import { VTextField } from 'vuetify/lib/components/VTextField';
import { VTextarea } from 'vuetify/lib/components/VTextarea';
import { VTooltip } from 'vuetify/lib/components/VTooltip';
installComponents(component, {VBtn,VBtnToggle,VCard,VCardActions,VCardText,VCardTitle,VChip,VCol,VContainer,VDataTable,VDialog,VDivider,VIcon,VImg,VProgressLinear,VRow,VSelect,VSimpleCheckbox,VSpacer,VSwitch,VTab,VTabItem,VTabs,VTabsItems,VTextField,VTextarea,VTooltip})


/* vuetify-loader */
import installDirectives from "!../../node_modules/vuetify-loader/lib/runtime/installDirectives.js"
import Resize from 'vuetify/lib/directives/resize'
installDirectives(component, {Resize})
