const AC_INPUT_CSS = 'width:100%;box-sizing:border-box;padding:6px 8px;font-size:.8rem;'
    + 'color:#e8eaed !important;-webkit-text-fill-color:#e8eaed !important;'
    + 'background:#1f242c !important;border:1px solid rgba(255,255,255,.16) !important;'
    + 'border-radius:6px;outline:none';
const AC_CODE_CSS = AC_INPUT_CSS + ';min-height:64px;font-family:monospace;font-size:.74rem;resize:vertical';

const AlarmClockWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'main' },
        { key: 'params', label: 'tab_params', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        main: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'class_name', label: 'ac_field_class_name', type: 'text' },
            { key: 'sort_by', label: 'ac_field_sort_by', type: 'select', options: [{value:'time',label:'ac_opt_sort_time'},{value:'name',label:'ac_opt_sort_name'}] },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
        params: [
            { key: 'show_name', label: 'ac_field_show_name', type: 'checkbox', default: true },
            { key: 'show_method', label: 'ac_field_show_method', type: 'checkbox', default: false },
            { key: 'show_labels', label: 'ac_field_show_labels', type: 'checkbox', default: true },
            { key: 'allow_add', label: 'ac_field_allow_add', type: 'checkbox', default: true },
            { key: 'allow_delete', label: 'ac_field_allow_delete', type: 'checkbox', default: true },
        ],
        advanced: [
            { key: 'timeout', label: 'ac_field_timeout', type: 'number', min: 5, step: 5, default: 30 },
            { key: 'loop_watch', label: 'ac_field_loop_watch', type: 'checkbox', default: true },
            { key: 'loop_object', label: 'ac_field_loop_object', type: 'text', default: 'cycle_alarmclock' },
            { key: 'loop_timeout', label: 'ac_field_loop_timeout', type: 'number', min: 5, step: 5, default: 30 },
        ],
    },
    defaults: {
        icon: 'fas fa-bell', icon_type: 'icon', class_name: 'AlarmClock', sort_by: 'time',
        show_name: true, show_method: false, show_labels: true, allow_add: true, allow_delete: true,
        timeout: 30, loop_watch: true, loop_object: 'cycle_alarmclock', loop_timeout: 30, height: 150,
    },
    template: `
        <div class="widget-v-card" :style="[cardStyle, cardVars]">
            <div v-if="classMissing" class="ac-noclass" :style="noclassStyle">
                {{ t('ac_noclass') }}
            </div>
            <template v-else>
            <div style="display:flex;align-items:center;gap:6px;padding:7px 9px 0">
                <i v-if="widget.icon" :class="widget.icon" :style="{ fontSize: '.85rem', flexShrink: '0', color: ink.mid }"></i>
                <div :style="{ fontSize: '.9rem', fontWeight: 500, color: ink.high, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }">{{ widget.title || t('widget_alarmclock') }}</div>
                <div style="flex:1"></div>
                <span v-if="loopBadge" :style="loopBadge.style" :title="loopBadge.title">{{ loopBadge.text }}</span>
                <button type="button" class="ac-refresh" style="color:var(--ac-ink-mid) !important" :title="t('refresh')" @click.stop="load(true)" :style="refreshStyle">
                    <i class="fas fa-refresh" :class="{ 'fa-spin': loading }"></i>
                </button>
            </div>

            <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 10px;overflow:hidden">
                <div v-if="error" style="font-size:.7rem;color:#ef9a9a;text-align:center;word-break:break-word">{{ error }}</div>
                <template v-else-if="nearest">
                    <div :style="{ fontSize: '2.5rem', lineHeight: '1.05', fontWeight: 300, color: ink.high, fontVariantNumeric: 'tabular-nums' }">{{ nearest.time }}</div>
                    <div :style="{ fontSize: '.74rem', color: ink.mid, textAlign: 'center' }">{{ nextLabel }}</div>
                    <div v-if="flags.name" :style="{ maxWidth: '100%', fontSize: '.68rem', color: ink.dim, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ dispName(nearest) }}</div>
                    <div v-if="isPlaying" style="width:100%;max-width:160px;display:flex;align-items:center;gap:6px;margin-top:6px">
                        <i class="fas fa-volume-down" :style="{ fontSize: '.65rem', color: ink.mid }"></i>
                        <input type="range" min="0" max="1" step="0.05" :value="volume" @input.stop="setVolume($event)" :style="volumeStyle">
                        <i class="fas fa-volume-up" :style="{ fontSize: '.65rem', color: ink.mid }"></i>
                        <button type="button" @click.stop="stopSound" :style="stopBtnStyle">
                            <i class="fas fa-square-full" style="font-size:.5rem"></i>
                        </button>
                    </div>
                </template>
                <div v-else :style="{ fontSize: '.78rem', color: ink.mid, textAlign: 'center', padding: '6px 0' }">
                    {{ loading ? t('loading') : t('ac_nothing') }}
                </div>
            </div>

            <div style="flex-shrink:0;padding:0 8px 8px">
                <button ref="menuBtn" type="button" class="ac-menu-btn" style="color:var(--ac-ink-mid) !important" @click.stop="toggleMenu" :style="menuBtnStyle">
                    <i class="fas fa-clock" style="font-size:.65rem"></i>
                    <span style="margin-left:6px">{{ t('ac_all') }} ({{ rows.length }})</span>
                    <i class="fas fa-chevron-down" style="margin-left:auto;font-size:.55rem"></i>
                </button>
            </div>

            <div v-if="menuOpen" class="ac-menu" :style="menuStyle" @click.stop>
                <div v-if="flags.add" class="ac-menu-add" :style="addItemStyle" @click.stop="startNew">
                    <i class="fas fa-plus" style="width:14px;font-size:.7rem"></i>
                    <span>{{ t('ac_new') }}</span>
                </div>
                <div v-if="flags.add" style="height:1px;margin:2px 0;background:rgba(255,255,255,.12)"></div>
                <div v-if="!rows.length" class="ac-menu-empty" style="padding:8px 12px;font-size:.78rem;color:#a7acb3">{{ t('no_data') }}</div>
                <div v-for="a in rows" :key="a.name" :style="itemStyle" @click.stop="openModal(a)">
                    <span :style="dotStyle(a)"></span>
                    <span class="ac-menu-time" style="font-size:.82rem;color:#e8eaed;font-variant-numeric:tabular-nums;width:42px;flex-shrink:0">{{ a.time || '--:--' }}</span>
                    <span class="ac-menu-name" style="font-size:.76rem;color:#a7acb3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ dispName(a) }}</span>
                    <span v-if="flags.method && a.method" class="ac-menu-badge" style="flex-shrink:0;margin-left:auto;font-size:.64rem;padding:1px 6px;border-radius:8px;background:rgba(255,255,255,.14);color:#c9cdd1">{{ methodName(a.method) }}</span>
                    <i v-else-if="a.once" class="fas fa-1" :title="t('ac_once')" style="flex-shrink:0;margin-left:auto;font-size:.6rem;opacity:.6"></i>
                    <i v-if="a.badTime" class="fas fa-triangle-exclamation" :title="t('ac_badtime')" style="flex-shrink:0;font-size:.62rem;color:#ef9a9a"></i>
                </div>
            </div>

            <div v-if="modalOpen && form" class="modal-overlay ac-modal" style="z-index:1200" @click.self="closeModal">
                <div :style="modalStyle" @click.stop>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                        <i class="fas fa-bell" style="color:var(--primary);font-size:.9rem"></i>
                        <div style="font-size:.92rem;font-weight:600;color:var(--text, #e8eaed);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                            {{ form.isNew ? t('ac_new_alarm') : dispName(form) }}
                        </div>
                        <div style="flex:1"></div>
                        <button type="button" @click="closeModal" style="flex-shrink:0;width:24px;height:24px;border:none;border-radius:50%;background:rgba(255,255,255,.08);color:#9aa0a6;cursor:pointer">✕</button>
                    </div>

                    <div v-if="form.error" style="margin-bottom:8px;font-size:.72rem;color:#ef9a9a">{{ form.error }}</div>

                    <div :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_name') }}</label>
                        <input v-model="form.descr" type="text" :style="inputCss">
                    </div>

                    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
                        <div :style="fieldStyle">
                            <label :style="labelStyle">{{ t('ac_time') }}</label>
                            <input v-model="form.time" type="time" :style="inputCssTime">
                        </div>
                        <div :style="fieldStyle">
                            <label :style="labelStyle">{{ t('ac_repeat') }}</label>
                            <select v-model="form.once" :style="inputCss">
                                <option :value="0">{{ t('ac_everyday') }}</option>
                                <option :value="1">{{ t('ac_once') }}</option>
                            </select>
                        </div>
                        <div style="padding-bottom:2px">
                            <label :style="labelStyle">{{ t('ac_state') }}</label>
                            <div style="height:30px;display:flex;align-items:center">
                                <div class="v-input--switch" :class="{ 'input--is-checked': form.on }" @click="form.on = !form.on" style="cursor:pointer;pointer-events:auto">
                                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                                </div>
                                <span style="margin-left:8px;font-size:.76rem;color:#9aa0a6">{{ form.on ? t('ac_on') : t('ac_off') }}</span>
                            </div>
                        </div>
                    </div>

                    <div :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_days') }}</label>
                        <div style="display:flex;gap:4px">
                            <button v-for="(d, di) in weekDays" :key="di" type="button" class="ac-day" :class="{ 'ac-day-on': form.mask.charAt(di) === '1' }" @click="form.mask = flipDay(form.mask, di)" :style="dayStyle(di)">{{ d }}</button>
                        </div>
                    </div>

                    <div :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_action') }}</label>
                        <select v-model="form.method" @change="loadActionLists" :style="inputCss">
                            <option value="code">{{ t('ac_action_code') }}</option>
                            <option value="sound">{{ t('ac_action_sound') }}</option>
                            <option value="script">{{ t('ac_action_script') }}</option>
                            <option value="method">{{ t('ac_action_method') }}</option>
                        </select>
                    </div>

                    <div v-if="form.method === 'code'" :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_php_code') }}</label>
                        <textarea v-model="form.php" rows="4" :style="codeCss"></textarea>
                    </div>
                    <div v-else-if="form.method === 'sound'" :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_sound_file') }}</label>
                        <select v-model="form.sound" :style="inputCss">
                            <option value="">{{ t('ac_none') }}</option>
                            <option v-for="s in soundNames" :key="'snd' + s" :value="s">{{ s }}</option>
                        </select>
                    </div>
                    <div v-else-if="form.method === 'script'" :style="fieldStyle">
                        <label :style="labelStyle">{{ t('ac_script_name') }}</label>
                        <select v-model="form.script" :style="inputCss">
                            <option value="">{{ t('ac_none') }}</option>
                            <option v-for="s in scriptNames" :key="'s' + s" :value="s">{{ s }}</option>
                        </select>
                    </div>
                    <div v-else-if="form.method === 'method'" style="display:flex;gap:10px;flex-wrap:wrap">
                        <div :style="fieldStyle + ';flex:1;min-width:130px'">
                            <label :style="labelStyle">{{ t('ac_object') }}</label>
                            <select v-model="form.linkedObject" @change="onObjectChange" :style="inputCss">
                                <option value="">{{ t('ac_none') }}</option>
                                <option v-for="o in objectNames" :key="'o' + o" :value="o">{{ o }}</option>
                            </select>
                        </div>
                        <div :style="fieldStyle + ';flex:1;min-width:130px'">
                            <label :style="labelStyle">{{ t('ac_meth') }}</label>
                            <select v-model="form.linkedMethod" :style="inputCss">
                                <option value="">{{ t('ac_none') }}</option>
                                <option v-for="m in methodNames" :key="'m' + m" :value="m">{{ m }}</option>
                            </select>
                        </div>
                    </div>

                    <template v-if="flags.labels">
                        <div :style="fieldStyle">
                            <label :style="labelStyle">{{ t('ac_text_on') }}</label>
                            <input v-model="form.customOn" type="text" :style="inputCss">
                        </div>
                        <div :style="fieldStyle">
                            <label :style="labelStyle">{{ t('ac_text_off') }}</label>
                            <input v-model="form.customOff" type="text" :style="inputCss">
                        </div>
                    </template>

                    <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
                        <button v-if="!form.isNew && flags.del" type="button" class="ac-del" :class="{ 'ac-del-danger': form.confirmDelete }" @click="removeForm" :style="delBtnStyle">
                            {{ form.confirmDelete ? t('ac_confirm_del') : t('ac_delete') }}
                        </button>
                        <div style="flex:1"></div>
                        <button type="button" class="ac-cancel" @click="closeModal" style="padding:7px 14px;border:none;border-radius:6px;background:rgba(255,255,255,.08);color:#c9cdd1 !important;cursor:pointer;font-size:.78rem">{{ t('cancel') }}</button>
                        <button type="button" @click="saveForm" style="padding:7px 16px;border:none;border-radius:6px;background:var(--primary);color:#fff !important;cursor:pointer;font-size:.78rem">
                            {{ saving ? '…' : t('save') }}
                        </button>
                    </div>
                </div>
            }
            </template>
        </div>`,
    data() {
        return {
            items: [], loading: false, error: '', timer: null, tickTimer: null, now: Date.now(),
            loopAge: null, loopErr: '', menuOpen: false, menuPos: null, modalOpen: false, form: null,
            saving: false, scriptList: [], soundList: [], objectList: [], methodList: [], methodsFor: '', codeLoadedFor: '', raised: null,
            bgLight: null, classMissing: null, measured: null, firedMin: { key: '', names: {} }, minTimer: null,
            audio: null, isPlaying: false, volume: 0.9,
        };
    },
    mounted() {
        this.load();
        this.sampleBgImage();
        this.remeasure();
        [120, 600, 2000].forEach(d => setTimeout(() => this.remeasure(), d));
        try {
            const watch = (n) => {
                if (!n || typeof MutationObserver === 'undefined') return;
                this._mo = new MutationObserver(() => {
                    clearTimeout(this._moT);
                    this._moT = setTimeout(() => this.remeasure(), 200);
                });
                this._mo.observe(n, { attributes: true, attributeFilter: ['style', 'class'] });
            };
            watch(document.documentElement);
            watch(document.body);
        } catch (e) { }
        const sec = Math.max(5, parseInt(this.widget.timeout, 10) || 30);
        this.timer = setInterval(() => this.load(), sec * 1000);
        this.tickTimer = setInterval(() => { this.now = Date.now(); }, 10000);
        this.armMinuteCheck();
        this._docClick = (e) => {
            const el = this.$el;
            if (el && el.contains && el.contains(e.target)) return;
            this.closeMenu();
        };
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.tickTimer) clearInterval(this.tickTimer);
        if (this.minTimer) clearTimeout(this.minTimer);
        this.minTimer = null;
        this.stopSound();
        this.unarmSoundRetry();
        if (this._mo) { try { this._mo.disconnect(); } catch (e) { } this._mo = null; }
        if (this._moT) clearTimeout(this._moT);
        if (this.menuOpen) document.removeEventListener('click', this._docClick, true);
        if (this.modalOpen) document.removeEventListener('keydown', this._docKey);
        this.restoreLayer();
    },
    computed: {
        flags() {
            const on = (v, def) => {
                if (v === undefined || v === null || v === '') return def;
                if (typeof v === 'string') return !(v === '0' || v.toLowerCase() === 'false' || v.toLowerCase() === 'no' || v.toLowerCase() === 'off');
                return !!v;
            };
            return {
                name: on(this.widget.show_name, true),
                method: on(this.widget.show_method, false),
                labels: on(this.widget.show_labels, true),
                add: on(this.widget.allow_add, true),
                del: on(this.widget.allow_delete, true),
                loop: on(this.widget.loop_watch, true),
            };
        },
        weekDays() {
            return [0, 1, 2, 3, 4, 5, 6].map(i => this.t('ac_day_' + i));
        },
        weekFull() {
            return [0, 1, 2, 3, 4, 5, 6].map(i => this.t('ac_weekday_' + i));
        },
        todayIdx() {
            return (new Date(this.now).getDay() + 6) % 7;
        },
        className() {
            return String(this.widget.class_name || 'AlarmClock').trim() || 'AlarmClock';
        },
        rows() {
            const arr = this.items.slice();
            const byLabel = (a, b) => this.dispName(a).localeCompare(this.dispName(b)) || String(a.name).localeCompare(String(b.name));
            const byTime = (a, b) => {
                if (a.minutes === null && b.minutes === null) return byLabel(a, b);
                if (a.minutes === null) return 1;
                if (b.minutes === null) return -1;
                return a.minutes - b.minutes || byLabel(a, b);
            };
            return arr.sort((this.widget.sort_by || 'time') === 'name' ? byLabel : byTime);
        },
        nearest() {
            let best = null;
            this.items.forEach(a => {
                const info = this.nextInfo(a);
                if (!info) return;
                if (!best || info.min < best.info.min) best = { alarm: a, info: info };
            });
            return best ? best.alarm : null;
        },
        nextLabel() {
            const n = this.nearest;
            if (!n) return '';
            const info = this.nextInfo(n);
            if (!info) return '';
            let out = this.t('ac_in') + ' ' + this.fmtDelta(info.min);
            const day = this.weekFull[info.dayIdx];
            if (day) out += ' · ' + day.charAt(0).toUpperCase() + day.slice(1);
            return out;
        },
        scriptNames() {
            return this.withCurrent(this.scriptList.map(x => String(x && x.TITLE ? x.TITLE : '')).filter(Boolean), this.form && this.form.script);
        },
        soundNames() {
            return this.withCurrent(this.soundList.map(x => String(x && x.NAME ? x.NAME : '')).filter(Boolean), this.form && this.form.sound);
        },
        objectNames() {
            return this.withCurrent(this.objectList.map(x => String(x && x.TITLE ? x.TITLE : '')).filter(Boolean), this.form && this.form.linkedObject);
        },
        methodNames() {
            return this.withCurrent(this.methodList.map(x => String(x && x.TITLE ? x.TITLE : '')).filter(Boolean), this.form && this.form.linkedMethod);
        },
        loopBadge() {
            if (!this.flags.loop || this.loopAge === null) return null;
            const limit = Math.max(5, parseInt(this.widget.loop_timeout, 10) || 30);
            const ok = this.loopAge <= limit;
            const ago = this.loopAge < 60
                ? (this.loopAge + ' ' + this.t('ac_s'))
                : (Math.round(this.loopAge / 60) + ' ' + this.t('ac_min'));
            const light = this.isLight;
            return {
                style: {
                    display: 'inline-flex', alignItems: 'center', flexShrink: '0', marginRight: '6px', padding: '1px 7px',
                    borderRadius: '9px', fontSize: '.65rem', whiteSpace: 'nowrap',
                    background: ok
                        ? (light ? 'rgba(46,125,50,.16)' : 'rgba(76,175,80,.16)')
                        : (light ? 'rgba(198,40,40,.14)' : 'rgba(244,67,54,.2)'),
                    color: ok ? (light ? '#2e7d32' : '#a5d6a7') : (light ? '#c62828' : '#ef9a9a'),
                },
                text: ok ? (this.t('ac_loop') + ' ' + ago) : this.t('ac_loopdown'),
                title: this.loopErr ? (this.t('ac_lasterr') + ': ' + this.loopErr) : '',
            };
        },
        cardStyle() {
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            const s = {};
            if (mode === 'color' && this.widget.color) s.backgroundColor = this.widget.color;
            else if (mode === 'image' && this.widget.bg_image) {
                s.backgroundImage = 'url(' + this.widget.bg_image + ')';
                s.backgroundSize = 'cover';
                s.backgroundPosition = 'center';
            }
            return s;
        },
        isLight() {
            if (this.measured !== null && this.measured !== undefined) return this.measured;
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            if (mode === 'color' && this.widget.color) {
                const c = this.parseColor(this.widget.color);
                return c ? this.isLightRgb(c) : false;
            }
            if (mode === 'image' && this.widget.bg_image) return this.bgLight === true;
            return false;
        },
        ink() {
            return this.isLight
                ? { high: 'rgba(17,24,39,.92)', mid: 'rgba(17,24,39,.72)', dim: 'rgba(17,24,39,.5)', fill: 'rgba(17,24,39,.06)', line: 'rgba(17,24,39,.16)' }
                : { high: 'var(--on-theme-high)', mid: 'var(--on-theme-mid)', dim: 'var(--on-theme-dim)', fill: 'rgba(255,255,255,.08)', line: 'rgba(255,255,255,.14)' };
        },
        cardVars() {
            const k = this.ink;
            return { '--ac-ink-high': k.high, '--ac-ink-mid': k.mid, '--ac-ink-dim': k.dim };
        },
        refreshStyle() {
            return {
                flexShrink: '0', width: '22px', height: '22px', border: 'none', borderRadius: '50%',
                background: this.ink.fill, color: this.ink.mid, cursor: 'pointer', fontSize: '.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            };
        },
        noclassStyle() {
            return {
                padding: '10px 12px', fontSize: '.8rem', lineHeight: '1.35', textAlign: 'center',
                color: this.ink.mid,
            };
        },
        menuBtnStyle() {
            return {
                display: 'flex', alignItems: 'center', width: '100%', padding: '5px 9px', cursor: 'pointer',
                border: '1px solid ' + this.ink.line, borderRadius: '6px',
                background: this.ink.fill, color: this.ink.mid, fontSize: '.74rem',
            };
        },
        menuStyle() {
            const p = this.menuPos || { left: 8, top: 8, width: 200 };
            return {
                position: 'fixed', left: p.left + 'px', top: p.top + 'px', minWidth: Math.max(160, p.width) + 'px',
                maxWidth: '280px', maxHeight: Math.min(320, Math.round((window.innerHeight || 800) * 0.5)) + 'px', overflowY: 'auto',
                zIndex: '1200', padding: '4px 0', borderRadius: '8px',
                background: 'rgba(28,32,40,.98)', border: '1px solid rgba(255,255,255,.14)',
                boxShadow: '0 8px 30px rgba(0,0,0,.45)',
            };
        },
        addItemStyle() {
            return {
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', cursor: 'pointer',
                fontSize: '.78rem', color: '#e8eaed',
            };
        },
        itemStyle() {
            return {
                display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', cursor: 'pointer',
                fontSize: '.78rem',
            };
        },
        modalStyle() {
            return {
                position: 'relative', width: '92%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto',
                padding: '14px 16px 16px', borderRadius: '10px',
                background: '#1c2028', color: '#e8eaed', boxShadow: '0 12px 40px rgba(0,0,0,.5)',
            };
        },
        fieldStyle() {
            return { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' };
        },
        labelStyle() {
            return { fontSize: '.68rem', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '.04em' };
        },
        inputStyle() {
            return {
                width: '100%', boxSizing: 'border-box', padding: '6px 8px', fontSize: '.8rem', color: '#e8eaed',
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)',
                borderRadius: '6px', outline: 'none',
            };
        },
        inputCss() {
            return AC_INPUT_CSS;
        },
        inputCssTime() {
            return AC_INPUT_CSS + ';width:110px';
        },
        codeCss() {
            return AC_CODE_CSS;
        },
        delBtnStyle() {
            const danger = this.form && this.form.confirmDelete;
            return {
                padding: '7px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '.78rem',
                background: danger ? '#dc2626' : 'rgba(244,67,54,.18)', color: danger ? '#fff' : '#ef9a9a',
            };
        },
        volumeStyle() {
            return {
                width: '100%', flex: 1, boxSizing: 'border-box', padding: '0', fontSize: '.8rem',
            };
        },
        stopBtnStyle() {
            return {
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px',
                border: '1px solid ' + this.ink.line, borderRadius: '50%',
                background: this.ink.fill, color: this.ink.high, cursor: 'pointer', flexShrink: 0,
            };
        },
    },
    methods: {
        lum(c) {
            return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
        },
        over(base, c) {
            const a = Math.max(0, Math.min(1, c[3] == null ? 1 : c[3]));
            return [c[0] * a + base[0] * (1 - a), c[1] * a + base[1] * (1 - a), c[2] * a + base[2] * (1 - a)];
        },
        measureLight() {
            const el = this.$el;
            if (!el || !el.nodeType || typeof getComputedStyle === 'undefined') return null;
            const chain = [];
            let node = el, guard = 0;
            while (node && node.nodeType === 1 && guard++ < 14) {
                let cs = null;
                try { cs = getComputedStyle(node); } catch (e) { break; }
                if (!cs) break;
                chain.push({ bg: cs.backgroundColor, img: cs.backgroundImage });
                node = node.parentElement;
            }
            let base = [255, 255, 255];
            for (let i = chain.length - 1; i >= 0; i--) {
                const it = chain[i];
                if (it.img && it.img !== 'none') {
                    const m = /url\((['"]?)([^'")]+)\1\)/.exec(it.img);
                    if (m) {
                        const c = this.imgColor(m[2]);
                        if (c) base = c;
                    }
                }
                const c = this.parseColor(it.bg);
                if (c && (c[3] == null || c[3] > 0)) base = this.over(base, c);
            }
            return this.lum(base) > 0.62;
        },
        remeasure() {
            try {
                const v = this.measureLight();
                if (v !== null && v !== undefined) this.measured = v;
            } catch (e) { }
        },
        imgColor(url) {
            const key = String(url || '');
            if (!key || typeof Image === 'undefined') return null;
            if (!this._imgCache) this._imgCache = {};
            if (key in this._imgCache) {
                const c = this._imgCache[key];
                return c && c.length === 3 ? c : null;
            }
            this._imgCache[key] = null;
            try {
                const el = new Image();
                el.crossOrigin = 'anonymous';
                el.onload = () => {
                    try {
                        const cv = document.createElement('canvas');
                        cv.width = cv.height = 1;
                        const cx = cv.getContext('2d');
                        cx.drawImage(el, Math.floor(el.width / 2), Math.floor(el.height / 2), 1, 1, 0, 0, 1, 1);
                        const d = cx.getImageData(0, 0, 1, 1).data;
                        this._imgCache[key] = [d[0], d[1], d[2]];
                        this.remeasure();
                    } catch (e) { }
                };
                el.onerror = () => { };
                el.src = key;
            } catch (e) { }
            return null;
        },
        parseColor(v) {
            const s = String(v == null ? '' : v).trim();
            if (!s) return null;
            let m = /^#([0-9a-f]{3,8})$/i.exec(s);
            if (m) {
                let h = m[1];
                if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('');
                if (h.length < 6) return null;
                return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
            }
            m = /^rgba?\(([^)]+)\)$/i.exec(s);
            if (m) {
                const p = m[1].split(/[,/\s]+/).filter(Boolean).map(parseFloat);
                if (p.length < 3) return null;
                return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 && !isNaN(p[3]) ? p[3] : 1];
            }
            return null;
        },
        themeBase() {
            let v = '';
            try { v = (getComputedStyle(document.documentElement).getPropertyValue('--theme-bg') || '').trim(); } catch (e) { }
            const c = this.parseColor(v);
            return c ? [c[0], c[1], c[2]] : [255, 255, 255];
        },
        isLightRgb(c) {
            const a = c[3] == null ? 1 : Math.max(0, Math.min(1, c[3]));
            const base = this.themeBase();
            const r = c[0] * a + base[0] * (1 - a);
            const g = c[1] * a + base[1] * (1 - a);
            const b = c[2] * a + base[2] * (1 - a);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
        },
        sampleBgImage() {
            const img = String(this.widget.bg_image || '');
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            this.bgLight = null;
            if (mode !== 'image' || !img || typeof Image === 'undefined') return;
            const el = new Image();
            el.crossOrigin = 'anonymous';
            el.onload = () => {
                try {
                    const cv = document.createElement('canvas');
                    cv.width = cv.height = 1;
                    const cx = cv.getContext('2d');
                    cx.drawImage(el, Math.floor(el.width / 2), Math.floor(el.height / 2), 1, 1, 0, 0, 1, 1);
                    const d = cx.getImageData(0, 0, 1, 1).data;
                    this.bgLight = this.isLightRgb([d[0], d[1], d[2], 1]);
                } catch (e) { }
            };
            el.onerror = () => { };
            el.src = img;
        },
        qText(v) {
            return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "''");
        },
        stripHtml(v) {
            return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        },
        raiseLayer() {
            if (this.raised) return;
            const el = this.$el;
            const host = el && el.closest ? el.closest('.widget') : null;
            if (!host) return;
            this.raised = { el: host, z: host.style.zIndex };
            host.style.zIndex = '1200';
        },
        restoreLayer() {
            if (!this.raised) return;
            this.raised.el.style.zIndex = this.raised.z;
            this.raised = null;
        },
        timeParts(raw) {
            const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(raw == null ? '' : raw).trim());
            if (!m) return null;
            const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
            if (!(h >= 0 && h <= 23) || !(mi >= 0 && mi <= 59)) return null;
            const p = n => (n < 10 ? '0' : '') + n;
            return { h: h, m: mi, text: p(h) + ':' + p(mi), clean: m[1].length === 2 && m[2].length === 2 };
        },
        daysMask(raw) {
            const s = String(raw == null ? '' : raw);
            let out = '';
            for (let i = 0; i < 7; i++) out += (s.charAt(i) === '1' ? '1' : '0');
            return out;
        },
        flipDay(mask, di) {
            const s = String(mask || '0000000');
            return s.slice(0, di) + (s.charAt(di) === '1' ? '0' : '1') + s.slice(di + 1);
        },
        methodName(m) {
            const s = String(m || '').toLowerCase();
            if (s === 'sound') return this.t('ac_sound');
            if (s === 'method') return this.t('ac_method');
            if (s === 'script') return this.t('ac_script');
            if (s === 'code') return this.t('ac_code');
            return s;
        },
        dispName(a) {
            const descr = String(a && a.descr != null ? a.descr : '').trim();
            return descr || this.t('ac_noname');
        },
        build(rows) {
            const map = {};
            const list = [];
            (rows || []).forEach(r => {
                const name = r && r.name ? String(r.name) : '';
                if (!name) return;
                let a = map[name];
                if (!a) {
                    a = map[name] = { name: name, descr: String(r.descr == null ? '' : r.descr), props: {} };
                    list.push(a);
                }
                if (r.prop) {
                    const parts = String(r.prop).split('.');
                    a.props[parts[parts.length - 1]] = r.val == null ? '' : String(r.val);
                }
            });
            return list.map(a => {
                const p = a.props;
                const tp = this.timeParts(p.AlarmTime);
                const mask = this.daysMask(p.days);
                const on = String(p.AlarmOn == null ? '' : p.AlarmOn).trim() === '1';
                return {
                    name: a.name,
                    descr: a.descr,
                    props: p,
                    time: tp ? tp.text : '',
                    badTime: !!(p.AlarmTime !== undefined && p.AlarmTime !== '' && (!tp || !tp.clean)),
                    minutes: tp ? tp.h * 60 + tp.m : null,
                    on: on,
                    once: String(p.once == null ? '' : p.once).trim() === '1',
                    mask: mask,
                    maskOn: mask.indexOf('1') >= 0,
                    method: String(p.method == null ? '' : p.method).trim(),
                    label: this.stripHtml(on ? (p.custom_on || p.value) : (p.custom_off || p.value)),
                    busy: false,
                };
            });
        },
        async checkClass() {
            try {
                const cq = "SELECT ID FROM classes WHERE TITLE = '" + this.qText(this.className) + "'";
                const cd = await dpAPI('query?' + new URLSearchParams({ query: cq }));
                if (!cd || cd.error || !Array.isArray(cd.data)) return null;
                return cd.data.length > 0;
            } catch (e) {
                return null;
            }
        },
        async load(manual) {
            if (this.loading) return;
            this.loading = true;
            try {
                const hasClass = await this.checkClass();
                this.classMissing = hasClass === false;
                if (this.classMissing) {
                    this.items = [];
                    this.error = '';
                    this.loading = false;
                    return;
                }
                const q = "SELECT o.TITLE AS name,o.DESCRIPTION AS descr,p.PROPERTY_NAME AS prop,p.VALUE AS val"
                    + " FROM objects o JOIN classes c ON o.CLASS_ID = c.ID"
                    + " LEFT JOIN pvalues p ON p.OBJECT_ID = o.ID"
                    + " WHERE c.TITLE = '" + this.qText(this.className) + "'"
                    + " ORDER BY o.TITLE";
                const d = await dpAPI('query?' + new URLSearchParams({ query: q }));
                if (d && d.error) throw new Error(d.error);
                this.items = this.build(d && Array.isArray(d.data) ? d.data : []);
                this.error = '';
            } catch (e) {
                this.error = this.t('ac_error') + ': ' + ((e && e.message) || e);
            }
            this.loading = false;
            if (manual || this.flags.loop) await this.loadLoop();
        },
        twoDigits(n) {
            n = parseInt(n, 10) || 0;
            return (n < 10 ? '0' : '') + n;
        },
        armMinuteCheck() {
            if (this.minTimer) clearTimeout(this.minTimer);
            const d = new Date();
            const wait = (60 - d.getSeconds()) * 1000 - d.getMilliseconds() + 1500;
            this.minTimer = setTimeout(() => { this.armMinuteCheck(); this.checkFire(); }, Math.max(2000, wait));
        },
        checkFire() {
            const d = new Date();
            const key = this.twoDigits(d.getHours()) + ':' + this.twoDigits(d.getMinutes());
            if (!this.firedMin) this.firedMin = { key: '', names: {} };
            if (this.firedMin.key !== key) this.firedMin = { key: key, names: {} };
            const di = (d.getDay() + 6) % 7;
            this.rows.forEach(a => {
                if (!a || !a.on || a.time !== key) return;
                if (String(a.mask || '').charAt(di) !== '1') return;
                if (String(a.method || '') !== 'sound') return;
                if (this.firedMin.names[a.name]) return;
                this.firedMin.names[a.name] = 1;
                this.playBrowserSound(a.props && a.props.code ? a.props.code : '');
            });
        },
        soundUrl(name) {
            const raw = String(name == null ? '' : name).trim();
            if (!raw) return '';
            if (/^https?:\/\//i.test(raw)) return raw;
            const base = '/cms/sounds/';
            return base + encodeURIComponent(raw) + (raw.toLowerCase().indexOf('.mp3') >= 0 ? '' : '.mp3');
        },
        setVolume(e) {
            const v = parseFloat(e && e.target ? e.target.value : this.volume);
            this.volume = isNaN(v) ? 0.9 : Math.max(0, Math.min(1, v));
            if (this.audio) {
                try { this.audio.volume = this.volume; } catch (e) {}
            }
        },
        stopSound() {
            try {
                if (this.audio) {
                    try { this.audio.pause(); } catch (e) {}
                    try { this.audio.currentTime = 0; } catch (e) {}
                    try { this.audio.remove(); } catch (e) {}
                }
            } catch (e) {}
            this.audio = null;
            this.isPlaying = false;
            this.unarmSoundRetry();
        },
        playBrowserSound(name) {
            const src = this.soundUrl(name);
            if (!src) return;
            this.stopSound();
            let a;
            try { a = new Audio(src); } catch (e) { return; }
            if (!a) return;
            this.audio = a;
            a.volume = this.volume;
            this.isPlaying = true;
            const onEnd = () => { this.stopSound(); };
            try { a.addEventListener('ended', onEnd, { once: true }); } catch (e) {}
            try { a.addEventListener('error', onEnd, { once: true }); } catch (e) {}
            try {
                const p = a.play();
                if (p && p.then) {
                    p.then(() => { this.unarmSoundRetry(); }).catch(() => { this.unarmSoundRetry(); this.armSoundRetry(src); });
                }
            } catch (e) { this.unarmSoundRetry(); this.armSoundRetry(src); }
        },
        armSoundRetry(src) {
            if (this._retrySrc || typeof document === 'undefined') return;
            this._retrySrc = src;
            const once = () => {
                this.unarmSoundRetry();
                this.stopSound();
                let a;
                try { a = new Audio(src); } catch (e) { a = null; }
                if (!a) return;
                this.audio = a;
                a.volume = this.volume;
                this.isPlaying = true;
                const onEnd = () => { this.stopSound(); };
                try { a.addEventListener('ended', onEnd, { once: true }); } catch (e) {}
                try { a.addEventListener('error', onEnd, { once: true }); } catch (e) {}
                try { a.play(); } catch (e) {}
            };
            this._retryOnce = once;
            try { document.addEventListener('pointerdown', once, true); } catch (e) {}
            try { document.addEventListener('keydown', once, true); } catch (e) {}
        },
        unarmSoundRetry() {
            if (this._retryOnce && typeof document !== 'undefined') {
                try { document.removeEventListener('pointerdown', this._retryOnce, true); } catch (e) {}
                try { document.removeEventListener('keydown', this._retryOnce, true); } catch (e) {}
                this._retryOnce = null;
            }
            this._retrySrc = null;
        },
        async loadLoop() {
            const raw = String(this.widget.loop_object || 'cycle_alarmclock').trim();
            const base = (raw.indexOf('cycle_') === 0 ? raw.slice(6) : raw).replace(/[^A-Za-z0-9_]/g, '');
            if (!base) return;
            try {
                const q = "SELECT TITLE,VALUE FROM cached_cycles WHERE TITLE IN ('cycle_" + base + "Run','cycle_" + base + "LastError')";
                const d = await dpAPI('query?' + new URLSearchParams({ query: q }));
                if (!d || d.error || !Array.isArray(d.data)) { this.loopAge = null; return; }
                let beat = 0, err = '';
                d.data.forEach(r => {
                    const k = String(r.TITLE == null ? '' : r.TITLE);
                    const v = String(r.VALUE == null ? '' : r.VALUE);
                    if (k === 'cycle_' + base + 'Run') beat = parseInt(v, 10) || 0;
                    else if (k === 'cycle_' + base + 'LastError') err = v;
                });
                this.loopErr = err;
                this.loopAge = beat > 0 ? Math.max(0, Math.round(Date.now() / 1000 - beat)) : null;
            } catch (e) {
                this.loopAge = null;
            }
        },
        toggleMenu() {
            if (this.menuOpen) { this.closeMenu(); return; }
            this.openMenu();
        },
        measure() {
            const ref = this.$refs ? this.$refs.menuBtn : null;
            if (ref && ref.getBoundingClientRect) {
                const r = ref.getBoundingClientRect();
                if (r && r.width) return r;
            }
            if (this.$el && this.$el.getBoundingClientRect) {
                const r = this.$el.getBoundingClientRect();
                if (r && r.width) return r;
            }
            return { left: 12, top: 12, bottom: 12, width: 200, height: 0 };
        },
        openMenu() {
            const r = this.measure();
            const vh = window.innerHeight || 800;
            const h = Math.min(320, Math.round(vh * 0.5));
            const below = vh - (r.bottom || (r.top || 0));
            this.menuPos = {
                left: Math.max(8, r.left || 8),
                width: r.width || 200,
                top: below < h + 12 ? Math.max(8, (r.top || 8) - h - 6) : (r.bottom || 12) + 6,
            };
            this.menuOpen = true;
            this.raiseLayer();
            document.addEventListener('click', this._docClick, true);
        },
        closeMenu() {
            if (!this.menuOpen) return;
            this.menuOpen = false;
            document.removeEventListener('click', this._docClick, true);
            if (!this.modalOpen) this.restoreLayer();
        },
        withCurrent(names, current) {
            const out = (names || []).slice();
            const cur = String(current == null ? '' : current);
            if (cur && out.indexOf(cur) < 0) out.push(cur);
            return out;
        },
        emptyForm() {
            return {
                name: '', descr: '', isNew: true, error: '', confirmDelete: false,
                time: '07:00', on: true, once: 0, mask: '1111111', method: 'code',
                php: '', sound: '', script: '', linkedObject: '', linkedMethod: '', customOn: '', customOff: '', original: {},
            };
        },
        actionOf(m) {
            const v = String(m == null ? '' : m);
            return (v === 'sound' || v === 'script' || v === 'method') ? v : 'code';
        },
        splitMethod(code, propObject, propMethod) {
            const obj = String(propObject == null ? '' : propObject);
            const meth = String(propMethod == null ? '' : propMethod);
            if (obj || meth) return [obj, meth];
            const parts = String(code == null ? '' : code).split('.');
            if (parts.length >= 2) return [parts[0], parts.slice(1).join('.')];
            return [String(code == null ? '' : code), ''];
        },
        formFromAlarm(a) {
            const rawCode = String(a.props.code == null ? '' : a.props.code);
            const action = this.actionOf(a.method);
            const linked = action === 'method' ? this.splitMethod(rawCode, a.props.linked_object, a.props.linked_method) : ['', ''];
            return {
                name: a.name, descr: a.descr, isNew: false, error: '', confirmDelete: false,
                time: a.time || '07:00', on: a.on, once: a.once ? 1 : 0, mask: a.mask,
                method: action,
                php: action === 'code' ? rawCode : '',
                sound: action === 'sound' ? rawCode : '',
                script: action === 'script' ? rawCode : '',
                linkedObject: linked[0], linkedMethod: linked[1],
                code: rawCode, customOn: String(a.props.custom_on == null ? '' : a.props.custom_on),
                customOff: String(a.props.custom_off == null ? '' : a.props.custom_off),
                original: {
                    DESCRIPTION: a.descr, AlarmTime: a.time, days: a.mask, AlarmOn: a.on ? '1' : '0',
                    once: a.once ? '1' : '0', method: a.method,
                    code: String(a.props.code == null ? '' : a.props.code),
                    custom_on: String(a.props.custom_on == null ? '' : a.props.custom_on),
                    custom_off: String(a.props.custom_off == null ? '' : a.props.custom_off),
                },
            };
        },
        openModal(a) {
            this.closeMenu();
            this.form = this.formFromAlarm(a);
            this.modalOpen = true;
            this.raiseLayer();
            this.loadActionLists();
            this._docKey = (e) => { if (e.key === 'Escape') this.closeModal(); };
            document.addEventListener('keydown', this._docKey);
        },
        startNew() {
            this.closeMenu();
            this.form = this.emptyForm();
            this.modalOpen = true;
            this.raiseLayer();
            this.loadActionLists();
            this._docKey = (e) => { if (e.key === 'Escape') this.closeModal(); };
            document.addEventListener('keydown', this._docKey);
        },
        closeModal() {
            if (!this.modalOpen) return;
            this.modalOpen = false;
            document.removeEventListener('keydown', this._docKey);
            if (!this.menuOpen) this.restoreLayer();
        },
        async loadActionLists() {
            const f = this.form;
            if (!f) return;
            try {
                if (f.method === 'script' && !this.scriptList.length) {
                    const d = await dpAPI('scripts');
                    this.scriptList = (d && Array.isArray(d.items)) ? d.items : [];
                }
                if (f.method === 'sound' && !this.soundList.length) {
                    const d = await dpAPI('sounds');
                    this.soundList = (d && Array.isArray(d.items)) ? d.items : [];
                }
                if (f.method === 'method') {
                    if (!this.objectList.length) {
                        const d = await dpAPI('objects');
                        this.objectList = (d && Array.isArray(d.items)) ? d.items : [];
                    }
                    await this.loadMethods();
                }
                if (f.method === 'code') await this.loadOwnCode();
            } catch (e) { }
        },
        async loadOwnCode() {
            const f = this.form;
            if (!f || f.isNew || !f.name) return;
            if (this.codeLoadedFor === f.name) return;
            this.codeLoadedFor = f.name;
            try {
                const q = "SELECT m.CODE FROM methods m JOIN objects o ON m.OBJECT_ID = o.ID WHERE o.TITLE = '" + this.qText(f.name) + "' AND m.TITLE = 'AlarmRun'";
                const d = await dpAPI('query?' + new URLSearchParams({ query: q }));
                if (!d || d.error || !Array.isArray(d.data) || !d.data.length) return;
                const whole = String(d.data[0].CODE == null ? '' : d.data[0].CODE);
                const inner = this.injectedCode(whole, 'Alarmclock');
                if (inner !== null) { f.php = inner; f.codeFromMethod = true; }
                else if (whole.trim() !== '') { f.php = whole.trim(); f.codeFromMethod = false; }
            } catch (e) { }
        },
        injectedCode(code, key) {
            const re = new RegExp('/\\* begin injection of \\{' + key + '\\} \\*/([\\s\\S]*?)/\\* end injection of \\{' + key + '\\} \\*/', 'i');
            const m = String(code == null ? '' : code).match(re);
            return m ? String(m[1]).trim() : null;
        },
        onObjectChange() {
            this.methodsFor = '';
            this.methodList = [];
            this.form.linkedMethod = '';
            this.loadMethods();
        },
        async loadMethods() {
            const f = this.form;
            if (!f || !f.linkedObject || f.linkedObject === this.methodsFor) return;
            this.methodsFor = f.linkedObject;
            try {
                const d = await dpAPI('methods?' + new URLSearchParams({ object_id: f.linkedObject }));
                this.methodList = (d && Array.isArray(d.items)) ? d.items : [];
            } catch (e) {
                this.methodList = [];
            }
        },
        actionCode() {
            const f = this.form;
            if (f.method === 'method') return (f.linkedObject && f.linkedMethod) ? f.linkedObject + '.' + f.linkedMethod : '';
            if (f.method === 'sound') return String(f.sound || '');
            if (f.method === 'script') return String(f.script || '');
            return String(f.php || '');
        },
        async setProp(object, property, value) {
            const d = await dpAPI('setProperty?' + new URLSearchParams({ object: object, property: property, value: String(value) }));
            if (d && d.error) throw new Error(d.error);
        },
        async postJson(op, payload) {
            const d = await dpAPI(op, { method: 'POST', body: JSON.stringify(payload || {}) });
            if (d && d.error) throw new Error(d.error);
            return d || {};
        },
        async saveForm() {
            const f = this.form;
            if (!f || this.saving) return;
            const tp = this.timeParts(f.time);
            if (!tp) { f.error = this.t('ac_need_time'); return; }
            this.saving = true;
            f.error = '';
            try {
                const code = this.actionCode();
                const php = f.method === 'code' ? String(f.php || '') : '';
                if (f.isNew) {
                    await this.postJson('objectSave', {
                        class: this.className, descr: String(f.descr || ''),
                        props: {
                            AlarmTime: tp.text, days: f.mask, AlarmOn: f.on ? '1' : '0',
                            once: String(f.once), method: f.method, code: code,
                            custom_on: String(f.customOn || ''), custom_off: String(f.customOff || ''),
                        },
                        inject: { method: 'AlarmRun', key: 'Alarmclock', code: php },
                    });
                } else {
                    if (String(f.descr) !== String(f.original.DESCRIPTION)) {
                        await this.postJson('objectSave', { class: this.className, name: f.name, descr: String(f.descr || '') });
                    }
                    const wanted = [['AlarmTime', tp.text], ['days', f.mask], ['AlarmOn', f.on ? '1' : '0'], ['once', String(f.once)], ['method', f.method], ['code', code]];
                    if (this.flags.labels) wanted.push(['custom_on', String(f.customOn || '')], ['custom_off', String(f.customOff || '')]);
                    for (const pair of wanted) {
                        const property = pair[0], value = String(pair[1]);
                        if (f.original[property] !== undefined && f.original[property] === value) continue;
                        await this.setProp(f.name, property, value);
                    }
                    if (f.method === 'method' && f.linkedObject && f.linkedMethod) {
                        await this.setProp(f.name, 'linked_object', f.linkedObject);
                        await this.setProp(f.name, 'linked_method', f.linkedMethod);
                    }
                    if (f.method === 'code' && php !== String(f.original.code || '')) {
                        await this.postJson('objectSave', {
                            class: this.className, name: f.name,
                            inject: { method: 'AlarmRun', key: 'Alarmclock', code: php },
                        });
                    }
                }
                this.modalOpen = false;
                document.removeEventListener('keydown', this._docKey);
                this.restoreLayer();
                await this.load(true);
            } catch (e) {
                f.error = (e && e.message) || String(e);
            }
            this.saving = false;
        },
        async removeForm() {
            const f = this.form;
            if (!f || this.saving || f.isNew) return;
            if (!f.confirmDelete) { f.confirmDelete = true; return; }
            this.saving = true;
            f.error = '';
            try {
                await this.postJson('objectDelete', { object: f.name, class: this.className });
                this.modalOpen = false;
                document.removeEventListener('keydown', this._docKey);
                this.restoreLayer();
                await this.load(true);
            } catch (e) {
                f.error = (e && e.message) || String(e);
            }
            this.saving = false;
        },
        nextInfo(a) {
            if (!a.on || a.minutes === null || !a.maskOn) return null;
            const d = new Date(this.now);
            const cur = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
            const today = (d.getDay() + 6) % 7;
            for (let add = 0; add <= 7; add++) {
                const idx = (today + add) % 7;
                if (a.mask.charAt(idx) !== '1') continue;
                const delta = add * 1440 + a.minutes - cur;
                if (delta > 0) return { min: delta, dayIdx: idx };
            }
            return null;
        },
        nextIn(a) {
            const n = this.nextInfo(a);
            return n ? n.min : null;
        },
        fmtDelta(m) {
            if (m < 1) return this.t('ac_soon');
            const h = Math.floor(m / 60), mm = Math.round(m % 60);
            let out = '';
            if (h > 0) out += h + ' ' + this.t('ac_h');
            if (h > 0 && mm > 0) out += ' ';
            if (mm > 0 || h === 0) out += mm + ' ' + this.t('ac_m');
            return out;
        },
        dotStyle(a) {
            return {
                flexShrink: '0', width: '7px', height: '7px', borderRadius: '50%',
                background: a.on ? '#4caf50' : 'rgba(255,255,255,.25)',
                boxShadow: a.on ? '0 0 5px rgba(76,175,80,.55)' : 'none',
            };
        },
        dayStyle(di) {
            const on = this.form && this.form.mask.charAt(di) === '1';
            const today = di === this.todayIdx;
            return {
                width: '28px', height: '26px', padding: '0', borderRadius: '5px', cursor: 'pointer', lineHeight: '1',
                fontSize: '.68rem', fontWeight: today ? '700' : '400',
                border: '1px solid ' + (on ? '#81c784' : (today ? 'var(--primary)' : 'rgba(255,255,255,.18)')),
                background: on ? (today ? '#2e7d32' : '#4caf50') : 'rgba(255,255,255,.3)',
                color: on ? '#ffffff' : '#e8eaed',
            };
        },
    },
};

