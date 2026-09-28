const SlideShowWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'slides', label: 'tab_slides' },
        { key: 'advanced', label: 'tab_advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'cycle', label: 'field_cycle', type: 'checkbox', default: true },
            { key: 'period', label: 'field_period', type: 'number', default: 5, step: 1, showIf: { cycle: true } },
            { key: 'contain', label: 'field_contain', type: 'checkbox', default: false },
        ],
        slides: [
        ],
        advanced: [
            { key: 'hide_arrows', label: 'field_hide_arrows', type: 'checkbox', default: false },
            { key: 'hide_delimiters', label: 'field_hide_delimiters', type: 'checkbox', default: false },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1, default: 3 },
        ],
    },
    defaults: { icon: 'fas fa-images', icon_type: 'icon', slides: '[]', cycle: true, period: 5, contain: false, hide_arrows: false, hide_delimiters: false, height: 200 },
    template: `
        <div class="widget-v-card dp-slides" :style="cardStyleStr" @mouseenter="hover = true" @mouseleave="hover = false">
            <template v-if="slides.length">
                <img v-for="(s, si) in slides" :key="si" class="dp-slides__img" :src="s.src"
                     :style="'object-fit:' + fit + ';opacity:' + (si === index && !imgError[si] ? 1 : 0)"
                     @load="onLoaded(si)" @error="onError(si)">
                <div v-if="showSpinner" class="dp-slides__center"><i class="fas fa-circle-notch fa-spin"></i></div>
                <div v-if="currentError" class="dp-slides__center"><i class="fas fa-eye-slash"></i></div>
                <div v-if="currentTitle" class="dp-slides__title">{{ currentTitle }}</div>
                <button v-if="showArrows" type="button" class="dp-slides__arrow dp-slides__arrow--prev" :class="{ 'dp-slides__arrow--on': hover }" @click.stop="go(index - 1)"><i class="fas fa-chevron-left"></i></button>
                <button v-if="showArrows" type="button" class="dp-slides__arrow dp-slides__arrow--next" :class="{ 'dp-slides__arrow--on': hover }" @click.stop="go(index + 1)"><i class="fas fa-chevron-right"></i></button>
                <div v-if="showDelimiters" class="dp-slides__dots">
                    <span v-for="(s, si) in slides" :key="'d' + si" class="dp-slides__dot" :class="{ 'dp-slides__dot--active': si === index }" @click.stop="go(si)"></span>
                </div>
                <div v-if="dead" class="dp-slides__dead"></div>
            </template>
            <div v-else class="dp-slides__empty">{{ t('no_images') }}</div>
        </div>`,
    data() {
        return { index: 0, timer: null, hover: false, imgLoading: {}, imgError: {}, isAlive: true, availTimer: null };
    },
    computed: {
        slides() {
            let arr = [];
            if (this.widget.slides) {
                try { const p = JSON.parse(this.widget.slides); if (Array.isArray(p)) arr = p; } catch (e) { /* fall through to the legacy list */ }
            }
            if (!arr.length && this.widget.images) {
                arr = String(this.widget.images).split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(src => ({ title: '', src }));
            }
            return arr.filter(s => s && s.src);
        },
        cardStyle() {
            const s = {};
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            if (mode === 'color' && this.widget.color) s.backgroundColor = this.widget.color;
            else if (mode === 'image' && this.widget.bg_image) {
                s.backgroundImage = 'url(' + this.widget.bg_image + ')';
                s.backgroundSize = 'cover';
                s.backgroundPosition = 'center';
            }
            if (this.widget.height) s.height = this.widget.height + 'px';
            return s;
        },
        cardStyleStr() {
            const s = this.cardStyle;
            return Object.keys(s).map(k => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + ':' + s[k]).join(';');
        },
        periodMs() {
            const p = this.widget.period;
            if (p === '' || p === null || p === undefined) return 5000;
            const n = Number(p);
            return n > 0 ? n * 1000 : 0;
        },
        cycling() {
            const c = this.widget.cycle;
            return this.slides.length > 1 && this.periodMs > 0 && c !== false && c !== 0 && c !== '0' && c !== '';
        },
        fit() { return this.widget.contain ? 'contain' : 'cover'; },
        current() { return this.slides[this.index] || null; },
        currentTitle() { return this.current && this.current.title ? String(this.current.title) : ''; },
        currentError() { return !!this.imgError[this.index]; },
        showSpinner() { return !!this.imgLoading[this.index] && !this.currentError; },
        showArrows() { return !this.widget.hide_arrows && this.slides.length > 1; },
        showDelimiters() { return !this.widget.hide_delimiters && this.slides.length > 1; },
        dead() { return !!(this.widget.object_alive && this.widget.property_alive && this.isAlive === false); },
    },
    watch: {
        'widget.period': 'restart',
        'widget.cycle': 'restart',
        'widget.slides': 'restart',
        slides() { if (this.index >= this.slides.length) this.index = 0; this.markLoading(); this.restart(); },
    },
    mounted() {
        this.markLoading();
        this.restart();
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() {
        this.stop();
        if (this.availTimer) clearInterval(this.availTimer);
    },
    methods: {
        markLoading() {
            const next = {};
            this.slides.forEach((s, i) => { next[i] = !this.imgError[i]; });
            this.imgLoading = next;
        },
        start() {
            this.stop();
            if (this.cycling) this.timer = setInterval(() => this.next(), this.periodMs);
        },
        stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
        restart() { this.start(); },
        next() { this.go(this.index + 1); },
        go(i) {
            const n = this.slides.length;
            if (!n) return;
            this.index = ((i % n) + n) % n;
        },
        onLoaded(i) { this.imgLoading[i] = false; this.imgError[i] = false; },
        onError(i) { this.imgLoading[i] = false; this.imgError[i] = true; },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.slideshow = SlideShowWidget;
