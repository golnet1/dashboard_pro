const UnknownWidget = {
    props: ['widget'],
    defaults: { icon: 'fas fa-question-circle' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Неизвестный' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:12px;font-size:.85rem;color:rgba(255,255,255,.5);text-align:center">
                <div>Неизвестный тип виджета: <strong>{{ widget.type }}</strong></div>
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
