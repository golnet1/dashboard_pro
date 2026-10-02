const ColorSliderWidget = {
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
            { key: 'object', label: 'field_object_color', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
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
    defaults: { icon: 'fas fa-palette', icon_type: 'icon', height: 75 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div v-if="iconSrc" class="widget-v-card__header">
                <img class="widget-v-card__icon widget-v-card__icon--img" :src="iconSrc" alt="">
            </div>
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 14px;min-height:0">
                <div v-if="widget.title" style="margin-bottom:10px;font-size:1.2rem;font-weight:500;color:rgba(255,255,255,.7);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ widget.title }}</div>
                <div ref="track"
                     style="position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none"
                     @mousedown.stop="onDown" @mousemove.stop="onMove" @mouseup.stop="onUp" @mouseleave.stop="onUp"
                     @touchstart.stop.prevent="onDown" @touchmove.stop.prevent="onMove" @touchend.stop="onUp">
                    <div style="position:absolute;top:0;margin-left:-7px;z-index:2;pointer-events:none" :style="{ left: huePct + '%' }">
                        <div style="width:14px;height:14px;border-radius:6px;margin-top:-2px;background:#f8f8f8;box-shadow:0 1px 4px rgba(0,0,0,.37);border:1px solid rgba(0,0,0,.35)"></div>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return { hue: 0, r: 255, g: 255, b: 255, dragging: false, timer: null, isAlive: true, availTimer: null };
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
        huePct() { return (this.hue / 360 * 100).toFixed(2); }
    },
    mounted() {
        this.loadColor();
        if (this.widget.object && !window.__dpWsLive) this.timer = setInterval(() => this.loadColor(), 5000);
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
        async loadColor() {
            if (!this.widget.object) return;
            try {
                const params = this.widget.property ? { object: this.widget.object, property: this.widget.property } : { object: this.widget.object };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    let c = String(d.value).replace('#', '');
                    if (c.length >= 6) {
                        this.r = parseInt(c.substring(0, 2), 16) || 255;
                        this.g = parseInt(c.substring(2, 4), 16) || 255;
                        this.b = parseInt(c.substring(4, 6), 16) || 255;
                        this.hue = this.rgbToHue(this.r, this.g, this.b);
                    }
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
            this.dragging = false;
        },
        setFromEvent(e) {
            if (this.aliveDisabled) return;
            const track = this.$refs.track;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const frac = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
            this.setHue(Math.round(frac * 360));
        },
        setHue(h) {
            this.hue = ((h % 360) + 360) % 360;
            const sl = this.satLight();
            const s = sl.s < 0.05 ? 1 : sl.s;
            const l = sl.s < 0.05 ? 0.5 : sl.l;
            const rgb = this.hslToRgb(this.hue, s, l);
            this.r = rgb[0];
            this.g = rgb[1];
            this.b = rgb[2];
            this.updateColor();
        },
        rgbToHue(r, g, b) {
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
            if (max === min) return 0;
            let h;
            if (max === rn) h = (gn - bn) / (max - min);
            else if (max === gn) h = 2 + (bn - rn) / (max - min);
            else h = 4 + (rn - gn) / (max - min);
            h *= 60;
            if (h < 0) h += 360;
            return h;
        },
        satLight() {
            const r = this.r / 255, g = this.g / 255, b = this.b / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const l = (max + min) / 2;
            let s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
            return { s: isNaN(s) ? 0 : s, l };
        },
        hslToRgb(h, s, l) {
            h = (((h % 360) + 360) % 360) / 360;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                const hue2rgb = (p0, q0, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p0 + (q0 - p0) * 6 * t;
                    if (t < 1 / 2) return q0;
                    if (t < 2 / 3) return p0 + (q0 - p0) * (2 / 3 - t) * 6;
                    return p0;
                };
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        },
        async updateColor() {
            if (!this.widget.object) return;
            try {
                const hex = this.r.toString(16).padStart(2, '0') + this.g.toString(16).padStart(2, '0') + this.b.toString(16).padStart(2, '0');
                const params = this.widget.property ? { object: this.widget.object, property: this.widget.property, value: hex } : { object: this.widget.object, value: hex };
                await dpAPI('setProperty?' + new URLSearchParams(params));
            } catch (e) { }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.colorslider = ColorSliderWidget;