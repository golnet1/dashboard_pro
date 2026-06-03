const StatusWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Статус' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;gap:12px;padding:8px 12px;flex:1">
                <i v-if="statusIcon" :class="statusIcon" :style="'font-size:2rem;color:' + (statusColor || 'rgba(255,255,255,.6)')"></i>
                <div v-if="statusText" style="font-size:1.1rem;font-weight:500;color:rgba(255,255,255,.87)">{{ statusText }}</div>
                <div v-else style="font-size:.85rem;color:rgba(255,255,255,.5)">Нет данных</div>
            </div>
        </div>`,
    data() { return { value: null, timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        statuses() {
            try { return JSON.parse(this.widget.statuses || '[]'); } catch { return []; }
        },
        status() {
            if (this.value === null) return null;
            const v = parseFloat(this.value);
            return this.statuses.find(s => {
                const low = parseFloat(s.status);
                const high = s.status2 !== undefined && s.status2 !== '' ? parseFloat(s.status2) : NaN;
                if (!isNaN(high)) return v >= low && v <= high;
                return v >= low;
            }) || null;
        },
        statusIcon() { return this.status ? this.status.icon : (this.widget.icon || null); },
        statusColor() { return this.status ? this.status.color : null; },
        statusText() { return this.status ? this.status.title : (this.value !== null ? this.value : null); }
    },
    mounted() {
        this.load();
        const obj = this.widget.object_status || this.widget.object;
        if (obj) this.timer = setInterval(() => this.load(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load() {
            const obj = this.widget.object_status || this.widget.object;
            const prop = this.widget.property;
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop || 'status' }));
                if (!d.error && d.value !== undefined) this.value = d.value;
            } catch(e) {}
        }
    }
};
