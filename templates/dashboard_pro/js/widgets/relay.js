const RelayWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
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
            { key: 'object_switch_obj', label: 'field_switch_object', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_switch', label: 'field_switch_method', type: 'method', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_on_obj', label: 'field_on_object', type: 'method_object', parent: 'object_on', row: 'm_on' },
            { key: 'object_on', label: 'field_on_method', type: 'method', parent: 'object_on', row: 'm_on' },
            { key: 'object_off_obj', label: 'field_off_object', type: 'method_object', parent: 'object_off', row: 'm_off' },
            { key: 'object_off', label: 'field_off_method', type: 'method', parent: 'object_off', row: 'm_off' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
            { key: 'object_info', label: 'field_object_info', type: 'object', row: 'info_row' },
            { key: 'property_info', label: 'field_info_property', type: 'property', row: 'info_row' },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-power-off', icon_type: 'icon', background: false, round: false },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_relay') }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" :style="aliveDisabled ? 'opacity:.4;pointer-events:none' : ''" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div v-if="widget.object_info && infoValue" class="widget-v-card__info">
                <span v-if="widget.pre_info">{{ widget.pre_info }}</span>{{ infoValue }}<span v-if="widget.pos_info">{{ widget.pos_info }}</span>
            </div>
            <div v-if="loading" class="widget-v-card__loading"><div class="v-progress-linear v-progress-linear--active"><div class="v-progress-linear__determinate" style="width:100%"></div></div></div>
        </div>`,
    data() {
        return { isOn: false, loading: false, infoValue: '', timer: null, infoTimer: null, isAlive: true };
    },
    mounted() {
        this.poll();
        this.timer = setInterval(() => this.poll(), 3000);
        if (this.widget.object_info) this.loadInfo();
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.infoTimer) clearInterval(this.infoTimer);
    },
    computed: {
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async poll() {
            if (this.widget.object_value || this.widget.object) this.loadState();
            if (this.widget.object_alive && this.widget.property_alive) this.checkAlive();
        },
        async loadState() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error) {
                    const val = typeof d.value === 'string' ? d.value : String(d.value);
                    this.isOn = val === '1' || val === 'ON' || val === 'true';
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading || this.aliveDisabled) return;
            this.loading = true;
            const next = !this.isOn;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (this.widget.object_switch) {
                const p = this.widget.object_switch.split('/');
                await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
            } else if (this.widget.object_on && this.widget.object_off) {
                const pon = this.widget.object_on.split('/');
                const poff = this.widget.object_off.split('/');
                const p = next ? pon : poff;
                await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
            } else {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: prop || 'status', value: next ? '1' : '0'
                }));
            }
            this.isOn = next;
            this.loading = false;
        },
        async loadInfo() {
            if (!this.widget.object_info) return;
            try {
                const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error) this.infoValue = d.value;
            } catch (e) { /* silent */ }
            this.infoTimer = setInterval(() => {
                if (this.widget.object_info) {
                    const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                    dpAPI('getProperty?' + new URLSearchParams(params))
                        .then(d => { if (!d.error) this.infoValue = d.value; })
                        .catch(() => {});
                }
            }, 5000);
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        }
    }
};