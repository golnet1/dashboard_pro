const EmptyWidget = {
    props: ['widget'],
    template: `<div class="widget-v-card" :style="cardStyle" style="display:flex;align-items:center;justify-content:center;min-height:60px"><span v-if="widget.label" style="color:rgba(255,255,255,.3);font-size:.8rem">{{ widget.label }}</span></div>`,
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            if (this.widget.transparent) s.background = 'transparent';
            return s;
        }
    }
};
