import { render, staticRenderFns } from "./AddWidgetDialog.vue?vue&type=template&id=03b389e5&"
import script from "./AddWidgetDialog.vue?vue&type=script&lang=js&"
export * from "./AddWidgetDialog.vue?vue&type=script&lang=js&"


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
import { VChip } from 'vuetify/lib/components/VChip';
import { VDialog } from 'vuetify/lib/components/VDialog';
import { VDivider } from 'vuetify/lib/components/VDivider';
import { VIcon } from 'vuetify/lib/components/VIcon';
import { VList } from 'vuetify/lib/components/VList';
import { VListItem } from 'vuetify/lib/components/VList';
import { VListItemAction } from 'vuetify/lib/components/VList';
import { VListItemAvatar } from 'vuetify/lib/components/VList';
import { VListItemContent } from 'vuetify/lib/components/VList';
import { VListItemSubtitle } from 'vuetify/lib/components/VList';
import { VListItemTitle } from 'vuetify/lib/components/VList';
import { VMenu } from 'vuetify/lib/components/VMenu';
import { VSpacer } from 'vuetify/lib/components/VGrid';
installComponents(component, {VBtn,VCard,VCardActions,VCardText,VCardTitle,VChip,VDialog,VDivider,VIcon,VList,VListItem,VListItemAction,VListItemAvatar,VListItemContent,VListItemSubtitle,VListItemTitle,VMenu,VSpacer})
