const DatePickerWidget = {
    props: ['widget'],
    defaults: { icon: 'fas fa-calendar-alt' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Дата' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px 12px">
                <div style="text-align:center">
                    <div style="font-size:1.8rem;font-weight:300;color:rgba(255,255,255,.87)">{{ day }}</div>
                    <div style="font-size:.9rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px">{{ monthYear }}</div>
                    <div style="font-size:.8rem;color:rgba(255,255,255,.35);margin-top:4px">{{ weekday }}</div>
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
        day() { return String(this.now.getDate()).padStart(2, '0'); },
        monthYear() {
            const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
            return months[this.now.getMonth()] + ' ' + this.now.getFullYear();
        },
        weekday() {
            const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
            return days[this.now.getDay()];
        }
    },
    mounted() { this.timer = setInterval(() => this.now = new Date(), 60000); },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); }
};
