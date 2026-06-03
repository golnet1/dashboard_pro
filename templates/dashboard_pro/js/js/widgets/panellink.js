const PanelLinkWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle" style="cursor:pointer" @click="goToPanel">
            <div v-if="panelImage" style="height:60%;overflow:hidden">
                <img :src="panelImage" style="width:100%;height:100%;object-fit:contain">
            </div>
            <div class="widget-v-card__header">
                <i v-if="displayIcon" :class="displayIcon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ displayTitle }}</div>
                <i class="fas fa-chevron-right" style="color:rgba(255,255,255,.3);font-size:.85rem;margin-left:auto"></i>
            </div>
        </div>`,
    data() {
        return { targetPanel: null };
    },
    mounted() {
        this.findPanel();
    },
    computed: {
        displayIcon() {
            return this.widget.icon || (this.targetPanel && this.targetPanel.icon) || 'fas fa-link';
        },
        displayTitle() {
            return this.widget.title || (this.targetPanel && this.targetPanel.title) || 'Панель';
        },
        panelImage() {
            return this.widget.image || (this.targetPanel && this.targetPanel.image) || '';
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        findPanel() {
            const vm = window.__dp_vm;
            if (vm && vm.panels && this.widget.panel) {
                this.targetPanel = vm.panels.find(p => p.name === this.widget.panel);
            }
        },
        goToPanel() {
            const vm = window.__dp_vm;
            if (vm && vm.panels && this.widget.panel) {
                const p = vm.panels.find(p => p.name === this.widget.panel);
                if (p) vm.selectPanel(p);
            }
        }
    }
};