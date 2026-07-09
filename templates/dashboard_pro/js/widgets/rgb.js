const RGBWidget = {
    props: ['widget'],
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
            { key: 'object_color_obj', label: 'field_bg_object', type: 'method_object', parent: 'object_color', row: 'm_color' },
            { key: 'object_color', label: 'field_color_method', type: 'method', parent: 'object_color', row: 'm_color' },
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
        ],
    },
    defaults: { icon: 'fas fa-palette', icon_type: 'icon', property: 'status', background: false, round: false },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || 'RGB' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div class="widget-v-card__body" style="padding:4px 12px 12px;display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="color" v-model="currentColor" @input="onColorChange" style="width:100%;height:40px;background:transparent;border:1px solid rgba(255,255,255,.2);border-radius:4px;cursor:pointer">
                    <span style="font-size:.8rem;font-family:monospace;color:rgba(255,255,255,.6)">{{ currentColor }}</span>
                </div>
            </div>
        </div>`,
    data() {
        return { isOn: false, currentColor: '#ffffff', loading: false, timer: null, colorTimer: null };
    },
    mounted() {
        this.loadState();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadState(), 5000);
        if (this.widget.object_color) {
            this.loadColor();
            this.colorTimer = setInterval(() => this.loadColor(), 5000);
        }
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.colorTimer) clearInterval(this.colorTimer);
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadState() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop || 'status' }));
                if (!d.error) {
                    const val = typeof d.value === 'string' ? d.value : String(d.value);
                    this.isOn = val === '1' || val === 'ON' || val === 'true';
                }
            } catch (e) { /* silent */ }
        },
        async loadColor() {
            if (!this.widget.object_color) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_color }));
                if (!d.error && d.value) {
                    let c = String(d.value);
                    if (c.startsWith('#')) this.currentColor = c;
                    else this.currentColor = '#' + c.substring(0, 6);
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading) return;
            this.loading = true;
            const next = !this.isOn;
            let obj = this.widget.object_value || this.widget.object;
            try {
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
                        object: obj, property: this.widget.property || 'status', value: next ? '1' : '0'
                    }));
                }
                this.isOn = next;
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        async onColorChange() {
            if (!this.widget.object_color) return;
            try {
                const hex = this.currentColor.replace('#', '');
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: this.widget.object_color, value: hex
                }));
            } catch (e) { /* silent */ }
        }
    }
};