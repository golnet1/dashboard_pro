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
            { key: 'autoplay', label: 'field_video_autoplay', type: 'checkbox', default: false },
            { key: 'loop', label: 'field_video_loop', type: 'checkbox', default: false },
            { key: 'muted', label: 'field_video_muted', type: 'checkbox', default: true },
            { key: 'nocontrols', label: 'field_video_nocontrols', type: 'checkbox', default: false },
        ],
        advanced: [
            { key: 'color', label: 'field_color', type: 'color' },
        ],
    },
    defaults: { icon: 'fas fa-satellite-dish', source_type: 'url', url: '', object: '', property: '', host: '', camera: '', onvif_url: '', onvif_login: '', onvif_password: '', autoplay: false, muted: true, loop: false, nocontrols: false, height: 200 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="padding:0;overflow:hidden">
            <video v-if="videoUrl" ref="player"
                :autoplay="!!widget.autoplay" :muted="!!widget.muted" :loop="!!widget.loop"
                :controls="!widget.nocontrols" playsinline preload="metadata"
                style="width:100%;height:100%;object-fit:contain;background:#000"></video>
            <div v-else class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;color:rgba(255,255,255,.38)">
                <div style="text-align:center">
                    <i class="fas fa-satellite-dish" style="font-size:2rem;margin-bottom:8px;display:block"></i>
                    <span>{{ widget.title || t('widget_stream') }}</span>
                </div>
            </div>
        </div>`,
    data() {
        return { hls: null, videoError: false, objValue: null, valueTimer: null, resolvedRtsp: null };
    },
    watch: {
        videoUrl() { this.$nextTick(() => this.setup()); },
        'widget.source_type'() { this.resolveOnvif(); this.$nextTick(() => this.setup()); },
        'widget.autoplay'() { this.$nextTick(() => this.tryPlay()); },
    },
    mounted() {
        this.loadObjValue();
        if (this.widget.object && !window.__dpWsLive) this.valueTimer = setInterval(() => this.loadObjValue(), 3000);
        this.resolveOnvif();
        this.$nextTick(() => this.setup());
    },
    beforeUnmount() {
        if (this.valueTimer) clearInterval(this.valueTimer);
        this.teardown();
    },
    computed: {
        sourceType() {
            const st = this.widget.source_type;
            if (st === 'go2rtc' || st === 'onvif') return st;
            if (st !== undefined && st !== null && String(st) === 'property') return 'property';
            return 'url';
        },
        go2rtcUrl() {
            const host = String(this.widget.host || '').trim().replace(/\/+$/, '');
            if (!host || !this.widget.camera) return '';
            const base = /^https?:\/\//i.test(host) ? host : 'http://' + host;
            return base + '/api/stream.m3u8?src=' + encodeURIComponent(String(this.widget.camera));
        },
        videoUrl() {
            const t = this.sourceType;
            if (t === 'go2rtc') return this.go2rtcUrl;
            if (t === 'onvif') {
                if (!this.resolvedRtsp) return '';
                return this.bridgeUrl(String(this.resolvedRtsp));
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
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        isHlsUrl(url) {
            return /\.m3u8(\?|#|$)/i.test(url) || /application\/x-mpegURL/i.test(url) || url.includes('hls_bridge');
        },
        bridgeUrl(src) {
            return '/api.php/module/dashboard_pro/hls_bridge?src=' + encodeURIComponent(src);
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
            if (this.sourceType !== 'onvif') { this.resolvedRtsp = null; return; }
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
                } else {
                    this.resolvedRtsp = null;
                }
            } catch (e) { this.resolvedRtsp = null; }
        },
        setup() {
            this.teardown();
            const v = this.$refs.player;
            const url = this.videoUrl;
            if (!v || !url) return;
            const hlsUrl = this.isHlsUrl(url);
            const nativeHls = v.canPlayType('application/vnd.apple.mpegurl') ? true : false;
            if (hlsUrl && window.Hls && window.Hls.isSupported() && !nativeHls) {
                this.hls = new window.Hls();
                this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => this.tryPlay());
                this.hls.on(window.Hls.Events.ERROR, (ev, data) => {
                    if (data && data.fatal) this.videoError = true;
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
            if (v && this.widget.autoplay) v.play().catch(() => {});
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