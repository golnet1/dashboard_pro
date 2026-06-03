const IFrameWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle" style="padding:0;overflow:hidden">
            <iframe v-if="widget.url" :src="widget.url" style="width:100%;height:100%;border:none" allowfullscreen></iframe>
            <div v-else class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;color:rgba(255,255,255,.38)">
                <div style="text-align:center">
                    <i class="fas fa-window-maximize" style="font-size:2rem;margin-bottom:8px;display:block"></i>
                    <span>{{ widget.title || 'iFrame' }}</span>
                </div>
            </div>
        </div>`,
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    }
};