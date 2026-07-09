const ClockWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'locale', label: 'field_time_format', type: 'text', default: 'ru-RU', placeholder: 'ru-RU' },
            { key: 'sizeTime', label: 'Размер времени (px)', type: 'number', default: 48 },
            { key: 'sizeDate', label: 'Размер даты (px)', type: 'number', default: 16 },
            { key: 'viewTime', label: 'Показывать время', type: 'checkbox', default: true },
            { key: 'viewDate', label: 'Показывать дату', type: 'checkbox', default: true },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
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