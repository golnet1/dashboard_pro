import { render, staticRenderFns } from "./HistoryDialog.vue?vue&type=template&id=3f6d4b7b&"
import script from "./HistoryDialog.vue?vue&type=script&lang=js&"
export * from "./HistoryDialog.vue?vue&type=script&lang=js&"


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
import { VBtn } from 'vuetify/lib/components/VBtn';
import { VCard } from 'vuetify/lib/components/VCard';
import { VCardActions } from 'vuetify/lib/components/VCard';
import { VCardText } from 'vuetify/lib/components/VCard';
import { VCardTitle } from 'vuetify/lib/components/VCard';
import { VCol } from 'vuetify/lib/components/VGrid';
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VDataTable } from 'vuetify/lib/components/VDataTable';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VProgressCircular } from 'vuetify/lib/components/VProgressCircular';
import { VRow } from 'vuetify/lib/components/VGrid';
import { VSelect } from 'vuetify/lib/components/VSelect';
import { VSpacer } from 'vuetify/lib/components/VGrid';
installComponents(component, {VBtn,VCard,VCardActions,VCardText,VCardTitle,VCol,VContainer,VDataTable,VDialog,VDivider,VProgressCircular,VRow,VSelect,VSpacer})
