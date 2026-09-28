const VideoWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'source_type', label: 'field_video_source', type: 'select', row: 'src_row', default: 'url', options: [{value:'url',label:'opt_url'},{value:'property',label:'opt_property'}] },
            { key: 'url', label: 'field_video_url', type: 'text', row: 'src_row', placeholder: 'https://example.com/video.mp4', showIf: { source_type: 'url' } },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop', showIf: { source_type: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop', showIf: { source_type: 'property' } },
            { key: 'autoplay', label: 'field_video_autoplay', type: 'checkbox', default: false },
            { key: 'loop', label: 'field_video_loop', type: 'checkbox', default: false },
            { key: 'muted', label: 'field_video_muted', type: 'checkbox', default: true },
            { key: 'nocontrols', label: 'field_video_nocontrols', type: 'checkbox', default: false },
        ],
        advanced: [
            { key: 'color', label: 'field_color', type: 'color' },
        ],
    },
    defaults: { icon: 'fas fa-video', source_type: 'url', url: '', object: '', property: '', autoplay: false, muted: true, loop: false, nocontrols: false, height: 200 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="padding:0;overflow:hidden">
            <video v-if="videoUrl" ref="player"
                :autoplay="!!widget.autoplay" :muted="!!widget.muted" :loop="!!widget.loop"
                :controls="!widget.nocontrols" playsinline preload="metadata"
                style="width:100%;height:100%;object-fit:contain;background:#000"></video>
            <div v-else class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;color:rgba(255,255,255,.38)">
                <div style="text-align:center">
                    <i class="fas fa-video" style="font-size:2rem;margin-bottom:8px;display:block"></i>
                    <span>{{ widget.title || t('widget_video') }}</span>
                </div>
            </div>
        </div>`,
    data() {
        return { hls: null, videoError: false, objValue: null, valueTimer: null };
    },
    watch: {
        videoUrl() { this.$nextTick(() => this.setup()); },
        'widget.autoplay'() { this.$nextTick(() => this.tryPlay()); },
    },
    mounted() {
        this.loadObjValue();
        if (this.widget.object && !window.__dpWsLive) this.valueTimer = setInterval(() => this.loadObjValue(), 3000);
        this.$nextTick(() => this.setup());
    },
    beforeUnmount() {
        if (this.valueTimer) clearInterval(this.valueTimer);
        this.teardown();
    },
    computed: {
        sourceType() {
            const st = this.widget.source_type;
            return (st !== undefined && st !== null && String(st) === 'property') ? 'property' : 'url';
        },
        videoUrl() {
            let url = '';
            if (this.sourceType === 'property') {
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
            return url.trim();
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        isHlsUrl(url) {
            return /\.m3u8(\?|#|$)/i.test(url) || /application\/x-mpegURL/i.test(url);
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
window.DpWidgets.video = VideoWidget;