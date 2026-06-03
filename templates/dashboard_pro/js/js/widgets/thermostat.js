const ThermostatWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Термостат' }}</div>
                <div class="widget-v-card__spacer"></div>
                <span :style="'font-size:.72rem;padding:2px 8px;border-radius:10px;' + (isOn ? 'background:rgba(239,68,68,.2);color:#ef4444' : 'background:rgba(100,116,139,.2);color:#64748b')">{{ isOn ? 'ON' : 'OFF' }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="display:flex;align-items:center;gap:16px">
                    <button @click="adjustTarget(-1)" :disabled="loading" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
                    <div style="text-align:center">
                        <div style="font-size:2.2rem;font-weight:300;color:rgba(255,255,255,.87)">{{ target }}</div>
                        <div style="font-size:.7rem;color:rgba(255,255,255,.4)">°C</div>
                    </div>
                    <button @click="adjustTarget(1)" :disabled="loading" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
                </div>
                <div v-if="currentTemp !== null" style="font-size:.8rem;color:rgba(255,255,255,.5)">Сейчас: {{ currentTemp }}°C</div>
            </div>
        </div>`,
    data() {
        return { target: 22, currentTemp: null, isOn: false, loading: false, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.load();
        this.timer = setInterval(() => this.load(), 10000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load() {
            if (this.widget.object_current) {
                try {
                    const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_current }));
                    if (!d.error && d.value !== undefined) this.currentTemp = parseFloat(d.value);
                } catch(e) {}
            }
            if (this.widget.object_target) {
                try {
                    const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_target }));
                    if (!d.error && d.value !== undefined) this.target = parseFloat(d.value) || 22;
                } catch(e) {}
            }
            if (this.widget.object_status) {
                try {
                    const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_status }));
                    if (!d.error) this.isOn = String(d.value) === '1' || String(d.value) === 'ON';
                } catch(e) {}
            }
        },
        async adjustTarget(delta) {
            this.loading = true;
            const obj = this.widget.object_target;
            if (obj) {
                this.target = Math.round(Math.min(Math.max(this.target + delta, this.widget.min || 5), this.widget.max || 35));
                try {
                    await dpAPI('setProperty?' + new URLSearchParams({ object: obj, value: String(this.target) }));
                } catch(e) {}
            }
            this.loading = false;
        }
    }
};
