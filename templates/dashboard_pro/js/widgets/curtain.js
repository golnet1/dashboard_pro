const CurtainWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'show_percent', label: 'field_show_percent', type: 'checkbox' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'cover_type', label: 'field_cover_type', type: 'select', row: 'cover_row', options: [{value:'gate',label:'cover_gate'},{value:'blinds',label:'cover_blinds'},{value:'curtain',label:'cover_curtain'}] },
            { key: 'gate_side', label: 'field_gate_side', type: 'select', row: 'cover_row', showIf: { cover_type: 'gate' }, options: [{value:'left',label:'gate_side_left'},{value:'right',label:'gate_side_right'}] },
            { key: 'help', type: 'info', text: 'field_cover_hint' },
            { key: 'icon_close', label: 'field_cover_icon_close', type: 'icon_picker', row: 'cover_btn_row' },
            { key: 'icon_open', label: 'field_cover_icon_open', type: 'icon_picker', row: 'cover_btn_row' },
            { key: 'cover_image', label: 'field_cover_image', type: 'text', row: 'cover_img_row', placeholder: 'https://example.com/day.jpg' },
            { key: 'cover_image_night', label: 'field_cover_image_night', type: 'text', row: 'cover_img_row', placeholder: 'https://example.com/night.jpg' },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
            { key: 'level_min', label: 'field_min', type: 'number', row: 'lim_row' },
            { key: 'level_max', label: 'field_max', type: 'number', row: 'lim_row' },
            { key: 'level_step', label: 'field_step', type: 'number', row: 'lim_row' },
            { key: 'invert', label: 'field_cover_invert', type: 'checkbox' },
            { key: 'anim_speed', label: 'field_cover_speed', type: 'number', step: 0.1 },
            { key: 'object_open_obj', label: 'field_open_object', type: 'method_object', parent: 'object_open', row: 'm_open' },
            { key: 'object_open', label: 'field_open_method', type: 'method', parent: 'object_open', row: 'm_open' },
            { key: 'object_close_obj', label: 'field_close_object', type: 'method_object', parent: 'object_close', row: 'm_close' },
            { key: 'object_close', label: 'field_close_method', type: 'method', parent: 'object_close', row: 'm_close' },
            { key: 'object_stop_obj', label: 'field_stop_object', type: 'method_object', parent: 'object_stop', row: 'm_stop' },
            { key: 'object_stop', label: 'field_stop_method', type: 'method', parent: 'object_stop', row: 'm_stop' },
        ],
        advanced: [
            { key: 'refresh_interval', label: 'field_refresh_interval', type: 'number', row: 'refresh_row', step: 1 },
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
            { key: 'view_history', label: 'field_view_history', type: 'switch', row: 'hist_row', default: false },
            { key: 'history_color', label: 'field_history_color', type: 'color', row: 'hist_row', showIf: { view_history: true } },
        ],
    },
    defaults: { icon: 'fas fa-warehouse', icon_type: 'icon', cover_type: 'curtain', gate_side: 'left', cover_image: '', cover_image_night: '', property: 'position', level_min: 0, level_max: 100, level_step: 10, invert: false, anim_speed: 10, show_percent: true, background: false, round: false, height: 210, title: '', view_history: false, history_color: '#1976d2' },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--clickable': widget.view_history }" :style="cardStyle" @click="onHistClick">
            <div class="widget-v-card__header" v-if="showHeader">
                <i v-if="widget.icon" class="widget-v-card__icon" :class="[widget.icon, iconHlClass]" style="display:inline-flex;align-items:center;justify-content:center;width:35px;height:35px;padding:0"></i>
                <div class="widget-v-card__title" v-if="hasTitle">{{ widget.title }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="ct-val" v-if="showPercent">{{ Math.round(displayValue) }}%</div>
            </div>
            <div v-if="widget.object_info" class="widget-v-card__info" style="height:30px;box-sizing:border-box;display:flex;align-items:center;padding:0 12px;white-space:nowrap;overflow:hidden">
                <span v-if="widget.pre_info">{{ widget.pre_info }}</span><span v-if="infoValue">{{ infoDisplay }}</span><span v-if="widget.pos_info">{{ widget.pos_info }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:12px;display:flex;flex-direction:column">
                <div ref="pic" class="ct-pic" :style="'cursor:' + cursor + ';touch-action:none;user-select:none;position:relative;flex:1;min-height:90px;border-radius:8px;overflow:hidden;background:#0c1522'"
                     @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @dblclick="toggleFull" @click.stop>
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;display:block">
                        <defs>
                            <linearGradient :id="'ctGlass' + uid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stop-color="#8fc4ff" stop-opacity=".35"/>
                                <stop offset="1" stop-color="#22406b" stop-opacity=".55"/>
                            </linearGradient>
                            <linearGradient :id="'ctSlat' + uid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stop-color="#dfe7f0"/>
                                <stop offset="1" stop-color="#9aa8ba"/>
                            </linearGradient>
                            <linearGradient :id="'ctGate' + uid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stop-color="#8190a3"/>
                                <stop offset="1" stop-color="#55637a"/>
                            </linearGradient>
                            <linearGradient :id="'ctFab' + uid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stop-color="#7f8fa6"/>
                                <stop offset="1" stop-color="#4c5a70"/>
                            </linearGradient>
                        </defs>

                        <image v-if="coverImage" :href="coverImage" x="0" y="0" width="100" height="60" preserveAspectRatio="xMidYMid slice"/>
                        <rect v-else x="0" y="0" width="100" height="60" :fill="'url(#ctGlass' + uid + ')'"/>

                        <g v-if="type === 'blinds'">
                            <rect v-for="(s, i) in slats" :key="'s' + i" x="0" :y="s.y" width="100" :height="s.h"
                                  :fill="'url(#ctSlat' + uid + ')'" stroke="#48566b" stroke-width="0.4" vector-effect="non-scaling-stroke"/>
                            <rect x="0" :y="Math.max(0, slatH - 2.5)" width="100" height="2.5" fill="#3d4a5e"/>
                        </g>

                        <g v-else-if="type === 'gate'">
                            <rect :x="gateDir * gateShift" y="0" width="100" height="60" :fill="'url(#ctGate' + uid + ')'"/>
                            <line v-for="(x, i) in gateBars" :key="'gb' + i" :x1="x + gateDir * gateShift" y1="0" :x2="x + gateDir * gateShift" y2="60" stroke="#2f3a4c" stroke-width="1" vector-effect="non-scaling-stroke"/>
                            <line :x1="gateEdgeX" y1="0" :x2="gateEdgeX" y2="60" stroke="#2f3a4c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
                        </g>

                        <g v-else>
                            <rect x="0" y="0" :width="panelW" height="60" :fill="'url(#ctFab' + uid + ')'"/>
                            <rect :x="100 - panelW" y="0" :width="panelW" height="60" :fill="'url(#ctFab' + uid + ')'"/>
                            <line v-for="(x, i) in folds" :key="'fl' + i" :x1="x" y1="0" :x2="x" y2="60" stroke="#3a475c" stroke-width="0.8" stroke-opacity=".7" vector-effect="non-scaling-stroke"/>
                            <line v-for="(x, i) in folds" :key="'fr' + i" :x1="100 - x" y1="0" :x2="100 - x" y2="60" stroke="#3a475c" stroke-width="0.8" stroke-opacity=".7" vector-effect="non-scaling-stroke"/>
                        </g>

                        <rect x="0" y="0" width="100" height="60" fill="none" stroke="#5b6b82" stroke-width="1" vector-effect="non-scaling-stroke"/>
                    </svg>
                </div>
                <div class="ct-controls" @click.stop>
                    <button type="button" class="ct-ctl" :disabled="aliveDisabled" @click="stepDown" aria-label="-"><i class="fas fa-minus"></i></button>
                    <button type="button" class="ct-ctl" :disabled="aliveDisabled" @click="closeFull" :title="t('cover_close')"><i :class="widget.icon_close || 'fas fa-arrow-down'"></i></button>
                    <button type="button" class="ct-ctl" :disabled="aliveDisabled" @click="stopMove" :title="t('cover_stop')"><i class="fas fa-stop"></i></button>
                    <button type="button" class="ct-ctl" :disabled="aliveDisabled" @click="openFull" :title="t('cover_open')"><i :class="widget.icon_open || 'fas fa-arrow-up'"></i></button>
                    <button type="button" class="ct-ctl" :disabled="aliveDisabled" @click="stepUp" aria-label="+"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>`,
    data() {
        const snap = (this.widget && this.widget.id != null && window.__dpWidgetState) ? window.__dpWidgetState[this.widget.id] : null;
        return { perc: snap ? (Number(snap.perc) || 0) : 0, loading: false, dragging: false, animating: false, anim: 0, animTarget: null, rect: null, timer: null, infoTimer: null, infoValue: (this.widget && window.__dpInfoCache[this.widget.id]) || '', isAlive: true, min: 0, max: 100, infoTick: 0, secTimer: null, _writeUntil: 0, _infoRetry: [], sunrise: null, sunset: null, isNight: false, dayTimer: null, _stateReady: !!snap };
    },
    watch: {
        perc(v) {
            if (this.widget && this.widget.id != null) {
                window.__dpWidgetState = window.__dpWidgetState || {};
                window.__dpWidgetState[this.widget.id] = { perc: v };
            }
        }
    },
    computed: {
        uid() { return (this.widget && this.widget.id) || 'x'; },
        hasTitle() { return !!(this.widget.title && String(this.widget.title).trim()); },
        showPercent() { const v = this.widget.show_percent; return !(v === false || v === 0 || v === '0' || v === 'false' || v === ''); },
        showHeader() { return this.hasTitle || this.showPercent; },
        type() { return this.widget.cover_type || 'curtain'; },
        cursor() { return this.type === 'blinds' ? 'ns-resize' : 'ew-resize'; },
        coverImage() {
            const day = String(this.widget.cover_image == null ? '' : this.widget.cover_image).trim();
            const night = String(this.widget.cover_image_night == null ? '' : this.widget.cover_image_night).trim();
            if (!day && !night) return '';
            if (day && !night) return day;
            if (!day && night) return night;
            return this.isNight ? night : day;
        },
        displayValue() { return this.widget.invert ? (100 - this.perc) : this.perc; },
        panelW() { return 50 * (1 - this.perc / 100); },
        slatH() { return 60 * (1 - this.perc / 100); },
        slats() {
            const h = this.slatH, n = 9, arr = [];
            for (let i = 0; i < n; i++) arr.push({ y: (h / n) * i, h: h / n });
            return arr;
        },
        gateShift() { return this.perc; },
        gateDir() { return this.widget.gate_side === 'right' ? 1 : -1; },
        gateEdgeX() { return this.gateDir > 0 ? this.gateShift : 100 - this.gateShift; },
        gateBars() { const arr = []; for (let i = 1; i <= 4; i++) arr.push((100 / 5) * i); return arr; },
        folds() { const w = this.panelW, arr = []; for (let i = 1; i <= 4; i++) arr.push((w / 5) * i); return arr; },
        iconHlClass() {
            if (!this.widget.background || this.perc <= 0) return '';
            return this.widget.round ? 'widget-v-card__icon--hl widget-v-card__icon--hl--round' : 'widget-v-card__icon--hl';
        },
        cardStyle() { const s = {}; if (this.widget.color) s.backgroundColor = this.widget.color; return s; },
        infoDisplay() { return this.infoValue; },
        aliveDisabled() { return !!(this.widget.object_alive && this.widget.property_alive && !this.isAlive); }
    },
    mounted() {
        const w = this.widget || {};
        this.min = w.level_min != null ? Number(w.level_min) : 0;
        this.max = w.level_max != null ? Number(w.level_max) : 100;
        this.loadState();
        this.timer = setInterval(() => this.loadState(), window.__dpPollInterval(this.widget, 5));
        if (w.object_alive && w.property_alive) this.checkAlive();
        if (w.object_info) this.loadInfo();
        this.updateDayNight();
        if (w.cover_image && w.cover_image_night) this.loadDayNight();
        this.dayTimer = setInterval(() => this.updateDayNight(), 60000);
        this.secTimer = setInterval(() => { if (this.infoValue) this.infoTick++; }, 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.infoTimer) clearInterval(this.infoTimer);
        if (this.secTimer) clearInterval(this.secTimer);
        if (this.dayTimer) clearInterval(this.dayTimer);
        if (this.anim) cancelAnimationFrame(this.anim);
        (this._infoRetry || []).forEach(t => clearTimeout(t));
        if (this.widget && this.widget.id != null) {
            window.__dpWidgetState = window.__dpWidgetState || {};
            window.__dpWidgetState[this.widget.id] = { perc: this.perc };
        }
    },
    methods: {
        clampPerc(p) { return Math.min(100, Math.max(0, p)); },
        parseClock(v) {
            const m = /^\s*(\d{1,2}):(\d{2})/.exec(String(v == null ? '' : v));
            if (!m) return null;
            const h = Number(m[1]), mi = Number(m[2]);
            if (!isFinite(h) || !isFinite(mi) || h > 23 || mi > 59) return null;
            return h * 60 + mi;
        },
        updateDayNight() {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            const sr = this.sunrise != null ? this.sunrise : 6 * 60;
            const ss = this.sunset != null ? this.sunset : 18 * 60;
            this.isNight = (mins < sr) || (mins >= ss);
        },
        async loadDayNight() {
            try {
                const [rs, ss] = await Promise.all([
                    dpAPI('getProperty?' + new URLSearchParams({ object: 'ThisComputer', property: 'SunRiseTime' })),
                    dpAPI('getProperty?' + new URLSearchParams({ object: 'ThisComputer', property: 'SunSetTime' }))
                ]);
                const sr = (rs && !rs.error) ? this.parseClock(rs.value) : null;
                const st = (ss && !ss.error) ? this.parseClock(ss.value) : null;
                if (sr != null) this.sunrise = sr;
                if (st != null) this.sunset = st;
            } catch (e) { /* daylight by the clock */ }
            this.updateDayNight();
        },
        rawToPerc(raw) {
            const span = this.max - this.min || 1;
            let p = ((raw - this.min) / span) * 100;
            if (this.widget.invert) p = 100 - p;
            return this.clampPerc(p);
        },
        percToRaw(p) {
            const span = this.max - this.min || 1;
            let raw = this.widget.invert ? this.max - (p / 100) * span : this.min + (p / 100) * span;
            return Math.round(raw);
        },
        async loadState() {
            if (this.dragging) return;
            if (Date.now() < this._writeUntil) return;
            const obj = this.widget.object;
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: this.widget.property || 'position' }));
                if (d && !d.error && d.value !== undefined && d.value !== '') {
                    const n = Number(d.value);
                    if (!isNaN(n)) {
                        const target = this.rawToPerc(n);
                        if (!this._stateReady) {
                            this._stateReady = true;
                            this.perc = target;
                        } else if (this.animating && this.animTarget != null && Math.abs(this.animTarget - target) < 0.4) {
                            /* already heading to this value */
                        } else if (Math.abs(target - this.perc) >= 0.4) {
                            this.animateTo(target);
                        } else if (!this.animating) {
                            this.perc = target;
                        }
                    }
                }
            } catch (e) { /* silent */ }
        },
        async commit() { return this.writePerc(this.perc); },
        async writePerc(p) {
            if (this.loading) return;
            const obj = this.widget.object;
            if (!obj) return;
            this.loading = true;
            this._writeUntil = window.__dpWsLive ? 0 : Date.now() + 4000;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: this.widget.property || 'position', value: String(this.percToRaw(p)) }));
                this.scheduleInfoRefresh();
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        stopAnim() {
            if (this.anim) { cancelAnimationFrame(this.anim); this.anim = 0; }
            this.animating = false;
            this.animTarget = null;
        },
        animMs(delta) {
            const raw = this.widget.anim_speed;
            const sec = (raw === undefined || raw === null || raw === '') ? 0.8 : Number(raw);
            const fullMs = isFinite(sec) ? sec * 1000 : 800;
            if (fullMs <= 0) return 0;
            return Math.round(Math.max(50, fullMs * Math.abs(delta) / 100));
        },
        animateTo(target) {
            const from = this.perc;
            const to = this.clampPerc(target);
            this.stopAnim();
            if (Math.abs(to - from) < 0.4) { this.perc = to; return Promise.resolve(); }
            const dur = this.animMs(to - from);
            if (!dur) { this.perc = to; return Promise.resolve(); }
            this.animTarget = to;
            this.animating = true;
            const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            return new Promise(resolve => {
                const tick = (now) => {
                    const t = Math.min(1, (now - start) / dur);
                    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    this.perc = from + (to - from) * e;
                    if (t < 1) { this.anim = requestAnimationFrame(tick); }
                    else { this.perc = to; this.anim = 0; this.animating = false; this.animTarget = null; resolve(); }
                };
                this.anim = requestAnimationFrame(tick);
            });
        },
        applyPointer(e) {
            const r = this.rect || (this.$refs.pic && this.$refs.pic.getBoundingClientRect());
            if (!r || !r.width || !r.height) return;
            if (this.type === 'blinds') {
                const y = (e.clientY - r.top) / r.height;
                this.perc = this.clampPerc((1 - y) * 100);
            } else if (this.type === 'gate') {
                const x = (e.clientX - r.left) / r.width;
                this.perc = this.clampPerc((this.widget.gate_side === 'right' ? x : (1 - x)) * 100);
            } else {
                const x = (e.clientX - r.left) / r.width;
                this.perc = this.clampPerc(Math.abs(x - 0.5) * 200);
            }
        },
        onDown(e) {
            if (this.aliveDisabled) return;
            this.stopAnim();
            this.dragging = true;
            this.rect = this.$refs.pic.getBoundingClientRect();
            if (e.currentTarget && e.currentTarget.setPointerCapture) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } }
            this.applyPointer(e);
        },
        onMove(e) { if (this.dragging) this.applyPointer(e); },
        onUp() { if (!this.dragging) return; this.dragging = false; this.commit(); },
        toggleFull() { this.animateTo(this.perc > 50 ? 0 : 100).then(() => this.commit()); },
        async stepUp() {
            if (this.aliveDisabled || this.loading) return;
            this.stopAnim();
            const step = this.widget.level_step != null ? Number(this.widget.level_step) : 10;
            this.perc = this.clampPerc(this.perc + (step || 1));
            await this.commit();
        },
        async stepDown() {
            if (this.aliveDisabled || this.loading) return;
            this.stopAnim();
            const step = this.widget.level_step != null ? Number(this.widget.level_step) : 10;
            this.perc = this.clampPerc(this.perc - step);
            await this.commit();
        },
        async callMethod(m) {
            if (!m) return false;
            const p = String(m).split('/');
            await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
            return true;
        },
        async openFull() {
            if (this.aliveDisabled) return;
            this.stopAnim();
            if (this.widget.object_open) {
                this.callMethod(this.widget.object_open).catch(() => {});
                this._writeUntil = Date.now() + 2500;
            } else {
                await this.writePerc(100);
            }
            await this.animateTo(100);
            this.scheduleInfoRefresh();
        },
        async closeFull() {
            if (this.aliveDisabled) return;
            this.stopAnim();
            if (this.widget.object_close) {
                this.callMethod(this.widget.object_close).catch(() => {});
                this._writeUntil = Date.now() + 2500;
            } else {
                await this.writePerc(0);
            }
            await this.animateTo(0);
            this.scheduleInfoRefresh();
        },
        async stopMove() {
            if (this.aliveDisabled) return;
            this.stopAnim();
            if (this.widget.object_stop) {
                this.callMethod(this.widget.object_stop).catch(() => {});
                this._writeUntil = Date.now() + 2500;
            } else {
                await this.commit();
            }
            this.scheduleInfoRefresh();
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* silent */ }
        },
        setInfo(v) { if (v === undefined || v === null || v === '') return; this.infoValue = v; if (this.widget && this.widget.id) window.__dpInfoCache[this.widget.id] = v; },
        async refreshInfo() {
            if (!this.widget.object_info) return;
            try {
                const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
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

(function injectCurtainWidgetStyle() {
    if (typeof document === 'undefined') return;
    try {
        if (document.getElementById('curtain-widget-style')) return;
        const st = document.createElement('style');
        st.id = 'curtain-widget-style';
        st.textContent = [
            '.widget-v-card .ct-val { font-size:.85rem;font-weight:600;color:rgba(255,255,255,.85);min-width:38px;text-align:right;font-variant-numeric:tabular-nums; }',
            '.widget-v-card .ct-controls { display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:8px; }',
            '.widget-v-card .ct-ctl { width:38px;height:38px;flex:0 0 auto;padding:0;border:1px solid rgba(255,255,255,.15);border-radius:50%;background:rgba(255,255,255,.05);color:rgba(255,255,255,.9);cursor:pointer;font-size:.95rem;display:inline-flex;align-items:center;justify-content:center;outline:none; }',
            '.widget-v-card .ct-ctl:hover:not(:disabled) { background:rgba(255,255,255,.16); }',
            '.widget-v-card .ct-ctl:disabled { opacity:.4;cursor:default; }',
            '.widget-v-card .ct-pic svg { pointer-events:none; }',
        ].join('\n');
        document.head.appendChild(st);
    } catch (e) { /* noop */ }
})();

window.DpWidgets.curtain = CurtainWidget;
