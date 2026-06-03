const TimelineWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Таймлайн' }}</div>
            </div>
            <div class="widget-v-card__body" style="flex:1;overflow:auto;padding:8px 12px 8px 20px">
                <div v-for="(ev, i) in events" :key="i" style="position:relative;padding-left:20px;padding-bottom:12px;border-left:2px solid rgba(255,255,255,.12)">
                    <div style="position:absolute;left:-5px;top:4px;width:8px;height:8px;border-radius:50%;background:rgba(66,165,245,.8)"></div>
                    <div style="font-size:.75rem;color:rgba(255,255,255,.4)">{{ ev.time }}</div>
                    <div style="font-size:.85rem;color:rgba(255,255,255,.8)">{{ ev.text }}</div>
                </div>
                <div v-if="!events.length" style="text-align:center;padding:16px;color:rgba(255,255,255,.35);font-size:.8rem">Нет событий</div>
            </div>
        </div>`,
    data() { return { events: [], timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.load();
        if (this.widget.url) this.timer = setInterval(() => this.load(), 30000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async load() {
            const url = this.widget.url || '';
            const obj = this.widget.object;
            if (url) {
                try {
                    const r = await fetch(url);
                    const d = await r.json();
                    if (Array.isArray(d)) this.events = d.slice(0, 30).map(e => ({
                        time: e.time || e.timestamp || '',
                        text: e.text || e.title || e.message || ''
                    }));
                } catch(e) {}
            } else if (obj) {
                try {
                    const d = await dpAPI('history?' + new URLSearchParams({ object: obj, days: '1' }));
                    if (!d.error && Array.isArray(d.data)) {
                        this.events = d.data.slice(-30).reverse().map(p => ({
                            time: p.timestamp ? new Date(p.timestamp * 1000).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
                            text: String(p.value)
                        }));
                    }
                } catch(e) {}
            }
        }
    }
};
