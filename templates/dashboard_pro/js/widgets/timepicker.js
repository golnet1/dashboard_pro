const TimePickerWidget = {
    props: ['widget'],
    defaults: { icon: 'fas fa-clock' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Время' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px 12px">
                <div style="text-align:center">
                    <div style="font-size:2.5rem;font-weight:300;color:rgba(255,255,255,.87);letter-spacing:2px">{{ time }}</div>
                    <div style="font-size:.85rem;color:rgba(255,255,255,.5)">{{ dateStr }}</div>
                </div>
            </div>
        </div>`,
    data() { return { now: new Date(), timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        time() {
            const h = String(this.now.getHours()).padStart(2, '0');
            const m = String(this.now.getMinutes()).padStart(2, '0');
            const s = String(this.now.getSeconds()).padStart(2, '0');
            return h + ':' + m + ':' + s;
        },
        dateStr() {
            const d = String(this.now.getDate()).padStart(2, '0');
            const m = String(this.now.getMonth() + 1).padStart(2, '0');
            const y = this.now.getFullYear();
            return d + '.' + m + '.' + y;
        }
    },
    mounted() { this.timer = setInterval(() => this.now = new Date(), 1000); },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); }
};
