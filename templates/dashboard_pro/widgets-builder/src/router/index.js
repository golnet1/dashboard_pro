import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Panel from '../views/Panel.vue'
import Flex from '../views/Flex.vue'
import Page from '../views/Page.vue'
import Waterfall from '../views/Waterfall.vue'
import Dnd from '../views/Dnd.vue'
import Settings from '../views/Settings.vue'
import SettingsBar from '../views/SettingsBar.vue'
import System from '../views/System.vue'
import About from '../views/About.vue'
import Wizard from "../views/Wizard.vue"
import Events from "../views/Events.vue"
import Error from "../views/Error.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/group/:group',
    name: 'Group',
    component: Home,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/settingsbar',
    name: 'SettingsBar',
    component: SettingsBar,
  },
  {
    path: '/system',
    name: 'System',
    component: System,
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/wizard',
    name: 'Wizard',
    component: Wizard
  },
  {
    path: '/events',
    name: 'Events',
    component: Events
  },
  {
    path: '/panel/:panel',
    name: 'Panel',
    component: Panel,
  },
  {
    path: '/flex/:panel',
    name: 'Flex',
    component: Flex,
  },
  {
    path: '/waterfall/:panel',
    name: 'Waterfall',
    component: Waterfall,
  },
  {
    path: '/dnd/:panel',
    name: 'Dnd',
    component: Dnd,
  },
  {
    path: '/page/:page',
    name: 'Page',
    component: Page,
  },
  { path: '*', component: Error },
  {
      path: '/error',
      name: 'Error',
      component: Error,
      meta: {
        allowAnonymous: true
      }
  },
]

const router = new VueRouter({
  routes
})

export default router
