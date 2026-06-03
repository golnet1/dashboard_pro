const ClockWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'locale', label: 'Формат времени', type: 'text', default: 'ru-RU', placeholder: 'ru-RU' },
            { key: 'sizeTime', label: 'Размер времени (px)', type: 'number', default: 48 },
            { key: 'sizeDate', label: 'Размер даты (px)', type: 'number', default: 16 },
            { key: 'viewTime', label: 'Показывать время', type: 'checkbox', default: true },
            { key: 'viewDate', label: 'Показывать дату', type: 'checkbox', default: true },
        ],
    },
    defaults: { icon: 'fas fa-clock', locale: 'ru-RU', viewTime: true, viewDate: true, sizeTime: 48, sizeDate: 16 },
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