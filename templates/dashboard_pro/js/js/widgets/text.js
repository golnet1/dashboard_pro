const TextWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Текст' }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px;flex:1;display:flex;align-items:center">
                <div style="font-size:.95rem;line-height:1.5;color:rgba(255,255,255,.87)">{{ displayText }}</div>
            </div>
        </div>`,
    data() {
        return { value: null, timer: null };
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        let prop = this.widget.property;
        if (obj && prop) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        displayText() {
            if (this.value === null) return this.widget.text || this.widget.subtitle || '—';
            return this.value;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    this.value = d.value;
                }
            } catch (e) { /* silent */ }
        }
    }
};