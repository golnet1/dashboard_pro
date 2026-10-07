const MusicplayerWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'main' },
        { key: 'params', label: 'tab_params', fields: 'params' },
        { key: 'light', label: 'tab_cm', fields: 'light' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        main: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{ value: 'icon', label: 'opt_icon' }, { value: 'property', label: 'opt_property' }, { value: 'url', label: 'opt_url' }] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'folder', label: 'mu_field_folder', type: 'dir_picker', inputType: 'text', placeholder: 'cms/sounds' },
            { key: 'state_object', label: 'mu_field_state_object', type: 'object', row: 'state_row' },
            { key: 'state_property', label: 'mu_field_state_property', type: 'property', row: 'state_row' },
            { key: 'playlist', label: 'mu_field_playlist', type: 'textarea', rows: 5, placeholder: 'mu_ph_playlist' },
        ],
        params: [
            { key: 'autoplay', label: 'mu_field_autoplay', type: 'checkbox', default: false },
            { key: 'shuffle', label: 'mu_field_shuffle', type: 'checkbox', default: false },
            { key: 'repeat', label: 'mu_field_repeat', type: 'select', default: 'off', options: [{ value: 'off', label: 'mu_opt_repeat_off' }, { value: 'one', label: 'mu_opt_repeat_one' }, { value: 'all', label: 'mu_opt_repeat_all' }] },
            { key: 'volume', label: 'mu_field_volume', type: 'number', step: 0.05, default: 0.8 },
            { key: 'show_playlist', label: 'mu_field_show_playlist', type: 'checkbox', default: true },
            { key: 'show_spectrum', label: 'mu_field_show_spectrum', type: 'checkbox', default: true },
        ],
        light: [
            { key: 'dev_type', label: 'cm_dev_type', type: 'select', default: 'ports', options: [{ value: 'ports', label: 'cm_dev_ports' }, { value: 'rgb', label: 'cm_dev_rgb' }, { value: 'ic', label: 'cm_dev_ic' }] },
            { key: 'port_ch', label: 'cm_ch_count', type: 'select', default: '3', showIf: { dev_type: 'ports' }, options: [{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' }, { value: '7', label: '7' }] },
            { key: 'object_p1', label: 'cm_ch1', type: 'object', row: 'cm_p1', showIf: { dev_type: 'ports' } },
            { key: 'property_p1', label: 'cm_prop', type: 'property', row: 'cm_p1', showIf: { dev_type: 'ports' } },
            { key: 'object_p2', label: 'cm_ch2', type: 'object', row: 'cm_p2', showIf: { dev_type: 'ports' } },
            { key: 'property_p2', label: 'cm_prop', type: 'property', row: 'cm_p2', showIf: { dev_type: 'ports' } },
            { key: 'object_p3', label: 'cm_ch3', type: 'object', row: 'cm_p3', showIf: { dev_type: 'ports' } },
            { key: 'property_p3', label: 'cm_prop', type: 'property', row: 'cm_p3', showIf: { dev_type: 'ports' } },
            { key: 'object_p4', label: 'cm_ch4', type: 'object', row: 'cm_p4', showIf: { dev_type: 'ports', port_ch: ['4', '5', '6', '7'] } },
            { key: 'property_p4', label: 'cm_prop', type: 'property', row: 'cm_p4', showIf: { dev_type: 'ports', port_ch: ['4', '5', '6', '7'] } },
            { key: 'object_p5', label: 'cm_ch5', type: 'object', row: 'cm_p5', showIf: { dev_type: 'ports', port_ch: ['5', '6', '7'] } },
            { key: 'property_p5', label: 'cm_prop', type: 'property', row: 'cm_p5', showIf: { dev_type: 'ports', port_ch: ['5', '6', '7'] } },
            { key: 'object_p6', label: 'cm_ch6', type: 'object', row: 'cm_p6', showIf: { dev_type: 'ports', port_ch: ['6', '7'] } },
            { key: 'property_p6', label: 'cm_prop', type: 'property', row: 'cm_p6', showIf: { dev_type: 'ports', port_ch: ['6', '7'] } },
            { key: 'object_p7', label: 'cm_ch7', type: 'object', row: 'cm_p7', showIf: { dev_type: 'ports', port_ch: '7' } },
            { key: 'property_p7', label: 'cm_prop', type: 'property', row: 'cm_p7', showIf: { dev_type: 'ports', port_ch: '7' } },
            { key: 'port_mode', label: 'cm_mode', type: 'select', default: 'freq', showIf: { dev_type: 'ports' }, options: [{ value: 'freq', label: 'cm_mode_freq' }, { value: 'wave', label: 'cm_mode_wave' }] },
            { key: 'port_out', label: 'cm_out', type: 'select', default: 'onoff', showIf: { dev_type: 'ports' }, options: [{ value: 'level', label: 'cm_out_level' }, { value: 'onoff', label: 'cm_out_onoff' }] },
            { key: 'cm_on_level', label: 'cm_on_level', type: 'number', step: 5, default: 90, showIf: { dev_type: 'ports', port_out: 'onoff' } },
            { key: 'wr_mode', label: 'cm_write', type: 'select', default: 'hex', showIf: { dev_type: ['rgb', 'ic'] }, options: [{ value: 'hex', label: 'cm_wr_hex' }, { value: 'rgb', label: 'cm_wr_rgb' }] },
            { key: 'object_hex', label: 'cm_object', type: 'object', row: 'cm_hex', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'hex' } },
            { key: 'property_hex', label: 'cm_prop', type: 'property', row: 'cm_hex', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'hex' } },
            { key: 'object_r', label: 'cm_r', type: 'object', row: 'cm_r', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'property_r', label: 'cm_prop', type: 'property', row: 'cm_r', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'object_g', label: 'cm_g', type: 'object', row: 'cm_g', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'property_g', label: 'cm_prop', type: 'property', row: 'cm_g', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'object_b', label: 'cm_b', type: 'object', row: 'cm_b', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'property_b', label: 'cm_prop', type: 'property', row: 'cm_b', showIf: { dev_type: ['rgb', 'ic'], wr_mode: 'rgb' } },
            { key: 'ic_mode', label: 'cm_effects', type: 'select', default: 'cm', showIf: { dev_type: 'ic' }, options: [{ value: 'cm', label: 'cm_ic_cm' }, { value: 'wave', label: 'cm_ic_wave' }, { value: 'cm_wave', label: 'cm_ic_wave_fade' }, { value: 'shuffle', label: 'cm_ic_shuffle' }] },
            { key: 'end_action', label: 'cm_on_end', type: 'select', default: 'off', showIf: { dev_type: 'rgb' }, options: [{ value: 'off', label: 'cm_end_off' }, { value: 'on', label: 'cm_end_on' }, { value: 'keep', label: 'cm_end_keep' }] },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{ value: 'default', label: 'opt_default' }, { value: 'image', label: 'opt_image' }, { value: 'color', label: 'opt_custom_color' }, { value: 'property', label: 'opt_color_property' }] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'color_mode', label: 'mu_field_color_mode', type: 'select', default: 'dominant', options: [{ value: 'off', label: 'mu_opt_cm_off' }, { value: 'dominant', label: 'mu_opt_cm_dominant' }, { value: 'bands', label: 'mu_opt_cm_bands' }] },
            { key: 'color_object', label: 'mu_field_color_object', type: 'text', showIf: { color_mode: 'dominant' } },
            { key: 'color_property', label: 'mu_field_color_property', type: 'text', showIf: { color_mode: 'dominant' } },
            { key: 'bands', label: 'mu_field_bands', type: 'textarea', rows: 6, placeholder: 'mu_ph_bands' },
            { key: 'color_threshold', label: 'mu_field_color_threshold', type: 'number', step: 5, default: 90 },
            { key: 'color_interval', label: 'mu_field_color_interval', type: 'number', step: 100, default: 500 },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1, default: 3 },
        ],
    },
    defaults: {
        icon: 'fas fa-music', icon_type: 'icon',
        folder: 'cms/sounds', state_object: 'DashboardProMusicplayer', state_property: 'Playlist', playlist: '[]',
        autoplay: false, shuffle: false, repeat: 'off', volume: 0.8, show_playlist: true, show_spectrum: true,
        color_mode: 'dominant', color_object: '', color_property: '', bands: '',
        color_threshold: 90, color_interval: 500,
        dev_type: 'ports', port_ch: '3', port_mode: 'freq', port_out: 'onoff', cm_on_level: 90, wr_mode: 'hex', ic_mode: 'cm', end_action: 'off',
        width: 320, height: 400,
    },
    template: `
        <div class="widget-v-card dp-music" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_musicplayer') }}</div>
                <button class="dp-music__ibtn" :class="{ 'dp-music__ibtn--on': cmOn }" @click.stop="toggleCm" :title="cmTitle"><i class="fas fa-lightbulb"></i></button>
                <button class="dp-music__ibtn" @click.stop="togglePicker" :title="t('mu_add_file')"><i class="fas fa-plus"></i></button>
                <button class="dp-music__ibtn" @click.stop="clearAll" :title="t('mu_clear')"><i class="fas fa-trash"></i></button>
            </div>
            <div class="widget-v-card__body dp-music__body">
                <div class="dp-music__now" v-if="current">
                    <div class="dp-music__name" :title="currentTitle">{{ currentTitle }}</div>
                    <div class="dp-music__times"><span>{{ posText }}</span><span>{{ durText }}</span></div>
                    <div class="dp-music__seek" @click.stop="onSeek">
                        <div class="dp-music__seek-fill" :style="{ width: progressPct + '%' }"></div>
                    </div>
                </div>
                <div class="dp-music__empty" v-else-if="!tracks.length">{{ t('mu_empty') }}</div>
                <div class="dp-music__empty" v-else>{{ t('mu_pick') }}</div>
                <div class="dp-music__transport">
                    <button class="dp-music__tbtn" :class="{ 'dp-music__tbtn--on': shuffleOn }" @click.stop="shuffleOn = !shuffleOn" :title="t('mu_shuffle')"><i class="fas fa-shuffle"></i></button>
                    <button class="dp-music__tbtn" @click.stop="prevTrack" :title="t('mu_prev')"><i class="fas fa-step-backward"></i></button>
                    <button class="dp-music__tbtn dp-music__tbtn--main" @click.stop="toggle" :title="playing ? t('mu_pause') : t('mu_play')"><i :class="playing ? 'fas fa-pause' : 'fas fa-play'"></i></button>
                    <button class="dp-music__tbtn" @click.stop="nextTrack" :title="t('mu_next')"><i class="fas fa-step-forward"></i></button>
                    <button class="dp-music__tbtn" :class="{ 'dp-music__tbtn--on': repeatMode !== 'off' }" @click.stop="cycleRepeat" :title="t('mu_repeat')"><i class="fas" :class="repeatMode === 'one' ? 'fas fa-redo-alt' : 'fas fa-redo'"></i></button>
                </div>
                <div class="dp-music__vol">
                    <i class="fas fa-volume-down"></i>
                    <input type="range" min="0" max="1" step="0.05" :value="volume" @input.stop="onVolume($event)">
                    <i class="fas fa-volume-up"></i>
                </div>
                <div class="dp-music__spectrum" v-if="showSpectrum">
                    <span class="dp-music__cell" v-for="(v, si) in spectrum" :key="si"><i :style="{ height: v + '%', background: spectrumColor(si) }"></i></span>
                </div>
                <div class="dp-music__picker" v-if="pickerOpen">
                    <div class="dp-music__picker-head">{{ t('mu_files') }}</div>
                    <div class="dp-music__files" v-if="filesLoading"><i class="fas fa-circle-notch fa-spin"></i></div>
                    <div class="dp-music__files" v-else-if="!files.length">{{ t('mu_no_files') }}</div>
                    <label class="dp-music__file" v-for="f in files" :key="f.path">
                        <input type="checkbox" :value="f.path" v-model="picked">
                        <span :title="f.path">{{ f.name }}</span>
                    </label>
                    <div class="dp-music__picker-row">
                        <input class="dp-music__url" v-model="manualUrl" :placeholder="t('mu_url_ph')" @keyup.enter="addManual">
                        <button class="dp-music__ibtn" @click.stop="addManual" :title="t('mu_add')"><i class="fas fa-check"></i></button>
                    </div>
                    <div class="dp-music__picker-hint">{{ t('mu_url_hint') }}</div>
                    <div class="dp-music__picker-row">
                        <button class="dp-music__wide" :disabled="!picked.length" @click.stop="addPicked">{{ picked.length ? t('mu_add_selected') : t('mu_nothing_picked') }}</button>
                    </div>
                    <div class="dp-music__picker-row" v-if="pickerError"><span class="dp-music__err">{{ pickerError }}</span></div>
                </div>
                <div class="dp-music__list" v-if="showPlaylist && tracks.length">
                    <div class="dp-music__row" :class="{ 'dp-music__row--on': ti === index }" v-for="(tr, ti) in tracks" :key="tr.key" @click.stop="playIndex(ti)">
                        <i class="fas" :class="ti === index && playing ? 'fas fa-volume-high' : 'fas fa-music'"></i>
                        <span class="dp-music__row-name" :title="tr.src">{{ tr.title }}</span>
                        <button class="dp-music__x" @click.stop="removeTrack(ti)" :title="t('mu_remove')"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return {
            tracks: [], index: -1, playing: false, position: 0, duration: 0, volume: 0.8, shuffleOn: false, repeatMode: 'off',
            pickerOpen: false, files: [], filesLoading: false, pickerError: '', picked: [], manualUrl: '',
            spectrum: new Array(24).fill(0), audioEl: null, actx: null, analyser: null, gainNode: null, graphDone: false,
            freqData: null, rafId: 0, lastColorAt: 0, sentColors: {}, saveTimer: null, keySeq: 0,
            isAlive: true, availTimer: null, gestureArmed: false,
            cmOn: false, cmTimer: 0, lastCmAt: 0, sentCm: {}, cmPending: [],
            cmPos: 0, cmHueD: 0, cmFast: null, cmSlow: null, cmBeatAt: 0,
            cmShuffled: false, cmRoll: [1, 1, 1], cmQueuedNext: false,
        };
    },
    computed: {
        showSpectrum() { return this.widget.show_spectrum !== false; },
        showPlaylist() { return this.widget.show_playlist !== false; },
        current() { return this.index >= 0 && this.index < this.tracks.length ? this.tracks[this.index] : null; },
        currentTitle() { return this.current ? (this.current.title || this.current.src) : ''; },
        posText() { return this.fmtTime(this.position); },
        durText() { return this.fmtTime(this.duration); },
        progressPct() { return this.duration > 0 ? Math.min(100, Math.max(0, this.position / this.duration * 100)) : 0; },
        cardStyle() {
            const s = {};
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            if (mode === 'color' && this.widget.color) s.backgroundColor = this.widget.color;
            else if (mode === 'image' && this.widget.bg_image) {
                s.backgroundImage = 'url(' + this.widget.bg_image + ')';
                s.backgroundSize = 'cover';
                s.backgroundPosition = 'center';
            }
            return s;
        },
        bandList() {
            let arr = null;
            if (this.widget.bands) {
                try { const p = JSON.parse(this.widget.bands); if (Array.isArray(p) && p.length) arr = p; } catch (e) { arr = null; }
            }
            if (!arr) arr = MusicplayerWidget.DEFAULT_BANDS;
            return arr.map(b => ({
                lo: Math.max(0, Number(b.lo) || 0),
                hi: Math.max(1, Number(b.hi) || 1000),
                color: String(b.color || '#ffffff'),
                object: String(b.object || '').trim(),
                property: String(b.property || '').trim(),
            }));
        },
        colorOn() {
            const m = String(this.widget.color_mode || 'dominant');
            return m === 'dominant' || m === 'bands';
        },
        cmDevice() { return this.opt(this.widget.dev_type, ['ports', 'rgb', 'ic'], 'ports'); },
        cmWrite() { return this.opt(this.widget.wr_mode, ['hex', 'rgb'], 'hex'); },
        cmChannelCount() {
            const n = parseInt(String(this.widget.port_ch), 10);
            return n >= 3 && n <= 7 ? n : 3;
        },
        cmPortMode() { return this.opt(this.widget.port_mode, ['freq', 'wave'], 'freq'); },
        cmPortOut() { return this.opt(this.widget.port_out, ['level', 'onoff'], 'onoff'); },
        cmOnLevel() {
            const v = parseInt(String(this.widget.cm_on_level), 10);
            return v >= 0 && v <= 255 ? v : 90;
        },
        cmIcMode() { return this.opt(this.widget.ic_mode, ['cm', 'wave', 'cm_wave', 'shuffle'], 'cm'); },
        cmTitle() {
            const tp = this.cmDevice;
            if (tp === 'ports') return this.cmPortMode === 'wave' ? this.t('cm_mode_wave') : this.t('cm_mode_freq');
            if (tp === 'rgb') return this.t('cm_ic_cm');
            return this.t('cm_ic_' + this.cmIcMode);
        },
        aliveDisabled() { return !!(this.widget.object_alive && this.widget.property_alive) && this.isAlive === false; },
    },
    watch: {
        'widget.volume'(v) { this.setVolume(v); },
        'widget.autoplay'(v) { if (v) this.playIndex(this.index < 0 ? 0 : this.index); else if (this.playing) this.pause(); },
        'widget.folder'() { this.files = []; this.pickerError = ''; },
        'widget.color_mode'(v) { if (String(v) === 'off') this.clearColors(); },
    },
    mounted() {
        this.volume = this.clamp01(this.widget.volume === undefined || this.widget.volume === '' ? 0.8 : Number(this.widget.volume));
        this.repeatMode = this.opt(this.widget.repeat, ['off', 'one', 'all'], 'off');
        this.shuffleOn = this.widget.shuffle === true;
        this.initTracks();
        this.cmOn = this.cmTargets().length > 0;
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (Number(this.widget.alive_timeout) || 3) * 1000);
        }
    },
    beforeUnmount() {
        this.unarmGesture();
        this.stopLoop();
        this.stop();
        this.clearColors();
        this.clearCm();
        try { if (this.actx) this.actx.close(); } catch (e) { }
        this.actx = null;
        this.analyser = null;
        this.gainNode = null;
        if (this.saveTimer) clearTimeout(this.saveTimer);
        if (this.availTimer) clearInterval(this.availTimer);
    },
    methods: {
        clamp01(v) { const n = Number(v); if (!isFinite(n)) return 0; return n < 0 ? 0 : n > 1 ? 1 : n; },
        opt(v, list, dflt) { const s = String(v === undefined || v === null ? '' : v); return list.indexOf(s) >= 0 ? s : dflt; },
        fmtTime(sec) {
            const n = Math.max(0, Math.floor(Number(sec) || 0));
            const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = n % 60;
            const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
            return (h > 0 ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0');
        },
        decode(s) { try { return decodeURIComponent(String(s)); } catch (e) { return String(s); } },
        titleFromSrc(src) {
            const clean = String(src || '').split(/[?#]/)[0];
            const name = clean.substring(clean.lastIndexOf('/') + 1);
            const dot = name.lastIndexOf('.');
            return this.decode(dot > 0 ? name.substring(0, dot) : name);
        },
        /* A path from the server is written the way the folder field holds it, without a
           leading slash ("cms/sounds/Instead.mp3"). The panel itself lives under
           /templates/dashboard_pro/, so such a path would be looked up inside that folder
           and always miss. It is completed to a path from the root here, once, so every
           place that takes a track gets the same address. */
        srcUrl(src) {
            const s = String(src || '').trim();
            if (!s) return '';
            if (/^(https?:)?\/\//i.test(s) || s.charAt(0) === '/') return s;
            if (/^(data|blob):/i.test(s)) return s;
            return '/' + s.replace(/^\.\//, '');
        },
        normTracks(arr) {
            const out = [];
            (Array.isArray(arr) ? arr : []).forEach((it, i) => {
                let src = '', title = '';
                if (it && typeof it === 'object') { src = String(it.src || it.url || '').trim(); title = String(it.title || '').trim(); }
                else src = String(it || '').trim();
                if (!src) return;
                /* a list that was saved before the reading was fixed can carry the text of
                   an empty json list as a track: it is not a path and is dropped here, so
                   such a playlist heals itself without touching the stored value */
                if (src === '[]' || src === '{}' || src === 'null') return;
                out.push({ key: 'k' + (++this.keySeq) + '_' + i, src: src, title: title || this.titleFromSrc(src) });
            });
            return out;
        },
        seedTracks() {
            const raw = String(this.widget.playlist || '').trim();
            if (!raw) return [];
            /* the default value of the field is the empty list "[]": it is a valid list and
               stays empty. Falling back to the plain text reading on an empty result would
               turn that "[]" into a track named "[]" */
            try {
                const p = JSON.parse(raw);
                if (Array.isArray(p)) return this.normTracks(p);
            } catch (e) { /* not a json list, read it as plain text below */ }
            const arr = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(s => ({ src: s }));
            return this.normTracks(arr);
        },
        async initTracks() {
            const seed = this.seedTracks();
            if (seed.length) this.tracks = seed;
            const obj = String(this.widget.state_object || '').trim();
            const prop = String(this.widget.state_property || '').trim();
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (d && !d.error && String(d.value || '').trim()) {
                    const p = JSON.parse(String(d.value));
                    if (Array.isArray(p) && p.length) this.tracks = this.normTracks(p);
                }
            } catch (e) { }
            if (!this.tracks.length && seed.length) this.scheduleSave();
        },
        scheduleSave() {
            const obj = String(this.widget.state_object || '').trim();
            const prop = String(this.widget.state_property || '').trim();
            if (!obj || !prop) return;
            if (this.saveTimer) clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => { this.saveTimer = null; this.saveNow(obj, prop); }, 700);
        },
        async saveNow(obj, prop) {
            try {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: prop,
                    value: JSON.stringify(this.tracks.map(t => ({ src: t.src, title: t.title }))),
                }));
            } catch (e) { }
        },
        async togglePicker() {
            this.pickerOpen = !this.pickerOpen;
            if (this.pickerOpen && !this.files.length && !this.filesLoading) await this.loadFiles();
        },
        async loadFiles() {
            const dir = String(this.widget.folder || 'cms/sounds').trim();
            this.filesLoading = true;
            this.pickerError = '';
            try {
                const d = await dpAPI('media?' + new URLSearchParams({ dir: dir }));
                /* the listing comes in the usual capitalised form (NAME/PATH/SIZE), the
                   widget works with the lower case one - both are taken here, so the
                   names shown are the real ones and the path goes into the playlist */
                if (d && !d.error && Array.isArray(d.items)) {
                    this.files = d.items.map(x => ({
                        name: String(x.name || x.NAME || ''),
                        path: String(x.path || x.PATH || ''),
                        size: Number(x.size || x.SIZE || 0),
                    })).filter(x => x.path !== '');
                } else { this.files = []; this.pickerError = String((d && d.error) || t('mu_no_files')); }
            } catch (e) { this.files = []; this.pickerError = String(t('mu_no_files')); }
            this.filesLoading = false;
        },
        addPicked() {
            if (!this.picked.length) return;
            const names = {};
            this.files.forEach(f => { names[f.path] = f.name; });
            const add = this.picked.map(p => ({ src: p, title: this.titleFromSrc(names[p] || p) }));
            this.tracks = this.normTracks(this.tracks.concat(add));
            this.picked = [];
            this.scheduleSave();
        },
        addManual() {
            const raw = String(this.manualUrl || '').trim();
            if (!raw) return;
            this.tracks = this.normTracks(this.tracks.concat([{ src: raw }]));
            this.manualUrl = '';
            this.scheduleSave();
        },
        removeTrack(i) {
            if (i < 0 || i >= this.tracks.length) return;
            const wasCurrent = i === this.index;
            this.tracks = this.tracks.filter((t, k) => k !== i);
            this.scheduleSave();
            if (!this.tracks.length) { this.stop(); this.index = -1; return; }
            if (wasCurrent) { this.stop(); this.index = Math.min(i, this.tracks.length - 1); }
            else if (i < this.index) this.index--;
        },
        clearAll() {
            if (!this.tracks.length) return;
            this.stop();
            this.tracks = [];
            this.index = -1;
            this.scheduleSave();
        },
        ensureEl() {
            if (this.audioEl) return this.audioEl;
            const el = new Audio();
            el.preload = 'metadata';
            el.addEventListener('ended', () => this.onEnded());
            this.audioEl = el;
            return el;
        },
        ensureGraph() {
            if (this.graphDone) return true;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            try {
                const el = this.ensureEl();
                const ctx = new AC();
                const an = ctx.createAnalyser();
                an.fftSize = 4096;
                an.smoothingTimeConstant = 0.72;
                const gn = ctx.createGain();
                gn.gain.value = this.volume;
                ctx.createMediaElementSource(el).connect(an);
                an.connect(gn);
                gn.connect(ctx.destination);
                this.actx = ctx;
                this.analyser = an;
                this.gainNode = gn;
                this.freqData = new Uint8Array(an.frequencyBinCount);
                this.graphDone = true;
                return true;
            } catch (e) {
                this.graphDone = false;
                this.actx = null;
                this.analyser = null;
                this.gainNode = null;
                return false;
            }
        },
        resumeCtx() {
            if (this.actx && this.actx.state === 'suspended' && this.actx.resume) { try { const p = this.actx.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
        },
        armGesture() {
            if (this.gestureArmed) return;
            this.gestureArmed = true;
            const retry = () => {
                this.unarmGesture();
                if (this.index >= 0 && !this.playing) {
                    this.resumeCtx();
                    const el = this.audioEl;
                    if (el) { const p = el.play(); if (p && p.then) p.then(() => this.onPlaying()).catch(() => { }); else this.onPlaying(); }
                }
            };
            window.addEventListener('pointerdown', retry, true);
            window.addEventListener('keydown', retry, true);
            this._retry = retry;
        },
        unarmGesture() {
            if (!this.gestureArmed) return;
            this.gestureArmed = false;
            window.removeEventListener('pointerdown', this._retry, true);
            window.removeEventListener('keydown', this._retry, true);
            this._retry = null;
        },
        playIndex(i) {
            if (i < 0 || i >= this.tracks.length) return;
            const el = this.ensureEl();
            const hasGraph = this.ensureGraph();
            this.resumeCtx();
            this.index = i;
            const src = this.srcUrl(this.tracks[i].src);
            if (!/^https?:\/\//i.test(src)) el.crossOrigin = 'anonymous';
            if (el.getAttribute('src') !== src) { el.setAttribute('src', src); this.position = 0; this.duration = 0; }
            el.volume = hasGraph ? 1 : this.volume;
            const p = el.play();
            if (p && p.then) p.then(() => this.onPlaying()).catch(() => { this.playing = false; this.armGesture(); });
            else this.onPlaying();
        },
        onPlaying() {
            this.unarmGesture();
            this.playing = true;
            this.cmQueuedNext = false;
            this.startLoop();
        },
        pause() {
            const el = this.audioEl;
            if (el) { try { el.pause(); } catch (e) { } }
            this.playing = false;
            this.stopLoop();
        },
        toggle() {
            if (!this.tracks.length) return;
            if (this.playing) { this.pause(); return; }
            if (this.index < 0) { this.playIndex(0); return; }
            this.ensureGraph();
            this.resumeCtx();
            const el = this.audioEl;
            if (!el) return;
            const p = el.play();
            if (p && p.then) p.then(() => this.onPlaying()).catch(() => { this.playing = false; this.armGesture(); });
            else this.onPlaying();
        },
        stop() {
            const el = this.audioEl;
            if (el) { try { el.pause(); } catch (e) { } try { el.currentTime = 0; } catch (e) { } }
            this.playing = false;
            this.position = 0;
            this.duration = 0;
            this.stopLoop();
            this.spectrum = new Array(24).fill(0);
        },
        stopLoop() { if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; } },
        prevTrack() {
            if (!this.tracks.length) return;
            if (this.position > 3 && this.index > 0) { this.playIndex(this.index); return; }
            this.playIndex(this.shuffleOn ? this.randOther(this.index) : Math.max(0, this.index - 1));
        },
        nextTrack() {
            if (!this.tracks.length) return;
            if (this.shuffleOn) { this.playIndex(this.randOther(this.index)); return; }
            const n = this.index + 1;
            if (n < this.tracks.length) { this.playIndex(n); return; }
            if (this.repeatMode === 'all') { this.playIndex(0); return; }
            this.stop();
        },
        randOther(cur) {
            const n = this.tracks.length;
            if (n < 2) return 0;
            let k = cur;
            for (let attempt = 0; attempt < 12 && k === cur; attempt++) k = Math.floor(Math.random() * n);
            if (k === cur) k = (cur + 1) % n;
            return k;
        },
        cycleRepeat() {
            const base = this.opt(this.widget.repeat, ['off', 'one', 'all'], 'off');
            const order = base === 'one' ? ['one', 'off', 'all'] : ['off', 'one', 'all'];
            const at = order.indexOf(this.repeatMode);
            this.repeatMode = order[(at + 1) % order.length];
        },
        onVolume(e) { this.setVolume(e && e.target ? e.target.value : e); },
        setVolume(v) {
            const val = this.clamp01(v);
            this.volume = val;
            if (this.gainNode) { try { this.gainNode.gain.value = val; } catch (e) { } }
            else if (this.audioEl) { try { this.audioEl.volume = val; } catch (e) { } }
        },
        onSeek(e) {
            const el = this.audioEl;
            if (!el || !this.duration) return;
            const r = e.currentTarget.getBoundingClientRect();
            if (!r || !r.width) return;
            const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            try { el.currentTime = ratio * this.duration; } catch (err) { }
            this.position = ratio * this.duration;
        },
        onEnded() {
            this.playing = false;
            if (this.cmOn && this.repeatMode !== 'one' && !this.cmQueuedNext) {
                this.cmQueuedNext = true;
                this.cmEndLight();
            }
            if (this.repeatMode === 'one') { this.playIndex(this.index); return; }
            this.nextTrack();
        },
        startLoop() {
            if (this.rafId) return;
            const el = this.audioEl;
            if (!el) return;
            const step = () => {
                this.rafId = 0;
                if (!this.playing) return;
                this.position = el.currentTime || 0;
                this.duration = el.duration && isFinite(el.duration) ? el.duration : 0;
                this.sample();
                this.rafId = requestAnimationFrame(step);
            };
            this.rafId = requestAnimationFrame(step);
        },
        sample() {
            const an = this.analyser;
            if (!an || !this.freqData) { this.spectrum = new Array(24).fill(0); return; }
            an.getByteFrequencyData(this.freqData);
            const bands = this.bandList;
            const levels = bands.map(b => this.bandLevel(b, this.freqData));
            this.spectrum = this.shape(levels);
            this.pushColors(bands, levels);
            this.cmTick();
            this.cmFlush();
        },
        bandLevel(b, data) {
            const an = this.analyser;
            const src = data || this.freqData;
            if (!an || !src || !this.actx) return 0;
            const bins = an.frequencyBinCount;
            const nyq = this.actx.sampleRate / 2;
            let lo = Math.floor(b.lo / nyq * bins);
            let hi = Math.ceil(b.hi / nyq * bins);
            if (lo < 0) lo = 0;
            if (hi > bins - 1) hi = bins - 1;
            if (hi < lo) return 0;
            let peak = 0;
            for (let i = lo; i <= hi; i++) if (src[i] > peak) peak = src[i];
            return peak;
        },
        shape(levels) {
            const bars = this.spectrum.length;
            const out = new Array(bars).fill(0);
            const bands = levels.length;
            if (!bands) return out;
            for (let i = 0; i < bars; i++) {
                const at = Math.min(bands - 1, Math.floor(i / bars * bands));
                out[i] = Math.min(100, Math.round(levels[at] / 255 * 100));
            }
            return out;
        },
        spectrumColor(i) {
            const bands = this.bandList;
            if (!bands.length) return '#888888';
            const at = Math.min(bands.length - 1, Math.floor(i / this.spectrum.length * bands.length));
            return bands[at].color;
        },
        pushColors(bands, levels) {
            if (!this.colorOn) return;
            const gap = Math.max(100, Number(this.widget.color_interval) || 500);
            const now = Date.now();
            if (now - this.lastColorAt < gap) return;
            this.lastColorAt = now;
            const thr = Math.max(0, Number(this.widget.color_threshold) || 90);
            if (String(this.widget.color_mode) === 'bands') {
                bands.forEach((b, i) => {
                    if (!b.object || !b.property) return;
                    this.sendColor(b.object, b.property, levels[i] >= thr ? b.color : '');
                });
                return;
            }
            const obj = String(this.widget.color_object || '').trim();
            const prop = String(this.widget.color_property || '').trim();
            if (!obj || !prop) return;
            let best = -1, bestVal = thr;
            levels.forEach((v, i) => { if (v > bestVal) { bestVal = v; best = i; } });
            this.sendColor(obj, prop, best >= 0 ? bands[best].color : '');
        },
        clearColors() {
            const keys = Object.keys(this.sentColors);
            this.sentColors = {};
            keys.forEach(k => {
                const dot = k.lastIndexOf('.');
                if (dot < 1) return;
                if (!this.cmPending) this.cmPending = [];
                this.cmPending.push({ object: k.slice(0, dot), property: k.slice(dot + 1), value: '' });
            });
            this.cmFlush();
        },
        sendColor(object, property, value) {
            const key = object + '.' + property;
            if (this.sentColors[key] === value) return;
            this.sentColors[key] = value;
            if (!this.cmPending) this.cmPending = [];
            this.cmPending.push({ object: object, property: property, value: String(value) });
        },


        /* ---- colour music -------------------------------------------------
           The controller is never addressed from the browser: it sits on its own
           address and sends no CORS headers, so a request from the panel would be
           dropped. The megad module already listens for a linked property change
           (propertySetHandle -> setProperty -> "P10:128") and does the talking, so
           the light is driven the same way the existing colour pushing is. */

        cmEndAction() { return this.opt(this.widget.end_action, ['off', 'on', 'keep'], 'off'); },
        /* one Object.Property per light, in the order they are listed in settings.
           Plain lamps take as many of them as the channel count says, rgb and
           addressable strips take either one colour field or the r/g/b trio. */
        cmTargets() {
            const out = [];
            const add = (object, property) => {
                const o = String(object || '').trim(), p = String(property || '').trim();
                if (o && p) out.push({ object: o, property: p });
            };
            if (this.cmDevice === 'ports') {
                for (let i = 1; i <= this.cmChannelCount; i++) add(this.widget['object_p' + i], this.widget['property_p' + i]);
                return out;
            }
            if (this.cmWrite === 'hex') { add(this.widget.object_hex, this.widget.property_hex); return out; }
            ['r', 'g', 'b'].forEach(c => add(this.widget['object_' + c], this.widget['property_' + c]));
            return out;
        },
        /* the spectrum is cut into as many log spaced slices as there are lights, so
           three channels are low/mid/high and seven follow the octave of the track */
        cmBands(n) {
            const lo = 20, hi = 20000, k = Math.log(hi / lo);
            const out = [];
            for (let i = 0; i < n; i++) {
                out.push({ lo: lo * Math.exp(k * i / n), hi: lo * Math.exp(k * (i + 1) / n) });
            }
            return out;
        },
        cmLevels(count) {
            const bands = this.cmBands(count);
            return bands.map(b => this.bandLevel(b, this.freqData));
        },
        /* a slow follower gives the loudness and a fast one the moment they diverge:
           that jump is the beat the wave steps on */
        cmBeat(levels) {
            const mean = levels.reduce((a, v) => a + v, 0) / (levels.length || 1);
            this.cmFast = this.cmFast == null ? mean : this.cmFast * 0.5 + mean * 0.5;
            this.cmSlow = this.cmSlow == null ? mean : this.cmSlow * 0.94 + mean * 0.06;
            const now = Date.now();
            if (this.cmFast - this.cmSlow < 6 || now - this.cmBeatAt < 130) return false;
            this.cmBeatAt = now;
            return true;
        },
        /* the slice whose level peaks decides the hue, so bass walks the bottom of
           the wheel and treble the top */
        cmHue(levels) {
            let best = 0, peak = -1;
            levels.forEach((v, i) => { if (v > peak) { peak = v; best = i; } });
            return (best / (levels.length || 1)) * 320;
        },
        /* h in degrees, s and l in percent */
        cmHslToRgb(h, s, l) {
            h = (((h % 360) + 360) % 360) / 360;
            const sn = Math.max(0, Math.min(100, Number(s) || 0)) / 100;
            const ln = Math.max(0, Math.min(100, Number(l) || 0)) / 100;
            if (sn === 0) { const g = Math.round(ln * 255); return [g, g, g]; }
            const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
            const p = 2 * ln - q;
            const conv = (t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            return [conv(h + 1 / 3), conv(h), conv(h - 1 / 3)].map(v => Math.round(v * 255));
        },
        /* queue one channel; the whole frame is sent in a single request at the
           end of the tick, and over the websocket when the live channel is up,
           so colour music does not spawn an Apache/php request per channel */
        cmSend(object, property, value) {
            const key = object + '.' + property;
            const v = String(value);
            if (this.sentCm[key] === v) return;
            this.sentCm[key] = v;
            if (!this.cmPending) this.cmPending = [];
            this.cmPending.push({ object: object, property: property, value: v });
        },
        cmFlush() {
            const pairs = this.cmPending;
            if (!pairs || !pairs.length) return;
            this.cmPending = [];
            if (typeof dpSendProperties === 'function') {
                try { dpSendProperties(pairs); return; } catch (e) { }
            }
            pairs.forEach(p => {
                try { dpAPI('setProperty?' + new URLSearchParams({ object: p.object, property: p.property, value: p.value })); } catch (e) { }
            });
        },
        /* what one channel is written as. A dimmer takes the level as it is, a plain
           lamp only knows on and off, so the level is cut at the threshold and becomes
           1 or 0. Without that cut the megad module would put 108 into the port and a
           simple lamp would sit half lit instead of blinking */
        cmValue(v) {
            const level = Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
            if (this.cmDevice === 'ports' && this.cmPortOut === 'onoff') return level >= this.cmOnLevel ? '1' : '0';
            return String(level);
        },
        /* one colour goes out either as three channel values or as a single #rrggbb */
        cmApply(rgb, per) {
            const t = this.cmTargets();
            if (!t.length) return;
            if (this.cmDevice !== 'ports' && this.cmWrite === 'hex') {
                const hex = rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
                this.cmSend(t[0].object, t[0].property, hex);
                return;
            }
            const vals = per && per.length ? per : rgb;
            t.forEach((c, i) => this.cmSend(c.object, c.property, this.cmValue(vals[i] || 0)));
        },
        cmStepEffect(levels) {
            const targets = this.cmTargets();
            if (!targets.length) return;
            const n = targets.length;
            const beat = this.cmBeat(levels);

            if (this.cmDevice === 'ports') {
                if (this.cmPortMode !== 'wave') { this.cmApply(levels.slice(0, n)); return; }
                if (beat) this.cmPos = (this.cmPos + 1) % n;
                const head = levels.slice(0, n).map(v => v * 0.12);
                head[this.cmPos] = Math.max(...levels.slice(0, n)) * 1.2;
                this.cmApply(head);
                return;
            }

            const mode = this.cmDevice === 'rgb' ? 'cm' : this.cmIcMode;
            const hue = this.cmHue(levels);
            const loud = Math.min(100, Math.max(...levels) * 0.4 + 25);

            if (mode === 'cm') { this.cmApply(this.cmHslToRgb(hue, 100, loud)); return; }
            if (mode === 'shuffle') {
                if (beat || !this.cmShuffled) {
                    this.cmShuffled = true;
                    this.cmRoll = [0, 1, 2].map(() => Math.random());
                }
                const c = this.cmHslToRgb(Math.random() * 360, 100, loud);
                this.cmApply([c[0] * this.cmRoll[0], c[1] * this.cmRoll[1], c[2] * this.cmRoll[2]]);
                return;
            }
            if (beat) this.cmPos = (this.cmPos + 1) % n;
            /* the wave carries the rhythm; for the tinted wave the hue rides on the
               band the wave is standing on, otherwise the hue only drifts */
            const tint = mode === 'cm_wave' ? (hue + this.cmPos * 60) % 360 : (this.cmHueD = (this.cmHueD + 6) % 360);
            const c = this.cmHslToRgb(tint, 100, loud);
            if (n === 3) {
                const tail = [0.18, 0.18, 0.18];
                tail[this.cmPos] = 1;
                this.cmApply([c[0] * tail[0], c[1] * tail[1], c[2] * tail[2]]);
                return;
            }
            this.cmApply([c[0], c[1], c[2]]);
        },
        cmTick() {
            if (!this.cmOn) return;
            const now = Date.now();
            if (now - this.lastCmAt < 90) return;
            this.lastCmAt = now;
            /* plain lamps want one slice each; a colour lamp wants low/mid/high, even
               when all of it is written through a single colour property */
            const n = this.cmDevice === 'ports' ? (this.cmTargets().length || 3) : 3;
            this.cmStepEffect(this.cmLevels(n));
            this.cmFlush();
        },
        toggleCm() {
            this.cmOn = !this.cmOn;
            if (this.cmOn) { this.cmFast = null; this.cmSlow = null; this.cmPos = 0; }
            else this.cmEndLight('off');
        },
        /* what the strip does once the track is over - settings pick off, on or keep */
        cmEndLight(action) {
            const t = this.cmTargets();
            if (!t.length) return;
            const what = action || this.cmEndAction;
            if (what === 'keep') return;
            if (what === 'on') {
                if (this.cmDevice === 'ports' && this.cmPortOut === 'onoff') { t.forEach(c => this.cmSend(c.object, c.property, '1')); }
                else if (this.cmDevice !== 'ports' && this.cmWrite === 'hex') { this.cmSend(t[0].object, t[0].property, 'ffffff'); }
                else { t.forEach((c, i) => this.cmSend(c.object, c.property, String([255, 60, 20][i] || 255))); }
            } else {
                t.forEach(c => this.cmSend(c.object, c.property, '0'));
            }
            this.cmFlush();
        },
        clearCm() {
            const keys = Object.keys(this.sentCm);
            this.sentCm = {};
            keys.forEach(k => {
                const dot = k.lastIndexOf('.');
                if (dot < 1) return;
                this.cmSend(k.slice(0, dot), k.slice(dot + 1), '0');
            });
            this.cmFlush();
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { }
        },
    },
};

MusicplayerWidget.DEFAULT_BANDS = [
    { lo: 20, hi: 150, color: '#ff2200', object: '', property: '' },
    { lo: 150, hi: 400, color: '#ff8800', object: '', property: '' },
    { lo: 400, hi: 1000, color: '#ffee00', object: '', property: '' },
    { lo: 1000, hi: 2500, color: '#44ff66', object: '', property: '' },
    { lo: 2500, hi: 6000, color: '#44ccff', object: '', property: '' },
    { lo: 6000, hi: 14000, color: '#aa66ff', object: '', property: '' },
];

window.DpWidgets = window.DpWidgets || {};

(function injectMusicplayerWidgetStyle() {
    if (typeof document === 'undefined') return;
    try {
        if (document.getElementById('musicplayer-widget-style')) return;
        const st = document.createElement('style');
        st.id = 'musicplayer-widget-style';
        st.textContent = [
            '.dp-music .widget-v-card__title { flex:1; }',
            '.dp-music .widget-v-card__body { padding:0 10px 10px; min-height:0; overflow-y:auto; }',
            '.dp-music__ibtn { width:24px; height:24px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; border:none; border-radius:50%; background:rgba(128,128,128,.18); color:var(--on-theme-mid) !important; cursor:pointer; font-size:.7rem; padding:0; transition:background .15s; }',
            '.dp-music__ibtn:hover { background:rgba(128,128,128,.32); }',
            '.dp-music__ibtn--on { background:var(--primary); color:#fff !important; }',
            '.dp-music__ibtn:disabled { opacity:.4; cursor:not-allowed; }',
            '.dp-music__name { font-size:.92rem; color:var(--on-theme-high); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
            '.dp-music__times { display:flex; justify-content:space-between; font-size:.7rem; color:var(--on-theme-mid); font-variant-numeric:tabular-nums; margin-top:2px; }',
            '.dp-music__seek { height:4px; border-radius:2px; background:rgba(128,128,128,.3); margin-top:5px; cursor:pointer; overflow:hidden; }',
            '.dp-music__seek-fill { height:100%; background:var(--primary); border-radius:2px; }',
            '.dp-music__empty { flex:1; display:flex; align-items:center; justify-content:center; font-size:.8rem; color:var(--on-theme-dim); text-align:center; padding:10px 0; }',
            '.dp-music__transport { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:8px; }',
            '.dp-music__tbtn { width:32px; height:32px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; border:none; border-radius:50%; background:rgba(128,128,128,.18); color:var(--on-theme-mid) !important; cursor:pointer; font-size:.78rem; padding:0; }',
            '.dp-music__tbtn:hover { background:rgba(128,128,128,.32); }',
            '.dp-music__tbtn--main { width:42px; height:42px; font-size:1rem; background:var(--primary); color:#fff !important; }',
            '.dp-music__tbtn--main:hover { filter:brightness(1.12); }',
            '.dp-music__tbtn--on { color:var(--primary) !important; box-shadow:inset 0 0 0 1px var(--primary); }',
            '.dp-music__vol { display:flex; align-items:center; gap:6px; margin-top:8px; font-size:.65rem; color:var(--on-theme-mid); }',
            '.dp-music__vol input[type=range] { flex:1; min-width:0; -webkit-appearance:none; appearance:none; height:4px; border-radius:2px; background:rgba(128,128,128,.3); outline:none; cursor:pointer; }',
            '.dp-music__vol input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:var(--primary); cursor:pointer; border:none; }',
            '.dp-music__vol input[type=range]::-moz-range-thumb { width:13px; height:13px; border-radius:50%; background:var(--primary); cursor:pointer; border:none; }',
            '.dp-music__spectrum { display:flex; align-items:flex-end; gap:2px; height:44px; margin-top:8px; padding:0 1px; }',
            '.dp-music__cell { flex:1; height:100%; display:flex; align-items:flex-end; }',
            '.dp-music__cell i { display:block; width:100%; min-height:2px; border-radius:1px; opacity:.85; transition:height .06s linear; }',
            '.dp-music__picker { margin-top:8px; padding:8px; border-radius:var(--wpb-radius-default, 0px); background:rgba(128,128,128,.12); border:1px solid rgba(128,128,128,.25); }',
            '.dp-music__picker-head { font-size:.72rem; color:var(--on-theme-mid); margin-bottom:5px; }',
            '.dp-music__files { font-size:.72rem; color:var(--on-theme-dim); padding:4px 0; }',
            '.dp-music__file { display:flex; align-items:center; gap:6px; font-size:.76rem; color:var(--on-theme-high); padding:2px 0; cursor:pointer; }',
            '.dp-music__file span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
            '.dp-music__picker-row { display:flex; align-items:center; gap:6px; margin-top:6px; }',
            '.dp-music__url { flex:1; min-width:0; height:26px; padding:0 8px; border-radius:var(--wpb-radius-default, 0px); border:1px solid rgba(128,128,128,.35); background:rgba(128,128,128,.12); font-size:.74rem; font-family:inherit; }',
            '.dp-music__picker-hint { font-size:.65rem; color:var(--on-theme-dim); margin-top:3px; }',
            '.dp-music__wide { flex:1; height:26px; border:none; border-radius:var(--wpb-radius-default, 0px); background:var(--primary); color:#fff !important; font-size:.74rem; font-family:inherit; cursor:pointer; }',
            '.dp-music__wide:disabled { opacity:.4; cursor:not-allowed; }',
            '.dp-music__err { font-size:.7rem; color:#ef9a9a; }',
            '.dp-music__list { margin-top:8px; overflow-y:auto; min-height:0; }',
            '.dp-music__row { display:flex; align-items:center; gap:6px; padding:4px 6px; border-radius:var(--wpb-radius-default, 0px); font-size:.78rem; color:var(--on-theme-high); cursor:pointer; }',
            '.dp-music__row:hover { background:rgba(128,128,128,.14); }',
            '.dp-music__row--on { color:var(--primary); }',
            '.dp-music__row-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
            '.dp-music__x { width:20px; height:20px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; border:none; border-radius:50%; background:transparent; color:var(--on-theme-dim) !important; cursor:pointer; font-size:.62rem; padding:0; }',
            '.dp-music__x:hover { background:rgba(128,128,128,.25); color:#ef9a9a !important; }',
        ].join('\n');
        (document.head || document.documentElement).appendChild(st);
    } catch (e) { }
injectMusicplayerWidgetStyle();
})();
window.DpWidgets.musicplayer = MusicplayerWidget;
