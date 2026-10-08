/* set to false to silence the colour-music debug log. Lines only go to the
   browser console; nothing is sent to the server. */
const CM_DEBUG = true;
function cmLog() {
    if (!CM_DEBUG) return;
    const line = Array.prototype.slice.call(arguments)
        .map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    console.log('%c[CM]', 'color:#9a6a4a;font-weight:bold', line);
}
/* is there at least one Object.Property configured to write into */
function targetsOk(list) {
    return Array.isArray(list) && list.some(t => t && t.object && t.property);
}

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
            { key: 'cm_use_vol', label: 'cm_vol_active', type: 'switch', default: false, row: 'vol_row' },
            { key: 'volume', label: 'mu_field_volume', type: 'slider', min: 0, max: 100, step: 1, default: 50, row: 'vol_row' },
            { key: 'show_playlist', label: 'mu_field_show_playlist', type: 'checkbox', default: true },
            { key: 'show_spectrum', label: 'mu_field_show_spectrum', type: 'checkbox', default: true },
        ],
        light: [
            { key: 'dev_type', label: 'cm_dev_type', type: 'select', default: 'ports', options: [{ value: 'ports', label: 'cm_dev_ports' }, { value: 'rgb', label: 'cm_dev_rgb' }, { value: 'ic', label: 'cm_dev_ic' }, { value: 'megad', label: 'cm_dev_megad' }] },
            { key: 'port_ch', label: 'cm_ch_count', type: 'select', default: '3', showIf: { dev_type: 'ports' }, options: [{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' }, { value: '7', label: '7' }, { value: '8', label: '8' }] },
            { key: 'object_p1', label: 'cm_ch1', type: 'object', row: 'cm_p1', showIf: { dev_type: 'ports' } },
            { key: 'property_p1', label: 'cm_prop', type: 'property', row: 'cm_p1', showIf: { dev_type: 'ports' } },
            { key: 'object_p2', label: 'cm_ch2', type: 'object', row: 'cm_p2', showIf: { dev_type: 'ports' } },
            { key: 'property_p2', label: 'cm_prop', type: 'property', row: 'cm_p2', showIf: { dev_type: 'ports' } },
            { key: 'object_p3', label: 'cm_ch3', type: 'object', row: 'cm_p3', showIf: { dev_type: 'ports' } },
            { key: 'property_p3', label: 'cm_prop', type: 'property', row: 'cm_p3', showIf: { dev_type: 'ports' } },
            { key: 'object_p4', label: 'cm_ch4', type: 'object', row: 'cm_p4', showIf: { dev_type: 'ports', port_ch: ['4', '5', '6', '7', '8'] } },
            { key: 'property_p4', label: 'cm_prop', type: 'property', row: 'cm_p4', showIf: { dev_type: 'ports', port_ch: ['4', '5', '6', '7', '8'] } },
            { key: 'object_p5', label: 'cm_ch5', type: 'object', row: 'cm_p5', showIf: { dev_type: 'ports', port_ch: ['5', '6', '7', '8'] } },
            { key: 'property_p5', label: 'cm_prop', type: 'property', row: 'cm_p5', showIf: { dev_type: 'ports', port_ch: ['5', '6', '7', '8'] } },
            { key: 'object_p6', label: 'cm_ch6', type: 'object', row: 'cm_p6', showIf: { dev_type: 'ports', port_ch: ['6', '7', '8'] } },
            { key: 'property_p6', label: 'cm_prop', type: 'property', row: 'cm_p6', showIf: { dev_type: 'ports', port_ch: ['6', '7', '8'] } },
            { key: 'object_p7', label: 'cm_ch7', type: 'object', row: 'cm_p7', showIf: { dev_type: 'ports', port_ch: ['7', '8'] } },
            { key: 'property_p7', label: 'cm_prop', type: 'property', row: 'cm_p7', showIf: { dev_type: 'ports', port_ch: ['7', '8'] } },
            { key: 'object_p8', label: 'cm_ch8', type: 'object', row: 'cm_p8', showIf: { dev_type: 'ports', port_ch: '8' } },
            { key: 'property_p8', label: 'cm_prop', type: 'property', row: 'cm_p8', showIf: { dev_type: 'ports', port_ch: '8' } },
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
            { key: 'ic_mode', label: 'cm_effects', type: 'select', default: 'cm', showIf: { dev_type: ['ic', 'megad'] }, options: [{ value: 'cm', label: 'cm_ic_cm' }, { value: 'wave', label: 'cm_ic_wave' }, { value: 'cm_wave', label: 'cm_ic_wave_fade' }, { value: 'shuffle', label: 'cm_ic_shuffle' }] },
            { key: 'object_md', label: 'cm_object', type: 'object', row: 'cm_md', showIf: { dev_type: 'megad' } },
            { key: 'property_md', label: 'cm_prop', type: 'property', row: 'cm_md', showIf: { dev_type: 'megad' } },
            { key: 'cm_pixels', label: 'cm_pixels', type: 'number', step: 1, default: 100, showIf: { dev_type: 'megad' } },
            { key: 'end_action', label: 'cm_on_end', type: 'select', default: 'off', showIf: { dev_type: ['rgb', 'megad'] }, options: [{ value: 'off', label: 'cm_end_off' }, { value: 'on', label: 'cm_end_on' }, { value: 'keep', label: 'cm_end_keep' }] },
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
        folder: 'cms/sounds', state_object: 'DashboardProMusicplayer', state_property: 'Playlist', playlist: '[{"src":"https://hls-01-retro.emgsound.ru/12/128/playlist.m3u8","title":"Ретро FM"},{"src":"http://ep128.hostingradio.ru:8030/ep128","title":"Европа Плюс"},{"src":"https://dfm.hostingradio.ru/dfm128.mp3","title":"Радио DFM"},{"src":"http://dorognoe.hostingradio.ru:8000/dorognoe","title":"Дорожное Радио"}]',
        autoplay: false, shuffle: false, repeat: 'off', volume: 50, show_playlist: true, show_spectrum: true,
        color_mode: 'dominant', color_object: '', color_property: '', bands: '',
        color_threshold: 90, color_interval: 500,
        dev_type: 'ports', port_ch: '3', port_mode: 'freq', port_out: 'onoff', cm_on_level: 90, wr_mode: 'hex', ic_mode: 'cm', object_md: '', property_md: '', cm_pixels: 100, end_action: 'off', cm_use_vol: false,
        width: 320, height: 425,
    },
    template: `
        <div class="widget-v-card dp-music" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_musicplayer') }}</div>
                <button v-if="cmOn && cmModes.length > 1" class="dp-music__ibtn" @click.stop="cmCycle" :title="cmTitle"><i :class="cmModeIcon"></i></button>
                <button class="dp-music__ibtn" :class="{ 'dp-music__ibtn--on': cmOn }" @click.stop="toggleCm" :title="cmToggleTitle"><i class="fas fa-lightbulb"></i></button>
                <button class="dp-music__ibtn" :class="{ 'dp-music__ibtn--on': eqOpen }" @click.stop="toggleEq" :title="t('mu_eq')"><i class="fas fa-sliders"></i></button>
                <button class="dp-music__ibtn" :class="{ 'dp-music__ibtn--on': pickerOpen }" @click.stop="togglePicker" :title="pickerOpen ? t('mu_playlist') : t('mu_add_file')"><i :class="pickerOpen ? 'fas fa-list' : 'fas fa-plus'"></i></button>
                <button class="dp-music__ibtn" @click.stop="clearAll" :title="t('mu_clear')"><i class="fas fa-trash"></i></button>
            </div>
            <div class="widget-v-card__body dp-music__body" :class="{ 'dp-music__body--panel': pickerOpen || eqOpen }">
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
                    <button class="dp-music__tbtn dp-music__tbtn--main" @click.stop="playing && streamNow ? stop() : toggle()" :title="playing ? (streamNow ? t('mu_stop') : t('mu_pause')) : t('mu_play')"><i :class="playing ? (streamNow ? 'fas fa-stop' : 'fas fa-pause') : 'fas fa-play'"></i></button>
                    <button class="dp-music__tbtn" @click.stop="nextTrack" :title="t('mu_next')"><i class="fas fa-step-forward"></i></button>
                    <button class="dp-music__tbtn" :class="{ 'dp-music__tbtn--on': repeatMode !== 'off' }" @click.stop="cycleRepeat" :title="t('mu_repeat')"><i class="fas" :class="repeatMode === 'one' ? 'fas fa-redo-alt' : 'fas fa-redo'"></i></button>
                </div>
                <div class="dp-music__vol">
                    <i class="fas fa-volume-down"></i>
                    <input type="range" min="0" max="1" step="0.05" :value="volume" @input.stop="onVolume($event)">
                    <i class="fas fa-volume-up"></i>
                </div>
                <template v-if="showSpectrum">
                    <div class="dp-music__spectrum" v-if="!cmOn">
                        <span class="dp-music__cell" v-for="(v, si) in spectrum" :key="si"><i :style="{ height: v + '%', background: spectrumColor(si) }"></i></span>
                    </div>
                    <div class="dp-music__spectrum dp-music__cm dp-music__cm--lamps" v-else-if="cmDevice === 'ports'">
                        <span class="dp-music__lamp" v-for="(l, i) in cmLamps" :key="i" :class="{ 'dp-music__lamp--on': l.lvl > 0 }" :style="{ opacity: 0.18 + l.lvl * 0.82 }"></span>
                    </div>
                    <div class="dp-music__spectrum dp-music__cm" v-else-if="cmDevice === 'rgb'">
                        <span class="dp-music__cell" v-for="(v, si) in spectrum" :key="si"><i :style="{ height: '100%', background: cmWash || '#888888', opacity: cmWashO }"></i></span>
                    </div>
                    <div class="dp-music__spectrum dp-music__cm dp-music__cm--strip" v-else>
                        <span class="dp-music__led" v-for="(ld, i) in cmStrip" :key="i" :style="{ background: ld.c, opacity: ld.o }"></span>
                    </div>
                </template>
                <div class="dp-music__picker" v-if="pickerOpen">
                    <div class="dp-music__picker-head">{{ t('mu_files') }}</div>
                    <div class="dp-music__files" v-if="filesLoading"><i class="fas fa-circle-notch fa-spin"></i></div>
                    <div class="dp-music__files" v-else-if="!files.length">{{ t('mu_no_files') }}</div>
                    <div class="dp-music__files-list" v-else>
                        <label class="dp-music__file" v-for="f in files" :key="f.path">
                            <input type="checkbox" :value="f.path" v-model="picked">
                            <span :title="f.path">{{ f.name }}</span>
                        </label>
                    </div>
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
                <div class="dp-music__eq" v-if="eqOpen">
                    <div class="dp-music__picker-head">{{ t('mu_eq') }}</div>
                    <div class="dp-music__eq-bands">
                        <div class="dp-music__eq-band" v-for="(b, bi) in eqBands" :key="bi">
                            <span class="dp-music__eq-lbl">{{ b.label }}</span>
                            <input type="range" min="-12" max="12" step="1" :value="eqGains[bi] || 0" @input.stop="setEqBand(bi, $event.target.value)">
                            <span class="dp-music__eq-val">{{ eqGains[bi] || 0 }}</span>
                        </div>
                    </div>
                    <div class="dp-music__eq-presets">
                        <button class="dp-music__eq-p" :class="{ 'dp-music__ibtn--on': eqSel === pr.key }" v-for="pr in eqPresets" :key="pr.key" @click.stop="applyEqPreset(pr.key)">{{ t(pr.label) }}</button>
                        <button class="dp-music__eq-p" :class="{ 'dp-music__ibtn--on': eqSel === 'custom' }" @click.stop="saveCustomEq">{{ t('mu_eq_custom') }}</button>
                    </div>
                </div>
                <div class="dp-music__list" v-if="showPlaylist && tracks.length && !pickerOpen && !eqOpen">
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
            tracks: [], index: -1, playing: false, position: 0, duration: 0, liveStream: false, volume: 0.5, shuffleOn: false, repeatMode: 'off',
            pickerOpen: false, files: [], filesLoading: false, pickerError: '', picked: [], manualUrl: '',
            spectrum: new Array(24).fill(0), audioEl: null, actx: null, analyser: null, gainNode: null, graphDone: false,
            freqData: null, rafId: 0, lastColorAt: 0, sentColors: {}, saveTimer: null, keySeq: 0,
            isAlive: true, availTimer: null, gestureArmed: false,
            cmOn: false, cmEngineOn: false, cmTimer: 0, lastCmAt: 0, sentCm: {}, cmPending: [],
            cmPos: 0, cmHueD: 0, cmFast: null, cmSlow: null, cmBeatAt: 0,
            cmShuffled: false, cmRoll: [1, 1, 1], cmQueuedNext: false,
            cmLamps: [], cmStrip: Array.from({ length: 16 }, () => ({ c: 'rgb(80,80,80)', o: 0.15 })), cmWash: '', cmWashO: 0,
            eqOpen: false, eqGains: MusicplayerWidget.EQ_BANDS.map(() => 0), eqFilters: [], customEq: null, eqSel: null,
        };
    },
    computed: {
        showSpectrum() { return this.widget.show_spectrum !== false; },
        eqBands() { return MusicplayerWidget.EQ_BANDS || []; },
        eqPresets() { return MusicplayerWidget.EQ_PRESETS || []; },
        showPlaylist() { return this.widget.show_playlist !== false; },
        current() { return this.index >= 0 && this.index < this.tracks.length ? this.tracks[this.index] : null; },
        currentTitle() { return this.current ? (this.current.title || this.current.src) : ''; },
        posText() { return this.fmtTime(this.position); },
        durText() { return this.fmtTime(this.duration); },
        progressPct() { return this.duration > 0 ? Math.min(100, Math.max(0, this.position / this.duration * 100)) : 0; },
        /* A live broadcast (radio) never ends, so pausing it is meaningless and the main
           button stops instead. A file keeps the usual pause. The element is the source of
           truth - a live source reports an infinite duration - and the shape of the address
           is only a fallback for the moment before the duration is known. */
        streamNow() { return this.liveStream || this.isStreamSrc(this.current ? this.current.src : ''); },
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
        cmDevice() { return this.opt(this.widget.dev_type, ['ports', 'rgb', 'ic', 'megad'], 'ports'); },
        cmWrite() { return this.opt(this.widget.wr_mode, ['hex', 'rgb'], 'hex'); },
        cmChannelCount() {
            const n = parseInt(String(this.widget.port_ch), 10);
            return n >= 3 && n <= 8 ? n : 3;
        },
        cmPixels() {
            const n = parseInt(String(this.widget.cm_pixels), 10);
            if (isNaN(n) || n < 1) return 100;
            return Math.min(512, n);
        },
        cmPortMode() { return this.opt(this.widget.port_mode, ['freq', 'wave'], 'freq'); },
        cmPortOut() { return this.opt(this.widget.port_out, ['level', 'onoff'], 'onoff'); },
        cmOnLevel() {
            const v = parseInt(String(this.widget.cm_on_level), 10);
            return v >= 0 && v <= 255 ? v : 90;
        },
        cmUseVol() { return this.widget.cm_use_vol === true || this.widget.cm_use_vol === '1'; },
        /* Цветомузыку для всех типов устройств ведёт серверный движок
           cm_engine.php: браузер шлёт только cmRun start/stop по фронтам
           play/stop, а кадры и цвета пишет процесс, минуя Apache. */
        cmExt() { return true; },
        cmIcMode() { return this.opt(this.widget.ic_mode, ['cm', 'wave', 'cm_wave', 'shuffle'], 'cm'); },
        cmTitle() {
            const tp = this.cmDevice;
            if (tp === 'ports') return this.cmPortMode === 'wave' ? this.t('cm_mode_wave') : this.t('cm_mode_freq');
            if (tp === 'rgb') return this.t('cm_ic_cm');
            return this.t(this.cmIcMode === 'cm_wave' ? 'cm_ic_wave_fade' : 'cm_ic_' + this.cmIcMode);
        },
        cmToggleTitle() { return this.t(this.cmOn ? 'cm_disable' : 'cm_enable'); },
        /* the modes available for the device; a single option gives nothing to cycle
           and the runtime button stays hidden */
        cmModes() {
            if (this.cmDevice === 'ports') return ['freq', 'wave'];
            if (this.cmDevice === 'ic' || this.cmDevice === 'megad') return ['cm', 'wave', 'cm_wave', 'shuffle'];
            return [];
        },
        cmModeIcon() {
            const m = this.cmDevice === 'ports' ? this.cmPortMode : this.cmIcMode;
            const map = {
                'freq': 'fas fa-chart-column',
                'wave': 'fas fa-wave-square',
                'cm': 'fas fa-palette',
                'cm_wave': 'fas fa-fill',
                'shuffle': 'fas fa-shuffle',
            };
            return map[m] || 'fas fa-sliders';
        },
        aliveDisabled() { return !!(this.widget.object_alive && this.widget.property_alive) && this.isAlive === false; },
    },
    watch: {
        'widget.volume'() { this.setVolume(this.pctVol() / 100); },
        'widget.autoplay'(v) { if (v) this.playIndex(this.index < 0 ? 0 : this.index); else if (this.playing) this.pause(); },
        'widget.folder'() { this.files = []; this.pickerError = ''; },
        'widget.color_mode'(v) { if (String(v) === 'off') this.clearColors(); },
    },
    mounted() {
        this.volume = this.clamp01(this.pctVol() / 100);
        try {
            const savedVol = localStorage.getItem(this.volStateKey());
            if (savedVol !== null && savedVol !== '') {
                const v = Number(savedVol);
                if (!isNaN(v)) this.volume = this.clamp01(v);
            }
        } catch (e) { }
        try {
            const savedEq = JSON.parse(localStorage.getItem(this.eqStateKey()) || 'null');
            if (Array.isArray(savedEq) && savedEq.length) {
                this.eqGains = this.eqBands.map((b, i) => this.clampEq(savedEq[i]));
            }
        } catch (e) { }
        try {
            const savedCu = JSON.parse(localStorage.getItem(this.eqCustomKey()) || 'null');
            if (Array.isArray(savedCu) && savedCu.length) this.customEq = savedCu.map(v => this.clampEq(v));
        } catch (e) { }
        this.eqSel = this.customEq && String(this.customEq) === String(this.eqGains) ? 'custom' : (this.eqPresets.find(pr => String(pr.g) === String(this.eqGains)) || {}).key || null;
        this.repeatMode = this.opt(this.widget.repeat, ['off', 'one', 'all'], 'off');
        this.shuffleOn = this.widget.shuffle === true;
        this.initTracks().then(() => {
            if (this.widget.autoplay && this.tracks.length && this.index < 0) this.playIndex(0);
        });
        const savedCm = localStorage.getItem(this.cmStateKey());
        this.cmOn = savedCm ? savedCm === '1' : false;
        if (this.cmOn) this.cmLamps = Array.from({ length: this.cmChannelCount }, () => ({ lvl: 0 }));
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (Number(this.widget.alive_timeout) || 3) * 1000);
        }
    },
    beforeUnmount() {
        this.unarmGesture();
        this.stopLoop();
        this.stop();
        this.cmEngineStop();
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
        pctVol() {
            let v = this.widget.volume === undefined || this.widget.volume === '' ? 50 : Number(this.widget.volume);
            if (isNaN(v)) v = 50;
            if (v > 0 && v <= 1) v = v * 100;
            return v;
        },
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
        /* a source is a broadcast when it is a remote url that has no media file
           extension (a radio endpoint such as .../ep128) or carries a playlist
           extension. A local path from the server folder is always a file. */
        isStreamSrc(src) {
            const s = String(src || '').trim();
            if (!/^https?:\/\//i.test(s)) return false;
            const clean = s.split(/[?#]/)[0];
            if (/\.(m3u8|m3u|pls)$/i.test(clean)) return true;
            return !/\.[a-z0-9]{2,5}$/i.test(clean);
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
        toggleEq() {
            this.eqOpen = !this.eqOpen;
            if (this.eqOpen) this.pickerOpen = false;
        },
        clampEq(v) {
            v = Number(v);
            if (isNaN(v)) v = 0;
            return Math.max(-12, Math.min(12, Math.round(v)));
        },
        setEqBand(i, val) {
            const v = this.clampEq(val);
            this.eqGains[i] = v;
            const fl = this.eqFilters && this.eqFilters[i];
            if (fl) { try { fl.gain.value = v; } catch (e) { } }
            if (this.eqSel === 'custom') {
                this.customEq = this.eqGains.slice();
                try { localStorage.setItem(this.eqCustomKey(), JSON.stringify(this.customEq)); } catch (e) { }
                try { localStorage.setItem(this.eqStateKey(), JSON.stringify(this.eqGains)); } catch (e) { }
            } else {
                this.eqSel = null;
            }
        },
        applyEqPreset(key) {
            const pr = this.eqPresets.find(p => p.key === key);
            if (!pr || !pr.g) return;
            this.eqSel = key;
            this.eqGains = pr.g.slice();
            if (this.eqFilters) this.eqFilters.forEach((fl, i) => { if (fl) { try { fl.gain.value = this.eqGains[i] || 0; } catch (e) { } } });
            try { localStorage.setItem(this.eqStateKey(), JSON.stringify(this.eqGains)); } catch (e) { }
        },
        eqStateKey() {
            const id = this.widget && this.widget.id;
            return 'dp_music_eq_' + (id === undefined || id === null ? 'global' : id);
        },
        eqCustomKey() {
            const id = this.widget && this.widget.id;
            return 'dp_music_eq_custom_' + (id === undefined || id === null ? 'global' : id);
        },
        saveCustomEq() {
            if (this.customEq) {
                this.eqSel = 'custom';
                this.eqGains = this.customEq.slice();
            } else {
                this.customEq = this.eqGains.slice();
                this.eqSel = 'custom';
            }
            if (this.eqFilters) this.eqFilters.forEach((fl, i) => { if (fl) { try { fl.gain.value = this.eqGains[i] || 0; } catch (e) { } } });
            try { localStorage.setItem(this.eqStateKey(), JSON.stringify(this.eqGains)); } catch (e) { }
            try { localStorage.setItem(this.eqCustomKey(), JSON.stringify(this.customEq)); } catch (e) { }
        },
        async togglePicker() {
            this.pickerOpen = !this.pickerOpen;
            if (this.pickerOpen) this.eqOpen = false;
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
                const giz = [];
                let prev = an;
                this.eqBands.forEach((b, i) => {
                    const fl = ctx.createBiquadFilter();
                    fl.type = b.type;
                    fl.frequency.value = b.f;
                    fl.Q.value = 1.1;
                    fl.gain.value = this.eqGains[i] || 0;
                    prev.connect(fl);
                    prev = fl;
                    giz.push(fl);
                });
                prev.connect(gn);
                gn.connect(ctx.destination);
                this.actx = ctx;
                this.analyser = an;
                this.gainNode = gn;
                this.eqFilters = giz;
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
            /* The element is routed through WebAudio (the analyser feeds the spectrum
               and the colour music), and a cross-origin URL without the crossorigin
               attribute plays with the clock running but its path to the graph stays
               silent - no sound until some local file enables the attribute on the
               same element. The attribute is therefore set for every track up front. */
            el.crossOrigin = 'anonymous';
            if (el.getAttribute('src') !== src) { el.setAttribute('src', src); this.position = 0; this.duration = 0; this.liveStream = false; }
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
            if (this.cmOn && !this.cmEngineOn) this.cmEngineStart();
        },
        pause() {
            const el = this.audioEl;
            if (el) { try { el.pause(); } catch (e) { } }
            this.playing = false;
            this.stopLoop();
            this.cmEngineStop('off');
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
            this.liveStream = false;
            this.stopLoop();
            this.spectrum = new Array(24).fill(0);
            this.cmEngineStop(this.cmEndAction);
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
            try { localStorage.setItem(this.volStateKey(), String(val)); } catch (e) { }
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
            /* the engine keeps running across a playlist boundary - stopping it here
               would race the start of the next track and could leave the light dead.
               The end state is asked for when playback really stops (see stop()) */
            if (this.cmOn && !this.cmExt && this.repeatMode !== 'one' && !this.cmQueuedNext) {
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
                this.liveStream = el.duration === Infinity;
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
            const k = this.cmUseVol ? this.volume : 1;
            this.spectrum = this.shape(k !== 1 ? levels.map(v => v * k) : levels);
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


        cmStateKey() {
            const id = this.widget && this.widget.id;
            return 'dp_music_cm_' + (id === undefined || id === null ? 'global' : id);
        },
        volStateKey() {
            const id = this.widget && this.widget.id;
            return 'dp_music_vol_' + (id === undefined || id === null ? 'global' : id);
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
            if (this.cmDevice === 'megad') { add(this.widget.object_md, this.widget.property_md); return out; }
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
        /* automatic gain control for the colour devices. The on/off lamps on ports get
           a follower per channel: each light is driven by the dynamics of its own
           band and the master volume does not matter - whichever band suddenly plays
           louder than its recent average pops over the threshold. The level outputs
           get a follower on the peak of the spectrum instead - the loudest band is
           drawn near the target, so the lamps stay bright, the shape of the
           frequencies - bass brighter than treble - survives and the gain does not
           pump on every beat. The strips share one follower on the mean, so their
           brightness is spread around the middle. The beat still reads the raw
           loudness and survives the normalisation. */
        cmNormalize(levels, target, mode) {
            const t = target || 90;
            const n = levels.length;
            if (!n) return levels;
            const now = Date.now();
            if (mode === 'per') {
                if (!this.cmNormArr || this.cmNormArr.length !== n) {
                    /* fresh followers start at the target, so the gain is 1 and the
                       first frame passes through unchanged instead of flashing */
                    this.cmNormArr = new Array(n).fill(t);
                    this.cmNormAt = now;
                    return levels;
                }
                if (now - this.cmNormAt >= 60) {
                    for (let i = 0; i < n; i++) {
                        const diff = levels[i] - this.cmNormArr[i];
                        this.cmNormArr[i] += diff * (diff >= 0 ? 0.5 : 0.1);
                    }
                    this.cmNormAt = now;
                }
                const out = new Array(n);
                for (let i = 0; i < n; i++) out[i] = Math.min(255, levels[i] * (t / Math.max(10, this.cmNormArr[i])));
                return out;
            }
            if (mode === 'peak') {
                /* the follower jumps up at once and decays slowly, so a loud peak is
                   held for a moment and the gain does not pump on every beat */
                const peak = Math.max(...levels);
                if (this.cmNormPeak == null) { this.cmNormPeak = peak; this.cmNormAt = now; }
                else if (now - this.cmNormAt >= 60) {
                    if (peak > this.cmNormPeak) this.cmNormPeak = peak;
                    else this.cmNormPeak = this.cmNormPeak * 0.985 + peak * 0.015;
                    this.cmNormAt = now;
                }
                const base = Math.max(10, this.cmNormPeak);
                return levels.map(v => Math.min(255, v * (t / base)));
            }
            let sum = 0;
            for (let i = 0; i < n; i++) sum += levels[i];
            const mean = sum / n;
            if (this.cmNormAvg == null) { this.cmNormAvg = mean; this.cmNormAt = now; }
            else if (now - this.cmNormAt >= 60) {
                const diff = mean - this.cmNormAvg;
                this.cmNormAvg += diff * (diff > 0 ? 0.5 : 0.1);
                this.cmNormAt = now;
            }
            const base = Math.max(10, this.cmNormAvg);
            return levels.map(v => Math.min(255, v * (t / base)));
        },
        /* a slow follower gives the loudness and a fast one the moment they diverge:
           that jump is the beat the wave steps on */
        cmBeat(levels) {
            /* the beat is a jump of the raw loudness; the normalised levels are
               deliberately flat, so the beat would vanish if it were read from them */
            let val = this.cmRawPeak;
            if (val == null) val = levels.reduce((a, v) => a + v, 0) / (levels.length || 1);
            /* silenced music is not a beat: reset the followers so the next onset is
               caught cleanly, and the wave effects freeze instead of drifting */
            if (val < 28) { this.cmFast = null; this.cmSlow = null; return false; }
            this.cmFast = this.cmFast == null ? val : this.cmFast * 0.5 + val * 0.5;
            this.cmSlow = this.cmSlow == null ? val : this.cmSlow * 0.94 + val * 0.06;
            const now = Date.now();
            if (this.cmFast - this.cmSlow < 6 || now - this.cmBeatAt < 140) return false;
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
            if (this.cmExt) return;
            const key = object + '.' + property;
            const v = String(value);
            if (this.sentCm[key] === v) { cmLog('skip ' + key + ' = ' + (v.length > 60 ? v.slice(0, 60) + '...(' + v.length + ')' : v)); return; }
            cmLog('>> ' + key + ' = ' + (v.length > 60 ? v.slice(0, 60) + '...(' + v.length + ')' : v));
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
        /* light output for every device type is driven by a server-side cm_engine.php
           process (ran without Apache), so the browser only sends a single cmRun
           start/stop at the play/pause edges instead of a frame every 90ms. The payload
           is built from the same light settings the ws pushing uses, so the lamp set is
           exactly the configured Object.Property list. */
        cmEnginePayload() {
            const targets = this.cmTargets();
            if (!targets.length) return null;
            return {
                action: 'start',
                dev: this.cmDevice,
                targets: targets,
                mode: this.cmPortMode,
                out: this.cmPortOut,
                on_level: this.cmOnLevel,
                wr: this.cmWrite,
                ic_mode: this.cmIcMode,
                pixels: this.cmPixels,
                speed: 90,
            };
        },
        cmEngineStart() {
            if (!this.cmExt || !targetsOk(this.cmTargets())) return;
            const payload = this.cmEnginePayload();
            if (!payload) return;
            this.cmEngineOn = true;
            payload.action = 'start';
            cmLog('engine start ' + JSON.stringify(payload));
            try {
                dpAPI('cmRun', { method: 'POST', body: JSON.stringify(payload) }).catch(() => { });
            } catch (e) { }
        },
        /* stopping takes the state to leave the light in: pause and switching the lamp
           button off go dark, while a finished track asks the configured end action. A
           second stop for a turn that already happened is dropped, otherwise it would
           overwrite the end state with plain "off". */
        cmEngineStop(endAction) {
            if (!this.cmEngineOn) return;
            this.cmEngineOn = false;
            if (!this.cmExt || !targetsOk(this.cmTargets())) return;
            const payload = this.cmEnginePayload();
            if (!payload) return;
            payload.action = 'stop';
            payload.end = endAction || 'off';
            cmLog('engine stop ' + JSON.stringify(payload));
            try {
                dpAPI('cmRun', { method: 'POST', body: JSON.stringify(payload) }).catch(() => { });
            } catch (e) { }
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
            if (this.cmDevice === 'megad') { this.cmStepMegad(levels); return; }
            const targets = this.cmTargets();
            const beat = this.cmBeat(levels);

            if (this.cmDevice === 'ports') {
                const cnt = this.cmChannelCount;
                const vals = levels.slice(0, cnt);
                if (this.cmPortMode !== 'wave') {
                    this.cmApply(vals);
                    this.cmLamps = vals.map(v => ({ lvl: this.cmPortOut === 'onoff' ? (v >= this.cmOnLevel ? 1 : 0) : Math.max(0, Math.min(1, v / 255)) }));
                    return;
                }
                /* the wave steps with the beat, so the light jumps from lamp to lamp in
                   time with the music; in a steady section it keeps a slow drift
                   instead of stalling, and in a real pause the loudness gate in
                   cmBeat stops it */
                const head = vals.map(v => v * 0.12);
                const pos = this.cmPos || 0;
                if (beat) this.cmPos = (pos + 1) % cnt;
                else if (this.cmRawPeak >= 28) this.cmPos = (pos + 0.04 + 0.02 * (Math.max(...vals) / 255)) % cnt;
                head[Math.floor(this.cmPos)] = Math.max(...vals) * 1.2;
                this.cmApply(head);
                this.cmLamps = head.map(v => ({ lvl: this.cmPortOut === 'onoff' ? (v >= this.cmOnLevel ? 1 : 0) : Math.max(0, Math.min(1, v / 255)) }));
                return;
            }

            const mode = this.cmDevice === 'rgb' ? 'cm' : this.cmIcMode;
            const hue = this.cmHue(levels);
            const loud = Math.min(100, Math.max(...levels) * 0.5);
            cmLog('effect dev=' + this.cmDevice + ' mode=' + mode + ' hue=' + Math.round(hue) + ' loud=' + Math.round(loud));
            const n = targets.length;
            let sent = null;

            if (mode === 'cm') {
                sent = this.cmHslToRgb(hue, 100, loud);
                this.cmApply(sent);
            } else if (mode === 'shuffle') {
                if (beat || !this.cmShuffled) {
                    this.cmShuffled = true;
                    this.cmRoll = [0, 1, 2].map(() => Math.random());
                }
                const c = this.cmHslToRgb(Math.random() * 360, 100, loud);
                sent = [c[0] * this.cmRoll[0], c[1] * this.cmRoll[1], c[2] * this.cmRoll[2]];
                this.cmApply(sent);
            } else {
                if (beat) this.cmPos = (this.cmPos + 1) % (n > 0 ? n : 3);
                const tint = mode === 'cm_wave' ? (hue + this.cmPos * 60) % 360 : (this.cmHueD = (this.cmHueD + 6) % 360);
                const c = this.cmHslToRgb(tint, 100, loud);
                if (n === 3) {
                    const tail = [0.18, 0.18, 0.18];
                    tail[this.cmPos % 3] = 1;
                    sent = [c[0] * tail[0], c[1] * tail[1], c[2] * tail[2]];
                    this.cmApply(sent);
                } else {
                    sent = [c[0], c[1], c[2]];
                    this.cmApply(sent);
                }
            }

            if (!sent) return;
            const cc = 'rgb(' + Math.round(sent[0]) + ',' + Math.round(sent[1]) + ',' + Math.round(sent[2]) + ')';
            if (this.cmDevice === 'rgb') {
                this.cmWash = cc;
                this.cmWashO = Math.max(0.25, Math.min(1, loud / 100));
            } else {
                const o = 0.5 + (loud / 100) * 0.4;
                this.cmStrip = this.cmStrip.map(() => ({ c: cc, o: o }));
            }
        },
        /* MegaD addressable strip: a single property carries the whole frame as hex -
           every pixel as three bytes (RRGGBB) glued together. The frame length is set by
           the pixel count, so the server side only has to forward the value to the
           controller (for example /sec/?pt=35&ws=<value>). */
        cmStepMegad(levels) {
            const t = this.cmTargets();
            const n = this.cmPixels;
            const beat = this.cmBeat(levels);
            const hue = this.cmHue(levels);
            const loud = Math.min(100, Math.max(...levels) * 0.5);
            const mode = this.cmIcMode;
            cmLog('megad mode=' + mode + ' px=' + n + ' hue=' + Math.round(hue) + ' loud=' + Math.round(loud) + (mode === 'wave' || mode === 'cm_wave' ? ' phase=' + Math.round(this.cmPhase || 0) : ''));
            const frame = new Array(n);

            if (mode === 'shuffle') {
                if (beat || !this.cmShuffled) {
                    this.cmShuffled = true;
                    this.cmRoll = [0, 1, 2].map(() => Math.random());
                }
                for (let i = 0; i < n; i++) {
                    const c = this.cmHslToRgb(Math.random() * 360, 100, loud);
                    frame[i] = [c[0] * this.cmRoll[0], c[1] * this.cmRoll[1], c[2] * this.cmRoll[2]];
                }
            } else if (mode === 'wave' || mode === 'cm_wave') {
                /* the spectrum is laid along the strip - low frequencies at one end,
                   high at the other - and the whole rainbow slides towards the end, so
                   a colour that started at the beginning walks the length of the tape.
                   The rhythm wave speeds up and slows down with the beat, the shades
                   wave keeps one steady speed and only follows the frequencies. */
                const spec = levels;
                const B = spec.length;
                const lowN = Math.max(1, Math.ceil(B / 4));
                const bass = spec.slice(0, lowN).reduce((a, v) => a + v, 0) / lowN;
                /* the rhythm wave moves with the bass from the normalised spectrum, so
                   the volume of the track does not change the speed, and it never stops;
                   the shades wave keeps one steady speed and only follows the frequencies */
                const step = mode === 'wave' ? n * (0.012 + 0.03 * (bass / 255)) : n * 0.022;
                this.cmPhase = ((((this.cmPhase || 0) + step) % n) + n) % n;
                for (let i = 0; i < n; i++) {
                    const pos = (((i - this.cmPhase) % n) + n) % n;
                    const b = Math.min(B - 1, Math.floor(pos / n * B));
                    const tint = (b / B) * 320;
                    const l = Math.min(100, 35 + spec[b] * 55 / 255);
                    frame[i] = this.cmHslToRgb(tint, 100, l);
                }
            } else {
                const c = this.cmHslToRgb(hue, 100, loud);
                for (let i = 0; i < n; i++) frame[i] = c;
            }

            this.cmStrip = this.cmStrip.map((_, i) => {
                const px = frame[Math.min(n - 1, Math.floor((i / this.cmStrip.length) * n))] || [0, 0, 0];
                return {
                    c: 'rgb(' + Math.round(px[0]) + ',' + Math.round(px[1]) + ',' + Math.round(px[2]) + ')',
                    o: Math.max(0.15, Math.max(px[0], px[1], px[2]) / 255),
                };
            });
            if (t.length) this.cmSendFrame(t[0], frame);
        },
        cmFrameHex(frame) {
            let out = '';
            for (let i = 0; i < frame.length; i++) {
                const p = frame[i] || [0, 0, 0];
                for (let j = 0; j < 3; j++) {
                    const v = Math.max(0, Math.min(255, Math.round(Number(p[j]) || 0)));
                    out += v.toString(16).padStart(2, '0');
                }
            }
            return out;
        },
        cmSendFrame(target, frame) {
            if (!target) return;
            this.cmSend(target.object, target.property, this.cmFrameHex(frame));
        },
        cmTick() {
            if (!this.cmOn) return;
            const now = Date.now();
            if (now - this.lastCmAt < 90) return;
            this.lastCmAt = now;
            /* the whole spectrum is AGC normalised - plain lamps split around their
                   on/off threshold by frequency, the strips follow the shape of the
                   frequencies. The beat reads the raw loudness, so it still fires. */
            const n = this.cmDevice === 'ports' ? this.cmChannelCount : 24;
            const raw = this.cmBands(n).map(b => this.bandLevel(b, this.freqData));
            this.cmRawPeak = raw.length ? Math.max(...raw) : 0;
            const k = this.cmUseVol ? this.volume : 1;
            /* the on/off lamps get their own channel followers, the level outputs
               follow the peak (bright), the strips share one on the mean */
            const per = this.cmDevice === 'ports' && this.cmPortOut === 'onoff';
            const mode = per ? 'per' : (this.cmDevice === 'ports' ? 'peak' : 'mean');
            const target = per ? this.cmOnLevel : (this.cmDevice === 'ports' ? 220 : 90);
            const levels = this.cmNormalize(raw, target, mode).map(v => v * k);
            cmLog('freqs(' + n + ') raw=' + raw.map(v => Math.round(v)).join(','));
            cmLog('levels dev=' + this.cmDevice + ' ' + levels.map(v => Math.round(v)).join(','));
            this.cmStepEffect(levels);
            this.cmFlush();
        },
        cmCycle() {
            const modes = this.cmModes;
            if (modes.length < 2) return;
            const key = this.cmDevice === 'ports' ? 'port_mode' : 'ic_mode';
            const cur = String(this.widget[key] || '').trim();
            const next = modes[(modes.indexOf(cur) + 1) % modes.length];
            this.widget[key] = next;
            this.cmPos = 0;
            this.cmPhase = 0;
this.cmFast = null;
            this.cmSlow = null;
            this.cmNormArr = null;
            this.cmNormAvg = null;
            this.cmNormPeak = null;
            this.cmNormAt = 0;
        },
toggleCm() {
            this.cmOn = !this.cmOn;
            try { localStorage.setItem(this.cmStateKey(), this.cmOn ? '1' : '0'); } catch (e) { }
            if (this.cmOn) {
                this.cmFast = null; this.cmSlow = null; this.cmPos = 0; this.cmPhase = 0; this.cmNormArr = null; this.cmNormAvg = null; this.cmNormPeak = null; this.cmNormAt = 0; this.cmLamps = Array.from({ length: this.cmChannelCount }, () => ({ lvl: 0 }));
                if (this.playing) this.cmEngineStart();
            }
            else { this.cmEndLight('off'); this.cmEngineStop(); }
        },
        /* what the light does once the sound is over - settings pick off, on or keep.
           With the engine driving the light the end state is a stop of that engine, the
           browser only keeps its own preview in step; the write itself is done server side */
        cmEndLight(action) {
            const t = this.cmTargets();
            const what = action || this.cmEndAction;
            if (what === 'keep') return;
            if (this.cmDevice === 'megad') {
                const c = what === 'on' ? [255, 255, 255] : [0, 0, 0];
                this.cmStrip = this.cmStrip.map(() => ({ c: 'rgb(' + c.join(',') + ')', o: what === 'on' ? 1 : 0 }));
                if (this.cmExt) { this.cmEngineStop(what); return; }
                const frame = new Array(this.cmPixels).fill(c);
                if (t.length) this.cmSendFrame(t[0], frame);
                this.cmFlush();
                return;
            }
            if (what === 'on') {
                this.cmViewLamps(true);
                this.cmWash = 'rgb(255,255,255)'; this.cmWashO = 1;
                this.cmStrip = this.cmStrip.map(() => ({ c: 'rgb(255,255,255)', o: 1 }));
            } else {
                this.cmViewOff();
            }
            if (this.cmExt) { this.cmEngineStop(what); return; }
            if (!t.length) return;
            if (what === 'on') {
                if (this.cmDevice === 'ports' && this.cmPortOut === 'onoff') { t.forEach(c => this.cmSend(c.object, c.property, '1')); }
                else if (this.cmDevice !== 'ports' && this.cmWrite === 'hex') { this.cmSend(t[0].object, t[0].property, 'ffffff'); }
                else { t.forEach((c, i) => this.cmSend(c.object, c.property, String([255, 60, 20][i] || 255))); }
            } else {
                t.forEach(c => this.cmSend(c.object, c.property, '0'));
            }
            this.cmFlush();
        },
        cmViewLamps(on) {
            this.cmLamps = Array.from({ length: this.cmChannelCount }, () => ({ lvl: on ? 1 : 0 }));
        },
        cmViewOff() {
            this.cmLamps = (this.cmLamps || []).map(l => ({ lvl: 0 }));
            this.cmWash = ''; this.cmWashO = 0;
            this.cmStrip = this.cmStrip.map(l => ({ c: l.c, o: 0 }));
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

MusicplayerWidget.EQ_BANDS = [
    { label: '60', f: 60, type: 'lowshelf' },
    { label: '130', f: 130, type: 'peaking' },
    { label: '230', f: 230, type: 'peaking' },
    { label: '500', f: 500, type: 'peaking' },
    { label: '910', f: 910, type: 'peaking' },
    { label: '3.6K', f: 3600, type: 'peaking' },
    { label: '8K', f: 8000, type: 'peaking' },
    { label: '14K', f: 14000, type: 'highshelf' },
];

MusicplayerWidget.EQ_PRESETS = [
    { key: 'flat', label: 'mu_eq_flat', g: [0, 0, 0, 0, 0, 0, 0, 0] },
    { key: 'rock', label: 'mu_eq_rock', g: [6, 4, 4, 3, 2, 3, 4, 4] },
    { key: 'pop', label: 'mu_eq_pop', g: [4, 3, 2, 2, 1, 3, 2, 2] },
    { key: 'retro', label: 'mu_eq_retro', g: [4, 2, 3, 1, -2, -4, -5, -6] },
    { key: 'techno', label: 'mu_eq_techno', g: [7, 5, 3, 1, 0, 2, 4, 5] },
    { key: 'jazz', label: 'mu_eq_jazz', g: [3, 2, 2, 1, 1, 1, 3, 3] },
    { key: 'classical', label: 'mu_eq_classical', g: [2, 0, -1, 0, 0, -2, -2, -1] },
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
            '.dp-music__now { min-height:42px; }',
            '.dp-music__empty { min-height:42px; display:flex; align-items:center; justify-content:center; font-size:.8rem; color:var(--on-theme-dim); text-align:center; }',
            '.dp-music__transport { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:8px; }',
            '.dp-music__tbtn { width:32px; height:32px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; border:none; border-radius:50%; background:rgba(128,128,128,.18); color:var(--on-theme-mid) !important; cursor:pointer; font-size:.78rem; padding:0; }',
            '.dp-music__tbtn:hover { background:rgba(128,128,128,.32); }',
            '.dp-music__tbtn--main { width:42px; height:42px; font-size:1rem; background:var(--primary); color:#fff !important; }',
            '.dp-music__tbtn--main:hover { filter:brightness(1.12); }',
            '.dp-music__tbtn--on { background:rgba(76,175,80,.16); color:#4caf50 !important; box-shadow:inset 0 0 0 1px #4caf50; }',
            '.dp-music__vol { display:flex; align-items:center; gap:6px; margin-top:8px; font-size:.65rem; color:var(--on-theme-mid); }',
            '.dp-music__vol input[type=range] { flex:1; min-width:0; -webkit-appearance:none; appearance:none; height:4px; border-radius:2px; background:rgba(128,128,128,.3); outline:none; cursor:pointer; }',
            '.dp-music__vol input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:var(--primary); cursor:pointer; border:none; }',
            '.dp-music__vol input[type=range]::-moz-range-thumb { width:13px; height:13px; border-radius:50%; background:var(--primary); cursor:pointer; border:none; }',
            '.dp-music__spectrum { display:flex; align-items:flex-end; gap:2px; height:44px; margin-top:8px; padding:0 1px; }',
            '.dp-music__cm { background:rgba(0,0,0,.24); border-radius:5px; justify-content:center; }',
            '.dp-music__cm--lamps { align-items:center; gap:12px; }',
            '.dp-music__lamp { width:12px; height:12px; min-width:12px; border-radius:50%; background:rgba(255,255,255,.07); box-shadow:inset 0 0 2px rgba(0,0,0,.45); }',
            '.dp-music__lamp--on { background:radial-gradient(circle at 35% 30%, #fff, #ffd54f 60%, #f7931e); box-shadow:0 0 8px 2px rgba(255,213,79,.85); }',
            '.dp-music__cm--strip { align-items:center; gap:3px; padding:0 4px; }',
            '.dp-music__led { flex:1; min-width:3px; height:10px; align-self:center; border-radius:2px; }',
            '.dp-music__eq { margin-top:8px; padding:8px; background:rgba(128,128,128,.12); border-radius:8px; }',
            '.dp-music__eq-bands { display:flex; gap:8px; justify-content:space-between; padding:4px 2px 0; }',
            '.dp-music__eq-band { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; min-width:0; }',
            '.dp-music__eq-lbl { font-size:.6rem; color:var(--on-theme-mid); white-space:nowrap; }',
            '.dp-music__eq-val { font-size:.62rem; color:var(--on-theme-high); }',
            '.dp-music__eq-band input[type=range] { writing-mode:vertical-lr; direction:rtl; height:74px; width:28px; margin:0; accent-color:var(--primary); }',
            '.dp-music__eq-presets { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; justify-content:center; }',
            '.dp-music__eq-p { border:none; border-radius:12px; padding:3px 10px; font-size:.68rem; background:rgba(128,128,128,.18); color:var(--on-theme-mid) !important; cursor:pointer; transition:background .15s; }',
            '.dp-music__eq-p:hover { background:rgba(128,128,128,.32); }',
            '.dp-music__eq-p.dp-music__ibtn--on { background:var(--primary); color:#fff !important; }',
            '.dp-music__cell { flex:1; height:100%; display:flex; align-items:flex-end; }',
            '.dp-music__cell i { display:block; width:100%; min-height:2px; border-radius:1px; opacity:.85; transition:height .06s linear; }',
            '.dp-music__picker { margin-top:8px; padding:8px; border-radius:var(--wpb-radius-default, 0px); background:rgba(128,128,128,.12); border:1px solid rgba(128,128,128,.25); }',
            '.dp-music__picker-head { font-size:.72rem; color:var(--on-theme-mid); margin-bottom:5px; }',
            '.dp-music__files { font-size:.72rem; color:var(--on-theme-dim); padding:4px 0; }',
            '.dp-music__files-list { overflow-y:auto; min-height:0; }',
            '.dp-music__body--panel { overflow:hidden; }',
            '.dp-music__body--panel .dp-music__now, .dp-music__body--panel .dp-music__empty, .dp-music__body--panel .dp-music__transport, .dp-music__body--panel .dp-music__vol, .dp-music__body--panel .dp-music__spectrum { flex:0 0 auto; }',
            '.dp-music__body--panel .dp-music__picker { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }',
            '.dp-music__body--panel .dp-music__picker-head, .dp-music__body--panel .dp-music__picker-row, .dp-music__body--panel .dp-music__picker-hint, .dp-music__body--panel .dp-music__files { flex:0 0 auto; }',
            '.dp-music__body--panel .dp-music__files-list { flex:1 1 auto; }',
            '.dp-music__body--panel .dp-music__eq { flex:1 1 auto; min-height:0; overflow-y:auto; }',
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
