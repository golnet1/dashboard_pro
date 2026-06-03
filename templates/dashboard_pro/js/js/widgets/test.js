const TestWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Test' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:12px;font-size:.9rem;color:rgba(255,255,255,.6);text-align:center">
                <div>Test widget<br><small>v1.0</small></div>
            </div>
        </div>`,
    data() { return {}; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    }
};
