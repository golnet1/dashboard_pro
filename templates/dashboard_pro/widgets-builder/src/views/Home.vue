import { render, staticRenderFns } from "./Home.vue?vue&type=template&id=8f457ae4&"
import script from "./Home.vue?vue&type=script&lang=js&"
export * from "./Home.vue?vue&type=script&lang=js&"


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
import { VContainer } from 'vuetify/lib/components/VGrid';
import { VFlex } from 'vuetify/lib/components/VGrid';
import { VIcon } from 'vuetify/lib/components/VIcon';
import { VImg } from 'vuetify/lib/components/VImg';
import { VLayout } from 'vuetify/lib/components/VGrid';
import { VListItem } from 'vuetify/lib/components/VList';
import { VListItemAvatar } from 'vuetify/lib/components/VList';
import { VListItemContent } from 'vuetify/lib/components/VList';
import { VListItemTitle } from 'vuetify/lib/components/VList';
import { VTooltip } from 'vuetify/lib/components/VTooltip';
installComponents(component, {VBtn,VBtnToggle,VCard,VContainer,VFlex,VIcon,VImg,VLayout,VListItem,VListItemAvatar,VListItemContent,VListItemTitle,VTooltip})