window.DpWidgets = window.DpWidgets || {};

(function injectAcWidgetStyle() {
    if (typeof document === 'undefined') return;
    try {
        if (document.getElementById('ac-widget-style')) return;
        const st = document.createElement('style');
        st.id = 'ac-widget-style';
        st.textContent = [
            '.widget-v-card .ac-modal input,',
            '.widget-v-card .ac-modal select,',
            '.widget-v-card .ac-modal textarea { color:#e8eaed !important; }',
            '.widget-v-card .ac-modal input::placeholder,',
            '.widget-v-card .ac-modal textarea::placeholder { color:#9aa0a6 !important; }',
            '.widget-v-card .ac-modal select option { background:#1c2028; color:#e8eaed !important; }',
            '.widget-v-card .ac-modal button { color:#e8eaed !important; }',
            '.widget-v-card .ac-modal button.ac-del { color:#ef9a9a !important; }',
            '.widget-v-card .ac-modal button.ac-del-danger { color:#fff !important; }',
            '.widget-v-card .ac-modal .ac-day { color:#e8eaed !important; }',
            '.widget-v-card .ac-modal .ac-day-on { color:#ffffff !important; }',
            '.widget-v-card button.ac-menu-btn,',
            '.widget-v-card button.ac-refresh { color:var(--ac-ink-mid) !important; }',
            '.widget-v-card .ac-noclass { color:var(--ac-ink-mid) !important; }',
            '.widget-v-card .ac-menu .ac-menu-add,',
            '.widget-v-card .ac-menu .ac-menu-time { color:#e8eaed !important; }',
            '.widget-v-card .ac-menu .ac-menu-name,',
            '.widget-v-card .ac-menu .ac-menu-empty { color:#a7acb3 !important; }',
            '.widget-v-card .ac-menu .ac-menu-badge { color:#c9cdd1 !important; }',
        ].join('\n');
        (document.head || document.documentElement).appendChild(st);
    } catch (e) { }
})();

window.DpWidgets.alarmclock = AlarmClockWidget;
