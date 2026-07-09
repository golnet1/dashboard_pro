const ButtonWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
            { key: 'buttonText', label: 'Текст кнопки', type: 'text', default: 'Выполнить' },
            { key: 'value', label: 'Значение', type: 'text', default: '1' },
            { key: 'method', label: 'Метод', type: 'text', placeholder: 'method_name' },
            { key: 'command', label: 'Команда', type: 'text', placeholder: 'Команда (если есть)' },
            { key: 'hold', label: 'Удержание (сек)', type: 'number', default: 1 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-play', icon_type: 'icon', buttonText: 'Выполнить', hold: 1, value: '1', command: '', method: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Кнопка' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px">
                <button class="v-btn v-btn--is-elevated v-btn--has-bg theme--dark" style="min-width:120px" :class="{ 'v-btn--loading': loading }" @click="execute" :disabled="loading">
                    <span class="v-btn__content">
                        <i v-if="widget.icon" :class="widget.icon" style="margin-right:6px"></i>
                        {{ loading ? '...' : (widget.buttonText || 'Выполнить') }}
                    </span>
                </button>
            </div>
        </div>`,
    data() { return { loading: false }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async execute() {
            if (this.loading) return;
            this.loading = true;
            try {
                if (this.widget.method) {
                    const m = this.widget.method;
                    const p = m.includes('/') ? m.split('/') : [m, ''];
                    await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
                } else if (this.widget.object && this.widget.value !== undefined) {
                    const params = { object: this.widget.object, value: this.widget.value };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
                if (this.widget.command) {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: this.widget.command }));
                }
            } catch (e) { console.error(e); }
            if (this.widget.hold) {
                setTimeout(() => this.loading = false, (this.widget.hold || 1) * 1000);
            } else {
                this.loading = false;
            }
        }
    }
};