import '@fortawesome/fontawesome-free/css/all.css' // Ensure you are using css-loader
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import ru from 'vuetify/es5/locale/ru'
import en from 'vuetify/es5/locale/en'

Vue.use(Vuetify);

export default new Vuetify({
    icons: {
        iconfont: 'fa',
    },
    lang: {
        locales: { ru, en },
        current: 'en'
    }
});