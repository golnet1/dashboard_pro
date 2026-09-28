const StreamWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'source_type', label: 'field_stream_source', type: 'select', row: 'src_row', default: 'url', options: [{value:'url',label:'opt_url'},{value:'property',label:'opt_property'},{value:'go2rtc',label:'opt_go2rtc'},{value:'onvif',label:'opt_onvif'}] },
            { key: 'url', label: 'field_stream_url', type: 'text', row: 'src_row', showIf: { source_type: 'url' } },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop', showIf: { source_type: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop', showIf: { source_type: 'property' } },
            { key: 'host', label: 'field_stream_host', type: 'text', row: 'g2r_row', showIf: { source_type: 'go2rtc' } },
            { key: 'camera', label: 'field_stream_camera', type: 'select', row: 'g2r_row', go2rtc: true, placeholder: 'field_stream_no_cams', showIf: { source_type: 'go2rtc' } },
            { key: 'onvif_url', label: 'field_stream_onvif_url', type: 'text', row: 'onvif_row', showIf: { source_type: 'onvif' } },
            { key: 'onvif_login', label: 'field_stream_onvif_login', type: 'text', row: 'onvif_row', showIf: { source_type: 'onvif' } },
            { key: 'onvif_password', label: 'field_stream_onvif_password', type: 'text', row: 'onvif_row', inputType: 'password', showIf: { source_type: 'onvif' } },
            { key: 'onvif_view', label: 'field_stream_view', type: 'select', row: 'onvif_row', showIf: { source_type: 'onvif' }, default: 'full', options: [{value:'full',label:'field_stream_view_full'},{value:'cam1',label:'field_stream_view_cam1'},{value:'cam2',label:'field_stream_view_cam2'}] },
            { key: 'autoplay', label: 'field_video_autoplay', type: 'checkbox', default: false },
            { key: 'muted', label: 'field_video_muted', type: 'checkbox', default: true },
            { key: 'nocontrols', label: 'field_video_nocontrols', type: 'checkbox', default: false },
            { key: 'ptz', label: 'field_stream_ptz', type: 'checkbox', default: false, showIf: { source_type: 'onvif' } },
        ],
        advanced: [
            { key: 'quality', label: 'field_stream_quality', type: 'select', default: '', options: [{value:'',label:'field_stream_quality_orig'},{value:'720',label:'field_stream_quality_720'},{value:'480',label:'field_stream_quality_480'},{value:'360',label:'field_stream_quality_360'}] },
            { key: 'fps_limit', label: 'field_stream_fps', type: 'select', default: '', options: [{value:'',label:'field_stream_fps_auto'},{value:'15',label:'field_stream_fps_15'},{value:'10',label:'field_stream_fps_10'},{value:'5',label:'field_stream_fps_5'}] },
            { key: 'color', label: 'field_color', type: 'color' },
            { key: 'history', label: 'field_stream_history', type: 'checkbox', default: false },
            { key: 'history_note', label: 'field_stream_history_note', type: 'info', text: 'field_stream_history_note', showIf: { history: true } },
            { key: 'history_url', label: 'field_stream_history_url', type: 'text', row: 'hist_row', placeholder: 'field_stream_history_url_ph', showIf: { history: true } },
            { key: 'history_fmt', label: 'field_stream_history_fmt', type: 'info', text: 'field_stream_history_fmt', showIf: { history: true } },
        ],
    },
    defaults: { icon: 'fas fa-satellite-dish', source_type: 'url', url: '', object: '', property: '', host: '', camera: '', onvif_url: '', onvif_login: '', onvif_password: '', onvif_view: 'full', quality: '', fps_limit: '', autoplay: false, muted: true, nocontrols: false, ptz: false, height: 200, history: false, history_url: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="padding:0;overflow:hidden;position:relative" @mouseenter="videoHover = true" @mouseleave="videoHover = false">
            <video v-if="videoUrl" ref="player"
                :autoplay="!!widget.autoplay" :muted="!!widget.muted"
                :controls="!noControls"
                playsinline preload="metadata"
                @play="videoPlaying = true" @pause="videoPlaying = false"
                @playing="onPlaying"
                style="width:100%;height:100%;object-fit:contain;background:#000"></video>
            <div v-if="hasSource && !histPlaying && !widget.autoplay" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;justify-content:center;cursor:pointer" @click="videoPlaying ? stopStream() : userPlay()">
                <div v-show="videoHover" style="display:flex;align-items:center;justify-content:center">
                <button type="button" class="v-btn v-btn--is-elevated v-btn--has-bg v-size--large secondary" style="background:rgba(20,20,20,.65);color:#fff;min-width:56px;min-height:56px;border-radius:50%" :title="videoPlaying ? t('stream_stop_btn') : t('stream_play_btn')"><i class="fas" :class="videoPlaying ? 'fa-stop' : 'fa-play'"></i></button>
                </div>
            </div>
            <button v-if="noControls && hasSource" type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="position:absolute;top:6px;left:6px;z-index:3;background:rgba(20,20,20,.6);color:#fff;min-width:34px;padding:0 8px" :title="fsActive ? t('stream_fs_exit') : t('stream_fs_btn')" @click="toggleFullscreen"><i class="fas" :class="fsActive ? 'fa-compress' : 'fa-expand'"></i></button>
            <div v-if="noControls && videoUrl && fsActive && histPlaying" class="stream-fs-bar" style="position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(20,20,20,.7);color:#fff">
                <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="min-width:34px;padding:0 8px;color:#fff" :title="videoPlaying ? t('stream_pause_btn') : t('stream_play_btn')" @click="togglePlay"><i class="fas" :class="videoPlaying ? 'fa-pause' : 'fa-play'"></i></button>
                <input type="range" min="0" max="1000" step="1" v-model="histScrub" @input="histDragInput" @change="histDragEnd" style="flex:1;height:4px;cursor:pointer">
                <span style="font-size:.75rem;white-space:nowrap;color:rgba(255,255,255,.85)">{{ histTime }}</span>
                <select :value="speed" @change="setSpeed($event.target.value)" style="background:#1e1e1e;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:4px;padding:3px 4px;font-size:.75rem">
                    <option v-for="s in speeds" :key="s" :value="s">{{ s }}x</option>
                </select>
                <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="min-width:34px;padding:0 8px;color:#fff" :title="t('stream_stop_btn')" @click="stopHistoryFullscreen"><i class="fas fa-stop"></i></button>
                <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="min-width:34px;padding:0 8px;color:#fff" :title="t('stream_fs_exit')" @click="exitFullscreen"><i class="fas fa-compress"></i></button>
            </div>
            <div v-show="!videoUrl" class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;color:rgba(255,255,255,.38)">
                <div style="text-align:center">
                    <i class="fas fa-satellite-dish" style="font-size:2rem;margin-bottom:8px;display:block"></i>
                    <span>{{ widget.title || t('widget_stream') }}</span>
                </div>
            </div>
            <div v-if="widget.history && widget.history_url" style="position:absolute;top:6px;right:6px;z-index:2">
                <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="background:rgba(20,20,20,.6);color:#fff;min-width:34px;padding:0 8px" :title="t('stream_history_btn')" @click="histOpen = !histOpen"><i class="fas fa-clock"></i></button>
                <div v-if="histOpen" class="stream-hist" style="position:absolute;right:0;top:36px;width:250px;background:rgba(24,24,24,.96);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:10px;z-index:5;box-shadow:0 8px 24px rgba(0,0,0,.5)">
                    <div style="font-size:.8rem;color:rgba(255,255,255,.7);margin-bottom:6px">{{ t('stream_history_range') }}</div>
                    <label class="v-label" style="font-size:.7rem">{{ t('stream_history_from') }}</label>
                    <input type="datetime-local" v-model="histFrom" style="width:100%;background:#1e1e1e;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:4px 6px;margin-bottom:6px">
                    <label class="v-label" style="font-size:.7rem">{{ t('stream_history_to') }}</label>
                    <input type="datetime-local" v-model="histTo" style="width:100%;background:#1e1e1e;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:4px 6px;margin-bottom:8px">
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--has-bg v-size--small primary" style="width:100%;color:#fff" @click="playHistory" :disabled="!histFrom || !histTo">{{ t('stream_history_play') }}</button>
                    <button v-if="histPlaying" type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="width:100%;margin-top:6px;color:rgba(255,255,255,.6)" @click="stopHistory">{{ t('stream_history_live') }}</button>
                </div>
            </div>
        <div v-if="ptzEnabled && !histPlaying && videoHover" class="stream-ptz" style="position:absolute;right:8px;bottom:8px;z-index:5;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;align-items:center;max-width:220px">
                    <template v-if="ptzPresets.length">
                        <button v-for="p in ptzPresets" :key="p.token" type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--x-small" style="min-width:0;padding:0 8px;background:rgba(20,20,20,.6);color:#fff;font-size:.72rem" :title="p.name" @click.stop.prevent="gotoPreset(p)">{{ p.name || p.token }}</button>
                    </template>
                    <span v-else style="font-size:.68rem;color:rgba(255,255,255,.75);background:rgba(20,20,20,.6);border-radius:4px;padding:2px 6px">{{ t('ptz_no_presets') }}</span>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small" style="min-width:30px;padding:0 6px;background:rgba(20,20,20,.6);color:#fff" :title="t('ptz_refresh')" @click.stop.prevent="loadPtzPresets"><i class="fas fa-rotate"></i></button>
                </div>
                <div class="stream-ptz-grid" style="display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,34px);grid-gap:4px;background:rgba(20,20,20,.6);border-radius:8px;padding:6px">
                    <span></span>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_up')" @mousedown.stop.prevent="ptzStart(0,1)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzStart(0,-1)" @touchend.prevent="ptzStopHold()"><i class="fas fa-arrow-up"></i></button>
                    <span></span>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_left')" @mousedown.stop.prevent="ptzStart(-1,0)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzStart(-1,0)" @touchend.prevent="ptzStopHold()"><i class="fas fa-arrow-left"></i></button>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_stop')" @click.stop.prevent="ptzStop()"><i class="fas fa-stop"></i></button>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_right')" @mousedown.stop.prevent="ptzStart(1,0)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzStart(1,0)" @touchend.prevent="ptzStopHold()"><i class="fas fa-arrow-right"></i></button>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_zoom_out')" @mousedown.stop.prevent="ptzZoomHold(-1)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzZoomHold(-1)" @touchend.prevent="ptzStopHold()"><i class="fas fa-magnifying-glass-minus"></i></button>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_down')" @mousedown.stop.prevent="ptzStart(0,-1)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzStart(0,1)" @touchend.prevent="ptzStopHold()"><i class="fas fa-arrow-down"></i></button>
                    <button type="button" class="v-btn v-btn--is-elevated v-btn--text v-size--small stream-ptz-btn" :style="ptzBtnStyle" :title="t('ptz_zoom_in')" @mousedown.stop.prevent="ptzZoomHold(1)" @mouseup.stop.prevent="ptzStopHold()" @mouseleave="ptzStopHold()" @touchstart.prevent="ptzZoomHold(1)" @touchend.prevent="ptzStopHold()"><i class="fas fa-magnifying-glass-plus"></i></button>
                </div>
            </div>
        </div>`,
    data() {
        return { hls: null, videoError: false, videoPlaying: false, videoHover: false, started: false, objValue: null, valueTimer: null, resolvedRtsp: null, clientId: null, _bridge: null, prevBridge: null, _onUnload: null, _onVis: null, _onFs: null, dbgTimer: null, histOpen: false, histPlaying: false, histFrom: '', histTo: '', histBaseMs: 0, histProgMs: 0, histScrub: 0, histDragging: false, histDragTimer: null, fsActive: false, fsTick: 0, speed: 1, hfsTimer: null, ptzMoving: false, ptzHoldTimer: null, ptzProfile: '', onvifProfiles: [], ptzPresets: [], ptzPresetsLoaded: false };
    },
    watch: {
        videoUrl() { this.$nextTick(() => this.setup()); },
        'widget.source_type'() { this.resolveOnvif(); this.$nextTick(() => this.setup()); },
        'widget.autoplay'() { this.$nextTick(() => this.tryPlay()); },
        'widget.ptz'(v) { if (v) this.$nextTick(() => this.loadPtzPresets()); },
        videoHover(v) { if (v && this.ptzEnabled && !this.ptzPresetsLoaded) this.$nextTick(() => this.loadPtzPresets()); },
        histPlaying(v) {
            if (v) {
                this.ensureFsTimer();
            } else if (this.hfsTimer) {
                clearInterval(this.hfsTimer);
                this.hfsTimer = null;
            }
        },
    },
    mounted() {
        this.loadObjValue();
        if (this.widget.object && !window.__dpWsLive) this.valueTimer = setInterval(() => this.loadObjValue(), 3000);
        this.resolveOnvif();
        this._onUnload = () => { this.releaseStream(); };
        window.addEventListener('beforeunload', this._onUnload);
        this._onVis = () => {
            if (!document.hidden) this.onVisible();
        };
        document.addEventListener('visibilitychange', this._onVis);
        this._onFs = () => {
            this.fsActive = !!document.fullscreenElement;
        };
        document.addEventListener('fullscreenchange', this._onFs);
        this.$nextTick(() => {
            this.dbgTimer = setInterval(() => this.dbgState(), 3000);
            const v = this.$refs.player;
            if (!v) return;
            ['playing', 'waiting', 'stalled', 'pause', 'canplay', 'error', 'emptied'].forEach(ev => v.addEventListener(ev, () => this.dpDbg('video_' + ev)));
            v.addEventListener('play', () => this.onUserPlay());
            this.setup();
        });
    },
        beforeUnmount() {
            if (this.valueTimer) clearInterval(this.valueTimer);
            if (this.dbgTimer) clearInterval(this.dbgTimer);
            if (this.hfsTimer) clearInterval(this.hfsTimer);
            if (this.histDragTimer) clearTimeout(this.histDragTimer);
            if (this._onUnload) window.removeEventListener('beforeunload', this._onUnload);
            if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
            if (this._onFs) document.removeEventListener('fullscreenchange', this._onFs);
            this.teardown();
            this.releaseStream();
            this.ptzStopHold();
        },
    computed: {
        sourceType() {
            const st = this.widget.source_type;
            if (st === 'go2rtc' || st === 'onvif') return st;
            if (st !== undefined && st !== null && String(st) === 'property') return 'property';
            return 'url';
        },
        noControls() {
            return !!(this.widget.nocontrols || this.widget.fullscreen_only);
        },
        ptzEnabled() {
            return this.sourceType === 'onvif' && !!this.widget.ptz;
        },
        go2rtcUrl() {
            const host = String(this.widget.host || '').trim().replace(/\/+$/, '');
            if (!host || !this.widget.camera) return '';
            const base = /^https?:\/\//i.test(host) ? host : 'http://' + host;
            return base + '/api/stream.m3u8?src=' + encodeURIComponent(String(this.widget.camera));
        },
        videoUrl() {
            if (this.histPlaying && this.historyUrl()) {
                return this.bridgeUrl(this.historyUrl(), this.widget.onvif_view || 'full');
            }
            if (!this.widget.autoplay && !this.started) return '';
            const t = this.sourceType;
            if (t === 'go2rtc') return this.go2rtcUrl;
            if (t === 'onvif') {
                if (!this.resolvedRtsp) return '';
                return this.bridgeUrl(String(this.resolvedRtsp), this.widget.onvif_view || 'full');
            }
            let url = '';
            if (t === 'property') {
                url = (this.objValue !== null && this.objValue !== undefined) ? String(this.objValue) : '';
            } else {
                url = this.widget.url ? String(this.widget.url) : '';
                if (url && this.objValue !== null && this.objValue !== undefined) {
                    if (String(url).includes('{value}')) {
                        url = String(url).replace(/\{value\}/g, this.objValue);
                    } else if (!url.trim()) {
                        url = this.objValue;
                    }
                }
            }
            url = url.trim();
            if (/^(rtsp|rtsps):\/\//i.test(url)) return this.bridgeUrl(url);
            return url;
        },
        hasSource() {
            if (this.histPlaying || this.widget.autoplay) return true;
            const t = this.sourceType;
            if (t === 'go2rtc') return !!(this.widget.host && this.widget.camera);
            if (t === 'onvif') return !!(this.widget.onvif_url && this.resolvedRtsp);
            if (t === 'property') return !!this.widget.object;
            return !!(this.widget.url || this.objValue);
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        speeds() {
            return [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
        },
        histPosPct() {
            if (this.histDragging) return this.histScrub;
            if (!this.histPlaying || !this.histBaseMs) return 0;
            return this.pctFromMs(this.histBaseMs + this.histProgMs);
        },
        histTime() {
            const fromMs = Date.parse(this.histFrom);
            const toMs = Date.parse(this.histTo);
            if (isNaN(fromMs) || isNaN(toMs) || toMs <= fromMs) return '';
            const pct = this.histDragging ? this.histScrub : this.histPosPct;
            const curMs = fromMs + (pct / 1000) * (toMs - fromMs);
            const f = ms => {
                if (isNaN(ms) || !isFinite(ms)) return '--:--:--';
                const d = new Date(ms);
                const p = n => String(n).padStart(2, '0');
                return p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
            };
            return f(curMs) + ' / ' + f(toMs);
        }
    },
    methods: {
        isHlsUrl(url) {
            return /\.m3u8(\?|#|$)/i.test(url) || /application\/x-mpegURL/i.test(url) || url.includes('hls_bridge');
        },
        dpDbg(msg) {
            if (!msg) return;
            try {
                const u = '/api.php/module/dashboard_pro/hls_dbg';
                if (navigator.sendBeacon) navigator.sendBeacon(u, JSON.stringify({ msg: String(msg).slice(0, 700) }));
                else fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: String(msg).slice(0, 700) }) }).catch(() => {});
            } catch (e) { /* silent */ }
        },
        dbgState() {
            const v = this.$refs.player;
            if (!v) return;
            let b = 0;
            try { if (v.buffered && v.buffered.length) b = v.buffered.end(v.buffered.length - 1); } catch (e) {}
            this.dpDbg('st t=' + v.currentTime.toFixed(2) + ' rs=' + v.readyState + ' p=' + v.paused + ' buf=' + b.toFixed(1) + ' vd=' + (isNaN(v.duration) ? 'NaN' : v.duration.toFixed(1)) + ' cv=' + document.querySelectorAll('video').length + ' hi=' + (window.__dpHls || 0));
        },
        genClientId() {
            return Math.random().toString(36).slice(2) + Date.now().toString(36);
        },
        bridgeParams(src, view) {
            const w = (this && this.widget) || {};
            const p = new URLSearchParams();
            p.set('src', src);
            p.set('view', view);
            const q = ['720', '480', '360'].indexOf(String(w.quality || '')) >= 0 ? String(w.quality) : '';
            const f = ['15', '10', '5'].indexOf(String(w.fps_limit || '')) >= 0 ? String(w.fps_limit) : '';
            if (q) p.set('res', q);
            if (f) p.set('fps', f);
            return p;
        },
        bridgeUrl(src, view) {
            const v = (view === 'cam1' || view === 'cam2') ? view : 'full';
            if (!this.clientId) this.clientId = this.genClientId();
            this._bridge = this.bridgeParams(src, v);
            const q = new URLSearchParams(this._bridge);
            q.set('tok', this.clientId);
            return '/api.php/module/dashboard_pro/hls_bridge?' + q.toString();
        },
        releaseParams(params) {
            if (!this.clientId) return;
            const q = new URLSearchParams(params);
            q.set('tok', this.clientId);
            const u = '/api.php/module/dashboard_pro/hls_release?' + q.toString();
            if (navigator.sendBeacon) {
                navigator.sendBeacon(u);
            } else {
                fetch(u, { method: 'POST', keepalive: true }).catch(() => {});
            }
        },
        releaseStream() {
            if (this._bridge) {
                this.releaseParams(this._bridge);
                this._bridge = null;
            }
        },
        async loadObjValue() {
            let obj = this.widget.object_value || this.widget.object;
            if (!obj) return;
            try {
                const params = this.widget.property ? { object: obj, property: this.widget.property } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined) {
                    const prev = this.objValue === null || this.objValue === undefined ? '' : String(this.objValue);
                    this.objValue = d.value;
                    if (String(d.value) !== prev) this.$nextTick(() => this.setup());
                }
            } catch (e) { /* silent */ }
        },
        async resolveOnvif() {
            if (this.sourceType !== 'onvif') { this.resolvedRtsp = null; this.onvifProfiles = []; this.ptzProfile = ''; this.ptzPresets = []; return; }
            const s = this.widget;
            if (!s.onvif_url) { this.resolvedRtsp = null; return; }
            try {
                const q = new URLSearchParams({ service: s.onvif_url, login: s.onvif_login || '', password: s.onvif_password || '' });
                const d = await dpAPI('onvif_rtsp?' + q.toString());
                if (!d.error && d.streams && d.streams.length) {
                    if (this.resolvedRtsp !== String(d.streams[0])) {
                        this.resolvedRtsp = String(d.streams[0]);
                        this.$nextTick(() => this.setup());
                    }
                    if (Array.isArray(d.profiles) && d.profiles.length) {
                        this.onvifProfiles = d.profiles;
                        if (!this.ptzProfile) this.ptzProfile = String(d.profiles[0] || '');
                    }
                } else {
                    this.resolvedRtsp = null;
                }
                if (this.ptzEnabled) this.$nextTick(() => this.loadPtzPresets());
            } catch (e) { this.resolvedRtsp = null; }
        },
        setup() {
            this.teardown();
            const v = this.$refs.player;
            const url = this.videoUrl;
            if (!v || !url) return;
            const hlsUrl = this.isHlsUrl(url);
            if (hlsUrl && window.Hls && window.Hls.isSupported()) {
                window.__dpHls = (window.__dpHls || 0) + 1;
                this.hls = new window.Hls({
                    liveSyncDurationCount: 2,
                    maxBufferLength: 20,
                    backBufferLength: 30,
                    startPosition: -1,
                    startFragPrefetch: true,
                    manifestLoadingTimeOut: 12000,
                    fragLoadingTimeOut: 8000,
                    manifestLoadingMaxRetry: 3,
                    fragLoadingMaxRetry: 5,
                    levelLoadingMaxRetry: 5
                });
                this.hlsRecovery = 0;
                this.hlsReboot = 0;
                this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => { this.dpDbg('manifest_parsed'); this.tryPlay(); });
                this.hls.on(window.Hls.Events.ERROR, (ev, data) => {
                    this.dpDbg('hls_err type=' + (data && data.type || '') + ' det=' + (data && data.details || '') + ' fatal=' + (data && data.fatal ? 1 : 0) + ' rsn=' + (data && data.reason ? String(data.reason).slice(0, 120) : ''));
                    if (!data || !data.fatal || !this.hls) return;
                    this.videoError = true;
                    this.hlsRecovery++;
                    if (this.hlsRecovery > 3) {
                        if (this.hlsReboot < 3) {
                            this.hlsReboot++;
                            this.setup();
                        }
                        return;
                    }
                    if (data.type === 'networkError') {
                        this.hls.startLoad();
                    } else if (data.type === 'mediaError') {
                        this.hls.recoverMediaError();
                    } else if (this.hlsReboot < 3) {
                        this.hlsReboot++;
                        this.setup();
                    }
                });
                this.hls.loadSource(url);
                this.hls.attachMedia(v);
            } else {
                v.src = url;
                this.tryPlay();
            }
        },
        tryPlay() {
            const v = this.$refs.player;
            if (v && (this.widget.autoplay || this.started)) v.play().catch(() => {});
        },
        userPlay() {
            this.started = true;
            if (!this.hls) {
                this.$nextTick(() => this.setup());
                return;
            }
            const v = this.$refs.player;
            if (v) v.play().catch(() => {});
        },
        killBridge() {
            if (this._bridge) {
                const q = new URLSearchParams(this._bridge);
                if (this.clientId) q.set('tok', this.clientId);
                q.set('kill', '1');
                fetch('/api.php/module/dashboard_pro/hls_release?' + q.toString(), { method: 'POST', keepalive: true }).catch(() => {});
                this._bridge = null;
            }
        },
        ptzBtnStyle() {
            return 'min-width:0;width:34px;height:34px;padding:0;background:rgba(255,255,255,.12);color:#fff;border-radius:50%;font-size:.75rem';
        },
        ptzApi(cmd, extra) {
            const w = this.widget;
            if (this.sourceType !== 'onvif' || !w.onvif_url) return Promise.resolve(null);
            if (!this.ptzProfile) this.ptzProfile = (this.onvifProfiles && this.onvifProfiles[0]) || '';
            if (!this.ptzProfile) return Promise.resolve(null);
            const body = {
                cmd: cmd,
                service: w.onvif_url,
                login: w.onvif_login || '',
                password: w.onvif_password || '',
                profile: this.ptzProfile
            };
            return dpAPI('onvif_ptz', { method: 'POST', body: JSON.stringify(Object.assign(body, extra || {})) })
                .then(d => {
                    if (d && d.error) this.dpDbg('ptz_err ' + cmd + ' ' + String(d.error).slice(0, 160));
                    return d;
                })
                .catch(e => { this.dpDbg('ptz_net ' + cmd + ' ' + String(e && e.message || e).slice(0, 160)); return null; });
        },
        ptzSendMove(x, y) { this.ptzApi('move', { x: x, y: y }); },
        ptzSendZoom(z) { this.ptzApi('zoom', { zoom: z }); },
        ptzStart(x, y) {
            this.ptzStopHold();
            this.ptzMoving = true;
            this.ptzSendMove(x, y);
            this.ptzHoldTimer = setInterval(() => this.ptzSendMove(x, y), 500);
        },
        ptzZoomHold(v) {
            this.ptzStopHold();
            this.ptzMoving = true;
            this.ptzSendZoom(v);
            this.ptzHoldTimer = setInterval(() => this.ptzSendZoom(v), 500);
        },
        ptzStopHold() {
            if (this.ptzHoldTimer) { clearInterval(this.ptzHoldTimer); this.ptzHoldTimer = null; }
            if (this.ptzMoving) {
                this.ptzMoving = false;
                this.ptzApi('stop');
            }
        },
        ptzStop() {
            this.ptzStopHold();
            this.ptzApi('stop');
        },
        async loadPtzPresets() {
            if (!this.ptzEnabled || !this.ptzProfile) return;
            const d = await this.ptzApi('presets');
            this.ptzPresetsLoaded = true;
            if (d && !d.error && Array.isArray(d.presets)) this.ptzPresets = d.presets || [];
        },
        gotoPreset(p) {
            if (p && p.token) this.ptzApi('preset', { preset: String(p.token), speed: 0.5 });
        },
        stopStream() {
            this.teardown();
            const v = this.$refs.player;
            if (v) {
                try { v.pause(); } catch (e) {}
                try { v.removeAttribute('src'); } catch (e) {}
                try { v.load(); } catch (e) {}
            }
            this.videoPlaying = false;
            this.started = false;
            this.killBridge();
        },
        historyUrl() {
            const w = this.widget || {};
            if (!w.history) return '';
            const base = String(w.history_url || '').trim();
            if (!base) return '';
            const startMs = this.histBaseMs || Date.parse(this.histFrom);
            const toMs = Date.parse(this.histTo);
            if (isNaN(startMs) || isNaN(toMs) || toMs <= startMs) return '';
            const from = this.fmtIsapi(new Date(startMs));
            const to = this.fmtIsapi(new Date(toMs));
            return base + '?starttime=' + from + '&endtime=' + to;
        },
        histMsToSec(ms) {
            if (!ms || isNaN(ms)) return 0;
            return ms / 1000;
        },
        pctFromMs(ms) {
            const fromMs = Date.parse(this.histFrom);
            const toMs = Date.parse(this.histTo);
            if (!fromMs || !toMs || toMs <= fromMs) return 0;
            const pct = Math.round(((ms - fromMs) / (toMs - fromMs)) * 1000);
            return Math.max(0, Math.min(1000, pct));
        },
        fmtIsapi(v) {
            if (!v) return '';
            const d = new Date(v);
            if (isNaN(d.getTime())) return '';
            const p = n => String(n).padStart(2, '0');
            return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + 'Z';
        },
        playHistory() {
            if (!this.historyUrl) return;
            this.started = true;
            this.histPlaying = true;
            this.histOpen = false;
            const fromMs = Date.parse(this.histFrom);
            const toMs = Date.parse(this.histTo);
            if (isNaN(fromMs) || isNaN(toMs) || toMs <= fromMs) {
                this.histPlaying = false;
                return;
            }
            this.histBaseMs = fromMs;
            this.histProgMs = 0;
            this.histScrub = 0;
            this.histDragging = false;
            this.dpDbg('hist_play from=' + fromMs + ' to=' + toMs + ' url=' + this.historyUrl().slice(0, 200));
        },
        stopHistory() {
            this.dpDbg('hist_stop');
            this.killBridge();
            this.histPlaying = false;
            this.histOpen = false;
            this.histBaseMs = 0;
            this.histProgMs = 0;
            this.histScrub = 0;
        },
        stopHistoryFullscreen() {
            this.stopHistory();
            this.exitFullscreen();
        },
        histDragInput() {
            this.histDragging = true;
            this.dpDbg('hist_drag v=' + this.histScrub);
            if (this.histDragTimer) clearTimeout(this.histDragTimer);
            this.histDragTimer = setTimeout(() => { this.histDragEnd(); }, 500);
        },
        histDragEnd() {
            if (this.histDragTimer) { clearTimeout(this.histDragTimer); this.histDragTimer = null; }
            this.histDragging = false;
            try {
                this.dpDbg('hist_drag_end v=' + this.histScrub);
                this.histSeek(this.histScrub);
            } catch (e) {
                this.dpDbg('hist_seek_throw ' + String(e && e.message || e).slice(0, 200));
            }
        },
        histSeek(val) {
            const fromMs = Date.parse(this.histFrom);
            const toMs = Date.parse(this.histTo);
            this.dpDbg('hist_seek_in play=' + (!!this.histPlaying) + ' from=' + fromMs + ' to=' + toMs + ' val=' + Number(val));
            if (!this.histPlaying || isNaN(fromMs) || isNaN(toMs) || toMs <= fromMs) return;
            this.histBaseMs = fromMs + (Number(val) / 1000) * (toMs - fromMs);
            this.histProgMs = 0;
            this.videoPlaying = false;
            this.dpDbg('hist_seek val=' + Number(val) + ' base=' + this.histBaseMs + ' url=' + this.historyUrl().slice(0, 200));
            this.killBridge();
        },
        onUserPlay() {
            const v = this.$refs.player;
            if (!v || !this.hls) return;
            if (this.histPlaying) return;
            this.syncToLive();
        },
        onPlaying() {
            this.videoPlaying = true;
            if (this.noControls && this.widget.autoplay && !document.fullscreenElement) {
                this.toggleFullscreen();
            }
        },
        toggleFullscreen() {
            const el = this.$el || this.$refs.player;
            if (!el) return;
            try {
                if (document.fullscreenElement) {
                    if (document.exitFullscreen) document.exitFullscreen();
                } else {
                    const fsEl = (this.$refs.player && this.$refs.player.parentElement && this.$refs.player.parentElement.classList && this.$refs.player.parentElement.classList.contains('widget-v-card')) ? this.$refs.player.parentElement : (this.$el || this.$refs.player);
                    if (fsEl.requestFullscreen) fsEl.requestFullscreen();
                }
            } catch (e) { /* silent */ }
        },
        togglePlay() {
            const v = this.$refs.player;
            if (!v) return;
            if (v.paused) v.play().catch(() => {});
            else v.pause();
        },
        setSpeed(val) {
            this.speed = Number(val) || 1;
            const v = this.$refs.player;
            if (v) {
                try { v.playbackRate = this.speed; } catch (e) { /* silent */ }
            }
        },
        exitFullscreen() {
            try {
                if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
            } catch (e) { /* silent */ }
        },
        ensureFsTimer() {
            if (this.hfsTimer) { this.hfsTimer = null; }
            this.hfsTimer = setInterval(() => {
                this.fsTick++;
                if (!this.histDragging) {
                    if (this.histPlaying && this.videoPlaying) {
                        this.histProgMs += Math.round(500 * this.speed);
                    }
                    this.histScrub = this.histPosPct;
                }
            }, 500);
        },
        onVisible() {
            const v = this.$refs.player;
            if (!v) return;
            if (this.hls && !this.histPlaying) {
                this.syncToLive();
            }
            if (this.widget.autoplay || !v.paused) {
                v.play().catch(() => {});
            }
        },
        syncToLive() {
            const v = this.$refs.player;
            if (!v || !this.hls) return;
            let b = null;
            try { if (v.buffered && v.buffered.length) b = v.buffered; } catch (e) {}
            const live = this.hls.liveSyncPosition || null;
            let seek = null;
            if (live && live > 0) {
                if (v.currentTime === 0) seek = live;
                else if ((!b || v.currentTime < b.start(0)) && !v.paused) seek = live;
            }
            if (seek === null && b && v.currentTime === 0) {
                seek = b.end(b.length - 1) - 0.5;
            }
            if (seek !== null && seek > 0) {
                try { v.currentTime = seek; } catch (e) { /* silent */ }
            }
        },
        teardown() {
            if (this.hls) {
                try { this.hls.destroy(); } catch (e) { /* silent */ }
                this.hls = null;
            }
            this.videoError = false;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.stream = StreamWidget;