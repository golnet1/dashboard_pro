const GraphWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main' },
        { key: 'graphs', label: 'tab_graphs' }
    ],
    fields: {
        main: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'period', label: 'field_period', type: 'number', default: 24 },
            { key: 'enableZoom', label: 'field_enable_zoom', type: 'checkbox', default: true },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
        graphs: [],
    },
    defaults: { icon: 'fas fa-chart-line', icon_type: 'icon', period: 24, enableZoom: true, height: 180, series: '[]' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <canvas ref="canvas" class="graph-canvas" style="width:100%;height:100%"
                @mousedown="canvasDown($event)" @mousemove="canvasMove($event)" @mouseup="canvasUp()" @mouseleave="canvasUp()"></canvas>
            <div class="graph-toolbar">
                <button type="button" :title="t('refresh')" @click.stop="fetchData"><i class="fas fa-sync"></i></button>
                <button type="button" :title="t('reset_zoom')" @click.stop="resetZoom"><i class="fas fa-search"></i></button>
            </div>
        </div>`,
    data() { return {
        seriesSpec: [], seriesPoints: [], timer: null, fetching: false,
        zoomRange: null, dragStart: null
    }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.seriesSpec = this.getSeries();
        this.fetchData();
        this.timer = setInterval(() => this.fetchData(), 60000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        getSeries() {
            let arr = [];
            try { const p = JSON.parse(this.widget.series || '[]'); if (Array.isArray(p)) arr = p; } catch(e) {}
            if (!arr.length && (this.widget.object_value || this.widget.object)) {
                arr = [{ title: this.widget.title || '', object: this.widget.object_value || this.widget.object, property: this.widget.property || '', color: '#42a5f5', fill: true, steppedLine: false, scale: 'left', round: 0 }];
            }
            return arr;
        },
        async fetchData() {
            if (this.fetching) return;
            this.fetching = true;
            try {
                const period = Number(this.widget.period) || (Number(this.widget.days) || 1) * 24;
                const days = Math.max(0.1, period / 24);
                const list = await Promise.all(this.seriesSpec.map(async s => {
                    const varname = s.object ? (s.property ? s.object + '.' + s.property : s.object) : '';
                    if (!varname) return [];
                    try {
                        const d = await dpAPI('history?' + new URLSearchParams({ object: s.object, property: s.property || '', days: String(days) }));
                        return (d && Array.isArray(d.data)) ? this.downsample(d.data, 1500) : [];
                    } catch(e) { return []; }
                }));
                this.seriesPoints = list;
                this.draw();
            } catch(e) {}
            this.fetching = false;
        },
        canvasDown(e) {
            if (!this.widget.enableZoom) return;
            const rect = this.$refs.canvas.getBoundingClientRect();
            this.dragStart = { x: e.clientX - rect.left, w: rect.width };
            if (this.zoomRange) { this.zoomRange = null; this.draw(); }
        },
        canvasMove(e) {
            if (this.dragStart === null) return;
            const rect = this.$refs.canvas.getBoundingClientRect();
            const x = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
            const f0 = this.dragStart.x / rect.width, f1 = x / rect.width;
            this.zoomRange = { start: Math.min(f0, f1), end: Math.max(f0, f1) };
            this.draw();
        },
        canvasUp() {
            if (this.dragStart === null) return;
            if (this.zoomRange && this.zoomRange.end - this.zoomRange.start < 0.03) this.zoomRange = null;
            this.dragStart = null;
            this.draw();
        },
        resetZoom() {
            this.zoomRange = null;
            this.draw();
        },
        draw() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const rect = this.$el.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.max(1, rect.width - 8);
            const h = Math.max(1, rect.height - 8);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            const any = this.seriesPoints.some(p => Array.isArray(p) && p.length);
            if (!any) { this.drawEmpty(ctx, w, h); return; }

            const list = [];
            let t0 = Infinity, t1 = -Infinity;
            this.seriesPoints.forEach((pts, si) => {
                const spec = this.seriesSpec[si] || {};
                if (!Array.isArray(pts) || !pts.length) return;
                if (spec.scale === 'none') return;
                const visible = this.zoomRange ? this.slicePoints(pts) : pts;
                const vals = [];
                visible.forEach(p => {
                    const v = parseFloat(p.value);
                    if (!isNaN(v)) vals.push(v);
                    const ts = parseInt(p.timestamp);
                    if (!isNaN(ts)) { if (ts < t0) t0 = ts; if (ts > t1) t1 = ts; }
                });
                if (!vals.length) return;
                const min = Math.min(...vals), max = Math.max(...vals);
                list.push({ si, spec, color: spec.color || '#42a5f5', min, max, range: Math.max(1e-9, max - min), side: spec.scale === 'right' ? 'right' : 'left' });
            });
            if (!list.length) { this.drawEmpty(ctx, w, h); return; }
            const hasTime = isFinite(t0) && isFinite(t1) && t1 > t0;
            const span = hasTime ? t1 - t0 : 0;

            const leftCount = list.filter(s => s.side === 'left').length;
            const rightCount = list.filter(s => s.side === 'right').length;
            const padL = leftCount ? 52 + 18 * Math.max(0, leftCount - 1) : 6;
            const padR = rightCount ? 56 + 18 * Math.max(0, rightCount - 1) : 6;
            const padT = 30, padB = hasTime ? 18 : 8;
            const pw = w - padL - padR, ph = h - padT - padB;
            if (pw <= 0 || ph <= 0) return;

            this.drawLegend(ctx, w);

            if (hasTime) {
                const xTicks = this.timeTicks(t0, t1, 7);
                xTicks.forEach(tk => {
                    const f = (tk.t - t0) / span;
                    const x = padL + f * pw;
                    ctx.strokeStyle = 'rgba(128,128,128,0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - padB); ctx.stroke();
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(this.fmtTime(tk.t, span), x, h - padB + 3);
                });
            }

            const plot = (s, raw) => {
                const pts = this.zoomRange ? this.slicePoints(raw) : raw;
                const n = pts.length;
                return pts.map((p, i) => {
                    const v = parseFloat(p.value);
                    const y = h - padB - ((v - s.min) / s.range) * ph;
                    const ts = parseInt(p.timestamp);
                    let x;
                    if (hasTime && !isNaN(ts)) x = padL + ((ts - t0) / span) * pw;
                    else x = padL + (n > 1 ? (i / (n - 1)) : 0.5) * pw;
                    return { x, y, v };
                });
            };

            const drawSeries = (s, si) => {
                const pts = this.seriesPoints[s.si];
                const coords = plot(s, pts);
                const idx = list.filter((e, k) => k < si && e.side === s.side).length;
                this.gridL = padL;
                this.gridR = w - padR;
                if (s.side === 'left') {
                    const lx = padL - 6 - idx * 15;
                    this.drawAxisLabels(ctx, lx, h, padT, padB, s);
                } else {
                    const lx = w - padR + 6 + idx * 15;
                    this.drawAxisLabels(ctx, lx, h, padT, padB, s, true);
                }
                if (coords.length < 2) { if (coords.length) this.drawDot(ctx, coords[0], s.color); return; }

                if (s.spec.fill) {
                    ctx.fillStyle = s.color + '2e';
                    ctx.beginPath();
                    ctx.moveTo(coords[0].x, h - padB);
                    coords.forEach(c => ctx.lineTo(c.x, c.y));
                    ctx.lineTo(coords[coords.length - 1].x, h - padB);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.strokeStyle = s.color;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                coords.forEach((c, i) => {
                    if (s.spec.steppedLine && i > 0) {
                        ctx.lineTo(c.x, coords[i - 1].y);
                        ctx.lineTo(c.x, c.y);
                    } else {
                        i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
                    }
                });
                ctx.stroke();
            };

            list.forEach(drawSeries);
        },
        drawAxisLabels(ctx, x, h, padT, padB, s, right) {
            const yTop = padT, yBot = h - padB;
            ctx.strokeStyle = s.color + '55';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, yTop);
            ctx.lineTo(x, yBot);
            ctx.stroke();
            ctx.fillStyle = s.color;
            ctx.font = '11px sans-serif';
            ctx.textBaseline = 'middle';
            const ticks = this.niceTicks(s.min, s.max, 5).filter(t => t >= s.min && t <= s.max);
            ticks.forEach(t => {
                const y = yBot - ((t - s.min) / s.range) * (yBot - yTop);
                ctx.strokeStyle = s.color + '2e';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 4]);
                ctx.beginPath();
                ctx.moveTo(this.gridL, y);
                ctx.lineTo(this.gridR, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(x - (right ? 4 : 4), y);
                ctx.lineTo(x + (right ? 4 : 4), y);
                ctx.stroke();
                if (right) {
                    ctx.textAlign = 'left';
                    ctx.fillText(this.fmtY(t), x + 5, y);
                } else {
                    ctx.textAlign = 'right';
                    ctx.fillText(this.fmtY(t), x - 5, y);
                }
            });
        },
        drawLegend(ctx, w) {
            let x = 64, y = 10;
            ctx.font = '14px sans-serif';
            ctx.textBaseline = 'middle';
            for (let si = 0; si < this.seriesSpec.length; si++) {
                const spec = this.seriesSpec[si] || {};
                const pts = this.seriesPoints[si];
                if (!Array.isArray(pts) || !pts.length) continue;
                if (spec.scale === 'none') continue;
                const color = spec.color || '#42a5f5';
                const title = (spec.title || '').trim() || (spec.object ? spec.object + (spec.property ? '.' + spec.property : '') : 'Серия');
                const txt = title.length > 30 ? title.slice(0, 27) + '...' : title;
                const tw = ctx.measureText(txt).width;
                if (x + 18 + tw > w - 8) break;
                ctx.fillStyle = color;
                ctx.fillRect(x, y + 1, 13, 13);
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.textAlign = 'left';
                ctx.fillText(txt, x + 18, y + 8);
                x += 18 + tw + 18;
            }
        },
        drawEmpty(ctx, w, h) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.t('no_data'), w / 2, h / 2);
        },
        niceTicks(min, max, count) {
            count = count || 4;
            const span = max - min;
            if (span <= 0 || !isFinite(span)) return [min];
            const step = Math.pow(10, Math.floor(Math.log10(span / count)));
            const err = span / count / step;
            const step2 = step * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
            const out = [];
            for (let i = Math.floor(min / step2); i <= Math.ceil(max / step2); i++) out.push(Number((i * step2).toFixed(10)));
            return out;
        },
        fmtY(v) {
            if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
            const s = v.toFixed(2).replace(/\.?0+$/, '');
            return s.length <= 7 ? s : v.toFixed(1);
        },
        timeTicks(t0, t1, count) {
            const span = t1 - t0;
            const secs = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 345600, 604800, 1209600, 2419200];
            let step = span / (count || 4);
            let st = secs.find(s => s >= step) || secs[secs.length - 1];
            const out = [];
            const start = Math.floor(t0 / st) * st;
            for (let t = start; t <= t1; t += st) if (t >= t0 - st) out.push({ t });
            if (out.length < 2) { out.length = 0; out.push({ t: t0 }, { t: t1 }); }
            return out;
        },
        fmtTime(t, span) {
            const d = new Date(t * 1000);
            const p = n => (n < 10 ? '0' : '') + n;
            const hm = p(d.getHours()) + ':' + p(d.getMinutes());
            if (span <= 6 * 3600) return hm;
            return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ' + hm;
        },
        downsample(pts, max) {
            if (!Array.isArray(pts) || pts.length <= max) return pts || [];
            const count = max * 2;
            const bucket = Math.max(1, Math.floor(pts.length / count));
            const out = [];
            for (let i = 0; i < pts.length; i += bucket) {
                const seg = pts.slice(i, i + bucket);
                if (!seg.length) continue;
                let mn = seg[0], mx = seg[0];
                seg.forEach(p => {
                    const v = parseFloat(p.value);
                    if (v < parseFloat(mn.value)) mn = p;
                    if (v > parseFloat(mx.value)) mx = p;
                });
                out.push(mn);
                if (mn !== mx) out.push(mx);
            }
            return out;
        },
        slicePoints(pts) {
            const r = this.zoomRange;
            if (!r || !pts.length) return pts;
            const s = Math.floor(r.start * pts.length), e = Math.ceil(r.end * pts.length);
            return pts.slice(Math.max(0, s), Math.min(pts.length, e));
        },
        drawDot(ctx, c, color) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.graph = GraphWidget;