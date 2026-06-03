const GroupWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'group_id', label: 'ID группы', type: 'text' },
        ],
    },
    defaults: { icon: 'fas fa-layer-group', group_id: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Группа' }}</div>
                <span v-if="count" style="margin-left:auto;font-size:.75rem;color:rgba(255,255,255,.4);padding-right:8px">{{ count }} видж.</span>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:12px;text-align:center">
                <div style="font-size:.85rem;color:rgba(255,255,255,.5)">
                    <i class="fas fa-layer-group" style="font-size:1.5rem;display:block;margin-bottom:6px;color:rgba(255,255,255,.2)"></i>
                    Группа виджетов<br>
                    <small>{{ widget.group_id || 'Внутренняя группа' }}</small>
                </div>
            </div>
        </div>`,
    data() { return {}; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        count() { return this.widget.children ? this.widget.children.length : 0; }
    }
};
