const GradientSliderWidget = {
    props: ['widget'],
    tabs: [
        { key: 'params', label: 'tab_params' },
        { key: 'colors', label: 'tab_colors' },
        { key: 'advanced', label: 'tab_advanced' }
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
            { key: 'min', label: 'field_min', type: 'number', row: 'range' },
            { key: 'max', label: 'field_max', type: 'number', row: 'range' },
            { key: 'step', label: 'field_step', type: 'number', step: 'any', row: 'range' },
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
        ],
    },
    defaults: { icon: 'fas fa-fill-drip', icon_type: 'icon', property: 'level', min: 0, max: 100, step: 1, height: 75, colors: JSON.stringify([{color:'#a855f7'},{color:'#3b82f6'},{color:'#22c55e'},{color:'#facc15'},{color:'#ef4444'}]) },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle">
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 14px;min-height:0">
                <div v-if="widget.title" style="margin-bottom:10px;font-size:1.2rem;font-weight:500;color:rgba(255,255,255,.7);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ widget.title }}</div>
                <div ref="track"
                     :style="trackStyle"
                     style="position:relative;height:12px;border-radius:6px;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none"
                     @mousedown.stop="onDown" @mousemove.stop="onMove" @mouseup.stop="onUp" @mouseleave.stop="onUp"
                     @touchstart.stop.prevent="onDown" @touchmove.stop.prevent="onMove" @touchend.stop="onUp">
                    <div style="position:absolute;top:0;margin-left:-7px;z-index:2;pointer-events:none" :style="{ left: pctDisplay + '%' }">
                        <div style="width:14px;height:14px;border-radius:6px;margin-top:-2px;background:#f8f8f8;box-shadow:0 1px 4px rgba(0,0,0,.37);border:1px solid rgba(0,0,0,.35)"></div>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return { currentValue: 0, dragging: false, timer: null, isAlive: true, availTimer: null };
    },
    computed: {
        aliveDisabled() {
            return !!(this.widget.object_alive && this.widget.property_alive && this.isAlive === false);
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        min() { return this.widget.min !== undefined ? Number(this.widget.min) : 0; },
        max() { return this.widget.max !== undefined ? Number(this.widget.max) : 100; },
        step() { return this.widget.step !== undefined ? Number(this.widget.step) : 1; },
        range() { return this.max - this.min; },
        pct() { return this.range ? ((this.currentValue - this.min) / this.range) * 100 : 0; },
        pctDisplay() { return Math.max(0, Math.min(100, this.pct)).toFixed(2); },
        colors() {
            let arr = [];
            if (this.widget.colors) {
                try {
                    const parsed = typeof this.widget.colors === 'string' ? JSON.parse(this.widget.colors) : this.widget.colors;
                    if (Array.isArray(parsed)) arr = parsed.map(c => c && c.color).filter(c => /^#?[0-9a-fA-F]{6}$/.test(c));
                } catch (e) { arr = []; }
            }
            if (arr.length < 2) arr = ['#a855f7', '#3b82f6', '#22c55e', '#facc15', '#ef4444'];
            return arr.map(c => c[0] === '#' ? c : '#' + c);
        },
        trackStyle() { return { background: 'linear-gradient(90deg,' + this.colors.join(',') + ')' }; }
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
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.availTimer) clearInterval(this.availTimer);
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { }
        },
        async loadValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    this.currentValue = Number(d.value);
                }
            } catch (e) { }
        },
        onDown(e) {
            this.dragging = true;
            this.setFromEvent(e);
        },
        onMove(e) {
            if (this.dragging) this.setFromEvent(e);
        },
        onUp() {
            if (!this.dragging) return;
            this.dragging = false;
            this.writeValue();
        },
        setFromEvent(e) {
            if (this.aliveDisabled) return;
            const track = this.$refs.track;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const frac = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
            let v = this.min + frac * this.range;
            if (this.step) v = Math.round((v - this.min) / this.step) * this.step + this.min;
            v = Math.min(this.max, Math.max(this.min, v));
            this.currentValue = v;
        },
        async writeValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: prop || 'level', value: String(this.currentValue) }));
            } catch (e) { }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets['gradient-slider'] = GradientSliderWidget;