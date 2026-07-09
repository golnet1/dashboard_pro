const CalendarWidget = {
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
    defaults: { icon: 'fas fa-calendar-alt', icon_type: 'icon' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Календарь' }}</div>
                <div class="widget-v-card__spacer"></div>
                <button class="btn-icon" @click="prevMonth" style="font-size:.9rem">&lsaquo;</button>
                <span style="font-size:.8rem;margin:0 8px;color:rgba(255,255,255,.7)">{{ monthName }} {{ year }}</span>
                <button class="btn-icon" @click="nextMonth" style="font-size:.9rem">&rsaquo;</button>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px">
                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:.72rem">
                    <div v-for="d in dayNames" :key="'h'+d" style="color:rgba(255,255,255,.4);padding:2px 0">{{ d }}</div>
                    <div v-for="(day,i) in days" :key="i"
                        :style="'padding:4px 0;border-radius:4px;cursor:default;' +
                            (day === 0 ? '' : (day === today ? 'background:var(--primary);color:#fff;font-weight:600' : 'color:rgba(255,255,255,.7)'))">
                        {{ day || '' }}
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return { year: 0, month: 0, today: 0, days: [], dayNames: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        monthName() {
            const m = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Окторябрь','Ноябрь','Декабрь'];
            return m[this.month];
        }
    },
    mounted() { this.renderMonth(new Date()); },
    methods: {
        renderMonth(d) {
            this.year = d.getFullYear();
            this.month = d.getMonth();
            this.today = d.getDate();
            const first = new Date(this.year, this.month, 1).getDay() || 7;
            const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
            this.days = [];
            for (let i = 1; i < first; i++) this.days.push(0);
            for (let i = 1; i <= daysInMonth; i++) this.days.push(i);
        },
        prevMonth() { this.renderMonth(new Date(this.year, this.month - 1, 1)); },
        nextMonth() { this.renderMonth(new Date(this.year, this.month + 1, 1)); }
    }
};
