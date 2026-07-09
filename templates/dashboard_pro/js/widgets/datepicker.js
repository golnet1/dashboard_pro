const DatePickerWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-calendar-alt', icon_type: 'icon' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_datepicker') }}</div>
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
            const months = [this.t('month_jan'),this.t('month_feb'),this.t('month_mar'),this.t('month_apr'),this.t('month_may'),this.t('month_jun'),this.t('month_jul'),this.t('month_aug'),this.t('month_sep'),this.t('month_oct'),this.t('month_nov'),this.t('month_dec')];
            return months[this.now.getMonth()] + ' ' + this.now.getFullYear();
        },
        weekday() {
            const days = [this.t('day_sunday'),this.t('day_monday'),this.t('day_tuesday'),this.t('day_wednesday'),this.t('day_thursday'),this.t('day_friday'),this.t('day_saturday')];
            return days[this.now.getDay()];
        }
    },
    mounted() { this.timer = setInterval(() => this.now = new Date(), 60000); },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); }
};
