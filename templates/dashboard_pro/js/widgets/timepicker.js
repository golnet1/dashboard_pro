const TimePickerWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-clock', icon_type: 'icon' },
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
