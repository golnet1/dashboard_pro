const SelectWidget = {
    props: ['widget'],
    tabs: [
        { key: 'params', label: 'tab_params' },
        { key: 'items', label: 'tab_items' },
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
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
        ],
        items: [],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
        ],
    },
    defaults: () => ({ icon: 'fas fa-list', icon_type: 'icon', height: 130, items: JSON.stringify([{state:window.__t('default_off'),title:window.__t('default_off')},{state:window.__t('default_on'),title:window.__t('default_on')}]) }),
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_select') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px;flex:1;display:flex;flex-direction:column;gap:6px">
                <div class="dp-picker-field" @click.stop="openPopup">
                    <i v-if="currentIcon" :class="currentIcon" style="font-size:.85rem"></i>
                    <span :class="{ 'dp-picker-field--empty': !currentLabel }">{{ currentLabel || t('field_pick_value') }}</span>
                    <i class="fas fa-chevron-down" style="font-size:.7rem;margin-left:auto"></i>
                </div>
                <div v-if="open" class="dp-picker-popup dp-select-popup" :style="popupStyle" @click.stop>
                    <div v-for="opt in options" :key="opt.state" class="dp-select-popup__item"
                        :class="{ 'dp-select-popup__item--selected': currentValue == opt.state }"
                        @click="select(opt)">
                        <i v-if="opt.icon" :class="opt.icon" style="width:20px;text-align:center"></i>
                        <span>{{ opt.title }}</span>
                        <i v-if="currentValue == opt.state" class="fas fa-check" style="margin-left:auto;color:var(--primary)"></i>
                    </div>
                    <div v-if="!options.length" class="dp-select-popup__empty">{{ t('field_no_options') }}</div>
                </div>
            </div>
        </div>`,
    data() {
        return { currentValue: null, open: false, popup: { top: 0, left: 0, width: 0 }, loading: false, timer: null, isAlive: true, availTimer: null };
    },
    computed: {
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        options() {
            if (!this.widget.items) return [];
            try {
                const opts = typeof this.widget.items === 'string' ? JSON.parse(this.widget.items) : this.widget.items;
                return Array.isArray(opts) ? opts : [];
            } catch(e) { return []; }
        },
        currentOpt() {
            return this.options.find(o => String(o.state) === String(this.currentValue)) || null;
        },
        currentLabel() {
            return this.currentOpt ? this.currentOpt.title : '';
        },
        currentIcon() {
            return this.currentOpt ? this.currentOpt.icon : '';
        },
        popupStyle() {
            return { position: 'fixed', top: this.popup.top + 'px', left: this.popup.left + 'px', minWidth: this.popup.width ? this.popup.width + 'px' : '' };
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        let prop = this.widget.property;
        if (obj && prop && !window.__dpWsLive) this.timer = setInterval(() => this.loadValue(), 5000);
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
        document.addEventListener('click', this.onDocClick);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.availTimer) clearInterval(this.availTimer);
        document.removeEventListener('click', this.onDocClick);
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async loadValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (!d.error && d.value !== undefined) this.currentValue = d.value;
            } catch (e) { /* silent */ }
        },
        onDocClick() { this.open = false; },
        openPopup(e) {
            if (this.aliveDisabled) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const w = Math.max(rect.width, 200);
            const estH = Math.min(this.options.length * 40 + 16, 300);
            const top = (rect.bottom + estH + 8 > window.innerHeight) ? Math.max(4, rect.top - estH - 6) : rect.bottom + 4;
            const left = Math.min(rect.left, Math.max(4, window.innerWidth - w - 8));
            this.popup = { top: top, left: left, width: w };
            this.open = true;
        },
        async select(opt) {
            if (this.loading) return;
            this.loading = true;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: prop || 'status', value: String(opt.state) }));
                this.currentValue = opt.state;
                this.open = false;
            } catch (e) { /* silent */ }
            this.loading = false;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.select = SelectWidget;