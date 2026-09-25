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
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
            { key: 'object_info', label: 'field_object_info', type: 'object', row: 'info_row' },
            { key: 'property_info', label: 'field_info_property', type: 'property', row: 'info_row' },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
            { key: 'background', label: 'field_icon_bg', type: 'checkbox', row: 'icon_hl' },
            { key: 'round', label: 'field_icon_round', type: 'checkbox', row: 'icon_hl' },
        ],
    },
    defaults: { icon: 'fas fa-palette', icon_type: 'icon', property: 'status', background: false, round: false, height: 125 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" class="widget-v-card__icon" :class="[widget.icon, iconHlClass]" style="display:inline-flex;align-items:center;justify-content:center;width:35px;height:35px;padding:0"></i>
                <div class="widget-v-card__title">{{ widget.title || 'RGB' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" :style="aliveDisabled ? 'opacity:.4;pointer-events:none' : ''" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div v-if="widget.object_info" class="widget-v-card__info" style="height:30px;box-sizing:border-box;display:flex;align-items:center;padding:0 12px;white-space:nowrap;overflow:hidden">
                <span v-if="widget.pre_info">{{ widget.pre_info }}</span><span v-if="infoValue">{{ infoDisplay }}</span><span v-if="widget.pos_info">{{ widget.pos_info }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:4px 12px 12px;display:flex;flex-direction:column;gap:10px;justify-content:center">
                <div ref="track"
                     style="position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none"
                     :style="{ opacity: colorDisabled ? '.35' : '1', filter: colorDisabled ? 'grayscale(1)' : 'none', cursor: colorDisabled ? 'default' : 'pointer' }"
                     @mousedown.stop="onDown" @mousemove.stop="onMove" @mouseup.stop="onUp" @mouseleave.stop="onUp"
                     @touchstart.stop.prevent="onDown" @touchmove.stop.prevent="onMove" @touchend.stop="onUp">
                    <div style="position:absolute;top:0;margin-left:-7px;z-index:2;pointer-events:none" :style="{ left: huePct + '%' }">
                        <div style="width:14px;height:14px;border-radius:6px;margin-top:-2px;background:#f8f8f8;box-shadow:0 1px 4px rgba(0,0,0,.37);border:1px solid rgba(0,0,0,.35)"></div>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return { isOn: false, currentColor: '#ffffff', hue: 0, dragging: false, loading: false, timer: null, colorTimer: null, infoTimer: null, infoValue: (this.widget && window.__dpInfoCache[this.widget.id]) || '', isAlive: true, availTimer: null, infoTick: 0, secTimer: null, _toggleUntil: 0, _infoRetry: [] };
    },
    mounted() {
        this.loadState();
        let obj = this.widget.object_value || this.widget.object;
        if (obj && !window.__dpWsLive) this.timer = setInterval(() => this.loadState(), 5000);
        if (this.widget.object_color) {
            this.loadColor();
            if (!window.__dpWsLive) this.colorTimer = setInterval(() => this.loadColor(), 5000);
        }
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
        if (this.widget.object_info) this.loadInfo();
        this.secTimer = setInterval(() => { if (this.infoValue) this.infoTick++; }, 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.colorTimer) clearInterval(this.colorTimer);
        if (this.infoTimer) clearInterval(this.infoTimer);
        if (this.availTimer) clearInterval(this.availTimer);
        if (this.secTimer) clearInterval(this.secTimer);
        (this._infoRetry || []).forEach(t => clearTimeout(t));
        this._infoRetry = [];
    },
    computed: {
        infoDisplay() {
            if (!this.infoValue) return '';
            void this.infoTick;
            return dpInfoDisplay(this.infoValue);
        },
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        colorDisabled() {
            return !this.isOn || !!this.aliveDisabled;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        iconHlClass() {
            if (!this.widget.background || !this.isOn) return '';
            return this.widget.round ? 'widget-v-card__icon--hl widget-v-card__icon--hl--round' : 'widget-v-card__icon--hl';
        },
        huePct() { return (this.hue / 360 * 100).toFixed(2); }
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async loadState() {
            if (Date.now() < this._toggleUntil) return;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop || 'status' }));
                if (!d.error && d.value !== undefined) {
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
                    const value = String(d.value).replace('#', '');
                    if (/^[0-9a-f]{6,8}$/i.test(value)) {
                        const c = value.substring(0, 6);
                        this.currentColor = '#' + c.toLowerCase();
                        this.hue = this.rgbToHue(
                            parseInt(c.substring(0, 2), 16),
                            parseInt(c.substring(2, 4), 16),
                            parseInt(c.substring(4, 6), 16)
                        );
                    }
                }
            } catch (e) { /* silent */ }
        },
        onDown(e) {
            if (this.colorDisabled) return;
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
            if (this.colorDisabled) return;
            const track = this.$refs.track;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const frac = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
            this.setHue(Math.round(frac * 360));
        },
        setHue(h) {
            this.hue = ((h % 360) + 360) % 360;
            const c = this.currentColor.replace('#', '');
            const r = parseInt(c.substring(0, 2), 16);
            const g = parseInt(c.substring(2, 4), 16);
            const b = parseInt(c.substring(4, 6), 16);
            const sl = this.satLight(r, g, b);
            const rgb = this.hslToRgb(this.hue, sl.s < 0.05 ? 1 : sl.s, sl.s < 0.05 ? 0.5 : sl.l);
            this.currentColor = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
            this.onColorChange();
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
        satLight(r, g, b) {
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
            const l = (max + min) / 2;
            const s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
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
        async toggle() {
            if (this.loading) return;
            this.loading = true;
            const next = !this.isOn;
            this._toggleUntil = window.__dpWsLive ? 0 : Date.now() + 4000;
            let obj = this.widget.object_value || this.widget.object;
            try {
                if (this.widget.object_switch) {
                    const p = this.widget.object_switch.split('/');
                    await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
                } else if (this.widget.object_on && this.widget.object_off) {
                    const pon = this.widget.object_on.split('/');
                    const poff = this.widget.object_off.split('/');
                    const p = next ? pon : poff;
                    await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
                } else {
                    await dpAPI('setProperty?' + new URLSearchParams({
                        object: obj, property: this.widget.property || 'status', value: next ? '1' : '0'
                    }));
                }
                this.isOn = next;
                this.scheduleInfoRefresh();
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
                this.scheduleInfoRefresh();
            } catch (e) { /* silent */ }
        },
        setInfo(v) {
            if (v === undefined || v === null || v === '') return;
            this.infoValue = v;
            if (this.widget && this.widget.id) window.__dpInfoCache[this.widget.id] = v;
        },
        async refreshInfo() {
            if (!this.widget.object_info) return;
            try {
                const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                const d = await dpHttp('getProperty?' + new URLSearchParams(params));
                if (d && !d.error) this.setInfo(d.value);
            } catch (e) { /* silent */ }
        },
        scheduleInfoRefresh() {
            if (!this.widget.object_info) return;
            this.refreshInfo();
            (this._infoRetry || []).forEach(t => clearTimeout(t));
            this._infoRetry = [setTimeout(() => this.refreshInfo(), 400), setTimeout(() => this.refreshInfo(), 1500)];
        },
        async loadInfo() {
            if (!this.widget.object_info) return;
            await this.refreshInfo();
            this.infoTimer = setInterval(() => this.refreshInfo(), 5000);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.rgb = RGBWidget;
