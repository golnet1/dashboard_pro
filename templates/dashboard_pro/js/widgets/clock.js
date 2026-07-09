const ClockWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'locale', label: 'Формат времени', type: 'text', default: 'ru-RU', placeholder: 'ru-RU' },
            { key: 'sizeTime', label: 'Размер времени (px)', type: 'number', default: 48 },
            { key: 'sizeDate', label: 'Размер даты (px)', type: 'number', default: 16 },
            { key: 'viewTime', label: 'Показывать время', type: 'checkbox', default: true },
            { key: 'viewDate', label: 'Показывать дату', type: 'checkbox', default: true },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-clock', icon_type: 'icon', locale: 'ru-RU', viewTime: true, viewDate: true, sizeTime: 48, sizeDate: 16 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div v-if="widget.viewTime || widget.viewTime == undefined" :style="'font-size:' + (widget.sizeTime || 48) + 'px;font-weight:300;color:rgba(255,255,255,.87);letter-spacing:2px;line-height:1.2'">{{ time }}</div>
            <div v-if="widget.viewDate || widget.viewDate == undefined" :style="'font-size:' + (widget.sizeDate || 16) + 'px;color:rgba(255,255,255,.5);margin-top:4px'">{{ date }}</div>
        </div>`,
    data() {
        return { time: '', date: '', timer: null };
    },
    mounted() {
        this.update();
        this.timer = setInterval(() => this.update(), 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        update() {
            const now = new Date();
            this.time = now.toLocaleTimeString(this.widget.locale || 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.date = now.toLocaleDateString(this.widget.locale || 'ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
        }
    }
};