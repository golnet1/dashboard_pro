const PanelLinkWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'panel', label: 'Панель', type: 'panel_select' },
            { key: 'icon', label: 'Своя иконка', type: 'text', placeholder: 'fas fa-link' },
            { key: 'image', label: 'Своё изображение', type: 'text', placeholder: 'URL' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-link', panel: '', image: '' },
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