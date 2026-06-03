const CalendarWidget = {
    props: ['widget'],
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
